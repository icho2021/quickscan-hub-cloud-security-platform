import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Note: scanner.js and tester.js live in the worker directories, not here.
// The API only queues jobs and reads results — it never runs scans itself.

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const REGION = process.env.AWS_REGION || 'us-west-2';
const SCAN_TABLE = process.env.DYNAMODB_TABLE || 'quickscan-scans';
const QUEUE_URL = process.env.SQS_QUEUE_URL || '';
const REPORT_BUCKET = process.env.S3_BUCKET || 'quickscan-reports';

// ─── AWS Clients ───────────────────────────────────────────────────────────
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

// ─── Express App ───────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'QuickScan API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── Info Endpoints ────────────────────────────────────────────────────────

// List available pentest test types
app.get('/api/tests', (req, res) => {
  res.json({
    totalTests: 6,
    tests: [
      { id: 'AUTH_MISSING', name: 'Missing Authentication', severity: 'HIGH', category: 'Authentication' },
      { id: 'SQL_INJECTION', name: 'SQL Injection', severity: 'HIGH', category: 'Injection' },
      { id: 'NOSQL_INJECTION', name: 'NoSQL Injection', severity: 'HIGH', category: 'Injection' },
      { id: 'RATE_LIMITING', name: 'Rate Limiting', severity: 'MEDIUM', category: 'Availability' },
      { id: 'SECURITY_HEADERS', name: 'Security Headers', severity: 'MEDIUM', category: 'Configuration' },
      { id: 'SENSITIVE_DATA_EXPOSURE', name: 'Sensitive Data Exposure', severity: 'HIGH', category: 'Data Protection' }
    ]
  });
});

// List SAST vulnerability types
app.get('/api/vulnerabilities', (req, res) => {
  res.json({
    supported: [
      { id: 'HARDCODED_SECRET', name: 'Hardcoded Secrets', severity: 'HIGH' },
      { id: 'SQL_INJECTION', name: 'SQL Injection Risk', severity: 'HIGH' },
      { id: 'NOSQL_INJECTION', name: 'NoSQL Injection Risk', severity: 'HIGH' },
      { id: 'XSS', name: 'Cross-Site Scripting', severity: 'HIGH' },
      { id: 'PATH_TRAVERSAL', name: 'Path Traversal', severity: 'HIGH' },
      { id: 'INSECURE_FUNCTION', name: 'Insecure Function Usage', severity: 'HIGH' },
      { id: 'HARDCODED_IP', name: 'Hardcoded IP Address', severity: 'MEDIUM' },
      { id: 'INSECURE_RANDOM', name: 'Insecure Randomness', severity: 'MEDIUM' },
      { id: 'SENSITIVE_DATA_LOG', name: 'Sensitive Data Logging', severity: 'MEDIUM' },
      { id: 'SECURITY_TODO', name: 'Security TODO/FIXME', severity: 'LOW' },
      { id: 'WEAK_CRYPTO', name: 'Weak Cryptography', severity: 'MEDIUM' }
    ]
  });
});

// ─── Submit a New Scan ─────────────────────────────────────────────────────
app.post('/api/scans', async (req, res) => {
  try {
    const { type, code, filename, targetUrl, options } = req.body;

    // Validate scan type
    if (!type || !['sast', 'pentest'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid scan type',
        message: 'type must be "sast" or "pentest"'
      });
    }

    // Validate payload
    if (type === 'sast' && !code) {
      return res.status(400).json({
        error: 'No code provided',
        message: 'SAST scans require a "code" field'
      });
    }
    if (type === 'pentest' && !targetUrl) {
      return res.status(400).json({
        error: 'No target URL provided',
        message: 'Pentest scans require a "targetUrl" field'
      });
    }
    if (type === 'pentest') {
      try { new URL(targetUrl); }
      catch { return res.status(400).json({ error: 'Invalid URL format' }); }
    }

    const scanId = uuidv4();
    const now = new Date().toISOString();

    // Build the scan record
    const scanRecord = {
      id: scanId,
      type,
      status: 'QUEUED',
      createdAt: now,
      updatedAt: now,
      ...(type === 'sast' ? { filename: filename || 'untitled.js' } : { targetUrl })
    };

    // Write to DynamoDB
    await docClient.send(new PutCommand({
      TableName: SCAN_TABLE,
      Item: scanRecord
    }));

    // Build SQS message
    const messageBody = {
      scanId,
      type,
      ...(type === 'sast'
        ? { code, filename: filename || 'untitled.js' }
        : { targetUrl, options: options || {} })
    };

    // Send to SQS
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
      MessageAttributes: {
        scanType: {
          DataType: 'String',
          StringValue: type
        }
      }
    }));

    console.log(`Scan ${scanId} (${type}) queued`);

    res.status(202).json({
      scanId,
      status: 'QUEUED',
      message: `${type.toUpperCase()} scan queued successfully`
    });

  } catch (error) {
    console.error('Failed to submit scan:', error);
    res.status(500).json({ error: 'Failed to submit scan', message: error.message });
  }
});

// ─── Get Scan by ID ────────────────────────────────────────────────────────
app.get('/api/scans/:id', async (req, res) => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: SCAN_TABLE,
      Key: { id: req.params.id }
    }));

    if (!result.Item) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json(result.Item);
  } catch (error) {
    console.error('Failed to get scan:', error);
    res.status(500).json({ error: 'Failed to get scan', message: error.message });
  }
});

// ─── List All Scans ────────────────────────────────────────────────────────
app.get('/api/scans', async (req, res) => {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: SCAN_TABLE,
      Limit: 50
    }));

    // Sort by createdAt descending
    const scans = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ scans, count: scans.length });
  } catch (error) {
    console.error('Failed to list scans:', error);
    res.status(500).json({ error: 'Failed to list scans', message: error.message });
  }
});

// ─── Get Full Report (proxied from S3 — avoids browser CORS issues) ────────
app.get('/api/scans/:id/report', async (req, res) => {
  try {
    // Check DynamoDB for scan status
    const scanResult = await docClient.send(new GetCommand({
      TableName: SCAN_TABLE,
      Key: { id: req.params.id }
    }));

    if (!scanResult.Item) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    if (scanResult.Item.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Report not ready',
        status: scanResult.Item.status
      });
    }

    // Fetch the report directly from S3 and return it
    const s3Key = `reports/${req.params.id}.json`;
    const command = new GetObjectCommand({
      Bucket: REPORT_BUCKET,
      Key: s3Key
    });

    const s3Response = await s3Client.send(command);
    const bodyString = await s3Response.Body.transformToString();
    const report = JSON.parse(bodyString);

    res.json(report);
  } catch (error) {
    console.error('Failed to get report:', error);
    res.status(500).json({ error: 'Failed to get report', message: error.message });
  }
});

// ─── Internal: Update scan (called by workers via results queue or callback) ─
// This endpoint is for the workers to post results back directly.
// In production, workers write to DynamoDB/S3 directly. This is a fallback.
app.put('/api/scans/:id', async (req, res) => {
  try {
    const { status, summary, error: scanError } = req.body;

    const updateExpression = 'SET #s = :status, updatedAt = :now'
      + (summary ? ', summary = :summary' : '')
      + (scanError ? ', scanError = :err' : '');

    const expressionValues = {
      ':status': status,
      ':now': new Date().toISOString(),
      ...(summary ? { ':summary': summary } : {}),
      ...(scanError ? { ':err': scanError } : {})
    };

    await docClient.send(new UpdateCommand({
      TableName: SCAN_TABLE,
      Key: { id: req.params.id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: expressionValues
    }));

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update scan:', error);
    res.status(500).json({ error: 'Failed to update scan', message: error.message });
  }
});

// ─── Start Server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║         QuickScan Hub — API Backend           ║
  ║         Running on port ${PORT}                  ║
  ╚═══════════════════════════════════════════════╝
  
  Config:
  - Region:     ${REGION}
  - DynamoDB:   ${SCAN_TABLE}
  - SQS Queue:  ${QUEUE_URL || '(not set)'}
  - S3 Bucket:  ${REPORT_BUCKET}

  Endpoints:
  - GET  /health                - Health check
  - GET  /api/tests             - List pentest tests
  - GET  /api/vulnerabilities   - List SAST vulnerability types
  - POST /api/scans             - Submit a new scan
  - GET  /api/scans             - List all scans
  - GET  /api/scans/:id         - Get scan by ID
  - GET  /api/scans/:id/report  - Get full report (pre-signed URL)
  `);
});
