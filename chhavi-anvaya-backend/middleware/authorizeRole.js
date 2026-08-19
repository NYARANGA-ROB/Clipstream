const { ROLES } = require("../constants/catalog");

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = req.user.role || ROLES.CONSUMER;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: "This action is not allowed for your account role.",
      });
    }

    next();
  };
};

module.exports = authorizeRole;
