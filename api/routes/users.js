const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', async (req, res) => {
    res.json({
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers
    });
});

module.exports = router;
