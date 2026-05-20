/**
 * Test Case 9: HARDCODED_IP
 * Hardcoded IP address examples
 */

// Example 1: Database configuration
const DATABASE_CONFIG = {
  host: 'localhost',
  // High risk: Hardcoded internal IP
  primaryDB: '192.168.1.100',
  replicaDB: '192.168.1.101',
  backupDB: '192.168.1.102'
};

// Example 2: Cache servers
const CACHE_SERVERS = [
  '10.0.0.50',      // Redis primary node
  '10.0.0.51',      // Redis replica node
  '10.0.0.52'       // Backup
];

// Example 3: API endpoints
const API_ENDPOINTS = {
  // High risk: Production IP hardcoded
  productionAPI: 'http://203.0.113.42:3000/api',
  stagingAPI: 'http://192.0.2.10:3000/api',
  developmentAPI: 'http://10.20.30.40:3000/api'
};

// Example 4: Logging servers
const LOGGING_SERVERS = {
  elasticsearch: '172.16.0.100:9200',
  kibana: '172.16.0.101:5601',
  logstash: '172.16.0.102:5000'
};

// Example 5: Message queue
const QUEUE_CONFIG = {
  // High risk: Internal RabbitMQ server
  host: '10.1.1.50',
  port: 5672,
  backupHost: '10.1.1.51'
};

// Example 6: Monitoring system
function configureMonitoring() {
  const prometheus = 'http://10.50.0.20:9090';
  const alertmanager = 'http://10.50.0.21:9093';
  const grafana = 'http://10.50.0.22:3000';
  return { prometheus, alertmanager, grafana };
}

// Example 7: Remote service calls
const remoteServices = {
  paymentService: 'https://10.30.0.30:8443/payment',
  emailService: 'http://172.20.0.40:8080/email',
  strageService: 'http://203.0.113.100:9000/storage'
};

// Example 8: SSH connection
function setupSSHConnection() {
  const server1 = {
    host: '10.0.0.100',
    port: 22,
    username: 'admin'
  };
  
  const server2 = {
    host: '192.168.1.50',
    port: 2222
  };
  
  return [server1, server2];
}

// Example 9: Third-party services
const thirdPartyServices = {
  webhookURL: 'http://203.0.113.55:5000/webhook',
  callbackURL: 'http://10.40.0.30:3000/callback'
};

// Example 10
const clusterConfig = {
  masterNodes: ['10.0.1.10:8080', '10.0.1.11:8080'],
  workerNodes: ['10.0.2.100:8080', '10.0.2.101:8080', '10.0.2.102:8080'],
  nameserver: '172.31.0.2'
};
