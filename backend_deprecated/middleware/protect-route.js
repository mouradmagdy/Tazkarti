const User = require("../models/user-model");
const jwt = require("jsonwebtoken");
const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized, you have to login first" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // token expired
    if (!decoded) {
      console.log(token);
      return res
        .status(401)
        .json({ error: "Unauthorized, you have to login again" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = protectRoute;
