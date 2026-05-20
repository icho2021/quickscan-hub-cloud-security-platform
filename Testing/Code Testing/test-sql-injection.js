/**
 * Test Case 6: SQL_INJECTION
 * SQL Injection vulnerability examples
 */

const express = require('express');
const app = express();
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp'
});

// Example 1: SELECT query string concatenation
app.get('/user/:id', (req, res) => {
  // High risk: "1' OR '1'='1"
  const query = "SELECT * FROM users WHERE id = '" + req.params.id + "'";
  connection.query(query, (err, results) => {
    res.json(results);
  });
});

// Example 2: SQL in template strings
app.post('/register', (req, res) => {
  // High risk: Template string injection
  const sql = `INSERT INTO users (name, email) 
               VALUES ('${req.body.name}', '${req.body.email}')`;
  connection.query(sql, (err, result) => {
    res.json(result);
  });
});

// Example 3: UPDATE query string concatenation
app.put('/user/update', (req, res) => {
  // High risk: Multiple parameters can be injected
  const query = "UPDATE users SET name = '" + req.body.name + 
                "' WHERE id = " + req.body.id;
  connection.query(query, (err, result) => {
    res.json(result);
  });
});

// Example 4: DELETE query string concatenation
app.delete('/record/:id', (req, res) => {
  // High risk: DROP TABLE injection
  const query = "DELETE FROM records WHERE id = " + req.params.id;
  connection.query(query, (err, result) => {
    res.json(result);
  });
});

// Example 5: LIKE query string concatenation
app.get('/search', (req, res) => {
  // High risk: SQL injection in search functionality
  const query = "SELECT * FROM products WHERE name LIKE '%" + req.query.q + "%'";
  connection.query(query, (err, results) => {
    res.json(results);
  });
});

// Example 6: Build complete SQL from user input
function getUserData(userId) {
  // High risk: Completely dependent on user input
  const sql = "SELECT * FROM users WHERE user_id = " + userId;
  return connection.query(sql);
}

// Example 7: Multi-table JOIN SQL injection
app.get('/report/:category', (req, res) => {
  // High risk: Injection in JOIN query
  const query = "SELECT u.*, o.* FROM users u " +
                "JOIN orders o ON u.id = o.user_id " +
                "WHERE u.category = '" + req.params.category + "'";
  connection.query(query, (err, results) => {
    res.json(results);
  });
});

// Example 8: UNION injection
app.post('/login', (req, res) => {
  // High risk: UNION injection can read other tables
  const query = "SELECT id, username FROM users WHERE username = '" + 
                req.body.username + "' AND password = '" + 
                req.body.password + "'";
  connection.query(query, (err, results) => {
    if (results && results.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  });
});
