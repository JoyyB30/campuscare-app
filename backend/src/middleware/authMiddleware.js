const jwt = require('jsonwebtoken');

// First Gate: Checks if the user is logged in
exports.verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    const token = authHeader.split(' ')[1];

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Contains { id, role }
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

// Second Gate: Checks if the user's role is allowed
exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // If the user's role isn't in the list of allowed roles, block them
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: "Access Denied",
                message: `Required roles: [${allowedRoles}]. Your role: ${req.user?.role}`
            });
        }
        next();
    };
};