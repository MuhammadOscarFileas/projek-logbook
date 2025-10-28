import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // Check if token format is correct (Bearer <token>)
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Invalid token format. Use 'Bearer <token>'" });
    }

    // Extract token from header
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "your-secret-key");
      
      // Add user info to request object
      req.user = decoded;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: "Token expired" });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: "Invalid token" });
      } else {
        return res.status(401).json({ error: "Token verification failed" });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
