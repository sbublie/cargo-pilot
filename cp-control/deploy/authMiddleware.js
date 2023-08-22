const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization;
  
    // Check if the token is provided
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    // Verify the token
    if (token !== process.env.API_KEY) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  
    // Token is valid, proceed to the next middleware or route handler
    next();
  };
  
  module.exports = authenticateToken;