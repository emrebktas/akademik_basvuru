require('dotenv').config();
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) return res.status(401).json({ error: 'Access Denied' });

    const token = authHeader.split(' ')[1]; // Split to get the token part

    if (!token) return res.status(401).json({ error: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET); // Use process.env.JWT_SECRET
        req.user = verified; // Attach decoded user data to request
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid Token' });
    }
};

module.exports = authMiddleware;
