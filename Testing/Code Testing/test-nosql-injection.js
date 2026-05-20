/**
 * Test Case 2: NOSQL_INJECTION
 * MongoDB NoSQL injection vulnerability examples
 */

const express = require('express');
const app = express();
const db = require('./mongodb');

// Example 1: Using user input directly as query
app.post('/api/user/search', (req, res) => {
  // High risk: req.body passed directly to find()
  db.collection('users').find(req.body).toArray((err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Example 2: Using user input in findOne
app.get('/api/user/:id', (req, res) => {
  // High risk: attacker can pass { $ne: null } to bypass query
  db.collection('users').findOne(req.query, (err, user) => {
    res.json(user);
  });
});

// Example 3: Using user input in updateOne
app.put('/api/product/update', (req, res) => {
  // High risk: using req.body as both filter and update
  const filter = { id: req.body.id };
  const update = req.body.updateData;
  db.collection('products').updateOne(filter, update, (err, result) => {
    res.json(result);
  });
});

// Example 4: Using $where operator
app.get('/api/filter', (req, res) => {
  // High risk: $where allows arbitrary JavaScript execution
  const query = { $where: `this.age > ${req.query.minAge}` };
  db.collection('data').find(query).toArray((err, results) => {
    res.json(results);
  });
});

// Example 5: deleteOne injection
app.delete('/api/record/:id', (req, res) => {
  // High risk: using req.params directly
  db.collection('records').deleteOne(req.params, (err, result) => {
    res.json(result);
  });
});

// Example 6: $regex injection
app.get('/api/search/products', (req, res) => {
  // High risk: unfiltered $regex operator
  const query = { name: { $regex: req.query.pattern } };
  db.collection('products').find(query).toArray((err, results) => {
    res.json(results);
  });
});
