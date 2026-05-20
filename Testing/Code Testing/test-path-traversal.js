/**
 * Test Case 4: PATH_TRAVERSAL
 * Path traversal vulnerability examples
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

// Example 1: readFile using user input directly
app.get('/download/:filename', (req, res) => {
  // High risk: /etc/passwd or ../../etc/passwd
  fs.readFile(req.params.filename, (err, data) => {
    if (err) return res.status(404).send('File not found');
    res.send(data);
  });
});

// Example 2: writeFile using user input directly
app.post('/upload', (req, res) => {
  // High risk: attacker can write to any location
  const filePath = '/uploads/' + req.body.filename;
  fs.writeFile(filePath, req.body.content, (err) => {
    if (err) return res.status(500).send(err);
    res.send('File uploaded');
  });
});

// Example 3: readFileSync synchronous operation
app.get('/file/:name', (req, res) => {
  // High risk: synchronous read, path not validated
  try {
    const data = fs.readFileSync('/data/' + req.params.name, 'utf8');
    res.send(data);
  } catch (err) {
    res.status(500).send('Error');
  }
});

// Example 4: unlink delete file
app.delete('/file/:id', (req, res) => {
  // High risk: attacker can delete any file
  fs.unlink(req.params.id, (err) => {
    if (err) return res.status(500).send(err);
    res.send('File deleted');
  });
});

// Example 5: Improper use of path.join
app.get('/view', (req, res) => {
  // High risk: path.join does not prevent .. traversal
  const filepath = path.join('/var/www/uploads', req.query.file);
  fs.readFile(filepath, (err, data) => {
    res.send(data);
  });
});

// Example 6: Path concatenation
function serveFile(userPath) {
  const basePath = '/var/www/public/';
  // High risk: although a prefix is added, ../ can still escape
  const fullPath = basePath + userPath;
  return fs.readFileSync(fullPath);
}

// Example 7: unlinkSync synchronous delete
app.delete('/remove/:filename', (req, res) => {
  // High risk: synchronous and no validation
  fs.unlinkSync('/tmp/' + req.params.filename);
  res.send('Removed');
});

// Example 8: writeFileSync synchronous write
function saveUserData(userId, data) {
  // High risk: user data directly in file path
  const file = '/data/users/' + userId + '.json';
  fs.writeFileSync(file, JSON.stringify(data));
}
