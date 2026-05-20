/**
 * Test Case 7: INSECURE_FUNCTION
 * Insecure function usage examples
 */

const express = require('express');
const app = express();
const { exec, execSync, spawn } = require('child_process');

// Example 1: eval() executing user code
app.post('/calculate', (req, res) => {
  // Extremely high risk: arbitrary code execution
  const result = eval(req.body.expression);
  res.json({ result });
});

// Example 2: exec() executing system commands
app.get('/ping', (req, res) => {
  // High risk: ping injection - e.g., "8.8.8.8; rm -rf /"
  exec('ping -c 1 ' + req.query.host, (err, stdout) => {
    res.send(stdout);
  });
});

// Example 3: execSync() synchronous command execution
function deployApplication(version) {
  // High risk: path traversal or command injection
  const output = execSync('docker pull myapp:' + version);
  return output.toString();
}

// Example 4: new Function() creating dynamic functions
app.post('/transform', (req, res) => {
  // High risk: dynamic code execution
  const transformer = new Function(req.body.code);
  const results = transformer(req.body.data);
  res.json(results);
});

// Example 5: spawn() with template strings
app.post('/process', (req, res) => {
  // High risk: Although spawn using array is safer, template strings can cause injection
  const command = `curl ${req.body.url} | bash`;
  spawn('bash', ['-c', command]);
  res.send('Processing');
});

// Example 6: child_process.exec() direct user input
app.get('/convert', (req, res) => {
  // High risk: File conversion command injection
  const cmd = 'convert ' + req.query.inputFile + ' ' + req.query.outputFile;
  exec(cmd, (error, stdout, stderr) => {
    res.json({ success: !error });
  });
});

// Example 7: npm install command injection
app.post('/install-package', (req, res) => {
  // High risk: npm package installation command injection
  execSync('npm install ' + req.body.package);
  res.send('Package installed');
});

// Example 8: Database restore command injection
function restoreDatabase(backupFile) {
  // High risk: Restore operations can be injected with malicious commands
  const cmd = 'mysql -u root -p < ' + backupFile;
  execSync(cmd);
}

// Example 9: Python script execution
app.post('/analyze', (req, res) => {
  // High risk: Python script execution with user data
  const cmd = 'python analyze.py --data "' + req.body.data + '"';
  exec(cmd, (err, stdout) => {
    res.json(JSON.parse(stdout));
  });
});

// Example 10: Get system information
app.get('/sysinfo/:type', (req, res) => {
  // High risk: Command injection
  exec('echo ' + req.params.type, (err, stdout) => {
    res.send(stdout);
  });
});
