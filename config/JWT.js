const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, "e298d3489d3jfruuf8r9dejncnjeiuein328cdjnwj", { expiresIn: '1h' });
};

const verifyToken = (token) => {
    return jwt.verify(token, "e298d3489d3jfruuf8r9dejncnjeiuein328cdjnwj");
};

module.exports = { generateToken, verifyToken };
