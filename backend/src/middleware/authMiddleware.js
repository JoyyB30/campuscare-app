const jwt = require('jsonwebtoken');

// Verify if the user is logged in
exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    try {
        // Using the secret you set in your .env
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; 
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// RBAC: Logic to check user roles (Community Member, Manager, Staff)
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Forbidden: ${req.user.role} role does not have access here.` 
            });
        }
        next();
    };
};