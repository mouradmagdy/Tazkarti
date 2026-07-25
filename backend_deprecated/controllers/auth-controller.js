const bcrypt = require("bcryptjs");
const User = require("../models/user-model");
const generateTokenAndSetCookie = require("../utils/generate-token");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const signup = async (req, res) => {
  try {
    logger.info("User signup attempt", { body: req.body, user: req.user });
    const { fullName, username, password, confirmPassword, role, gender } =
      req.body;
    console.log("req.body", req.body);
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (role === "admin") {
      if (!req.user || req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Only admins can create admin accounts" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;
    const newUser = new User({
      fullName,
      username,
      password: hashedPassword,
      gender,
      role,
      profilePicture: gender === "male" ? boyProfilePic : girlProfilePic,
    });
    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        profilePic: newUser.profilePic,
        gender: newUser.gender,
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    logger.error("Error during signup in controller", error.message);
    // console.error("Error during signup in controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    logger.info("User login attempt", { body: req.body, user: req.user });
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );
    if (!user || !isPasswordCorrect) {
      return res
        .status(400)
        .json({ message: "username or password is incorrect" });
    }
    generateTokenAndSetCookie(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePicture: user.profilePicture,
      role: user.role,
      gender: user.gender,
    });
  } catch (error) {
    logger.error("Error in login controller", error.message);
    // console.log("Error in login controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const logout = (req, res) => {
  try {
    logger.info("User logout attempt", { user: req.user });
    const token = req.cookies.jwt;
    if (token) {
      console.log("token", token);
    }
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "None",
      path: "/",
      // secure: process.env.NODE_ENV === "production",
      secure: true,
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password -__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePicture: user.profilePicture,
      role: user.role,
      gender: user.gender,
    });
  } catch (error) {
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "None",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      secure: true,
    });
    logger.error("Error in getCurrentUser controller", error.message);
    // console.log("Error in getCurrentUser controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
};
