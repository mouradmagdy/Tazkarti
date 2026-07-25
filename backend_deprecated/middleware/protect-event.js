const checkEventAuthorization = (req, res, next) => {
  try {
    const { user } = req;

    if (user.role !== "admin") {
      return res.status(403).json({ error: "You are not authorized" });
    }

    next();
  } catch (error) {
    console.log("Error in checkEventAuthorization middleware", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = checkEventAuthorization;
