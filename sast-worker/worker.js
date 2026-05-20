import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ChangeMessageVisibilityCommand
} from '@aws-sdk/client-sqs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { scanCode } from './scanner.js';

// ─── Config ────────────────────────────────────────────────────────────────
const REGION = process.env.AWS_REGION || 'us-west-2';
const QUEUE_URL = process.env.SQS_QUEUE_URL || '';
const SCAN_TABLE = process.env.DYNAMODB_TABLE || 'quickscan-scans';
const REPORT_BUCKET = process.env.S3_BUCKET || 'quickscan-reports';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5', 10); // seconds

// ─── AWS Clients ───────────────────────────────────────────────────────────
const sqsClient = new SQSClient({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: REGION });

// ─── Update DynamoDB ───────────────────────────────────────────────────────
async function updateScan(scanId, status, summary, errorMsg) {
  const updateExpr = 'SET #s = :status, updatedAt = :now'
    + (summary ? ', summary = :summary' : '')
    + (errorMsg ? ', scanError = :err' : '');

  const exprValues = {
    ':status': status,
    ':now': new Date().toISOString(),
    ...(summary ? { ':summary': summary } : {}),
    ...(errorMsg ? { ':err': errorMsg } : {})
  };

  await docClient.send(new UpdateCommand({
    TableName: SCAN_TABLE,
    Key: { id: scanId },
    UpdateExpression: updateExpr,
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: exprValues
  }));
}

// ─── Upload Report to S3 ──────────────────────────────────────────────────
async function uploadReport(scanId, report) {
  await s3Client.send(new PutObjectCommand({
    Bucket: REPORT_BUCKET,
    Key: `reports/${scanId}.json`,
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json'
  }));
}

// ─── Process a Single SAST Scan ────────────────────────────────────────────
async function processScan(message) {
  const body = JSON.parse(message.Body);
  const { scanId, type, code, filename } = body;

  // Only process SAST messages
  if (type !== 'sast') {
    console.log(`Skipping non-SAST message: ${scanId} (type=${type})`);
    return false; // Don't delete — let the pentest worker pick it up
  }

  console.log(`Processing SAST scan: ${scanId}`);

  try {
    // Update status to PROCESSING
    await updateScan(scanId, 'PROCESSING');

    // Run the SAST scan using the provided scanner
    const vulnerabilities = scanCode(code, filename || 'untitled.js');

    // Build the full report
    const report = {
      scanId,
      type: 'sast',
      filename: filename || 'untitled.js',
      scannedAt: new Date().toISOString(),
      summary: {
        totalVulnerabilities: vulnerabilities.length,
        high: vulnerabilities.filter(v => v.severity === 'HIGH').length,
        medium: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
        low: vulnerabilities.filter(v => v.severity === 'LOW').length
      },
      vulnerabilities
    };

    // Upload full report to S3
    await uploadReport(scanId, report);

    // Update DynamoDB with COMPLETED status and summary
    await updateScan(scanId, 'COMPLETED', report.summary);

    console.log(`SAST scan ${scanId} completed: ${vulnerabilities.length} vulnerabilities found`);
    return true; // Message processed, safe to delete

  } catch (error) {
    console.error(`SAST scan ${scanId} failed:`, error.message);
    await updateScan(scanId, 'FAILED', null, error.message);
    return true; // Still delete the message to avoid infinite retries (DLQ handles retries)
  }
}

// ─── Main Polling Loop ─────────────────────────────────────────────────────
async function poll() {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║       QuickScan Hub — SAST Worker             ║
  ║       Polling SQS for scan jobs...            ║
  ╚═══════════════════════════════════════════════╝
  
  Config:
  - Region:     ${REGION}
  - Queue:      ${QUEUE_URL}
  - DynamoDB:   ${SCAN_TABLE}
  - S3 Bucket:  ${REPORT_BUCKET}
  `);

  while (true) {
    try {
      const response = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20, // Long polling — efficient, reduces API calls
        MessageAttributeNames: ['scanType'],
        VisibilityTimeout: 120 // 2 minutes to process
      }));

      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          const shouldDelete = await processScan(message);

          if (shouldDelete) {
            await sqsClient.send(new DeleteMessageCommand({
              QueueUrl: QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle
            }));
          } else {
            await sqsClient.send(new ChangeMessageVisibilityCommand({
              QueueUrl: QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle,
              VisibilityTimeout: 0
            }));
          }
        }
      }
    } catch (error) {
      console.error('Polling error:', error.message);
      // Wait before retrying on error
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL * 1000));
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

poll();
