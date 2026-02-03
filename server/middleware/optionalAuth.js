const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.userId = decoded.userId;
    } catch (err) {
      req.userId = null;
    }
  } else {
    req.userId = null;
  }
  next();
};
