const jwt = require("jsonwebtoken");
const httpContext = require("express-http-context");
const UserModel = require("../models/user.model");
const HttpError = require("./httpError");

const verifyToken = async (req, res, next) => {
  try {
    if (req.method === "OPTIONS") {
      return next();
    }
    //console.log("headers", req.headers);
    if (!req.header("Authorization") || !req.header("Authorization").length) {
      console.log("HERE");
      return next(
        new HttpError(
          "User not authorized.",
          401,
          "User not authorized.",
          "User not authorized."
        )
      );
    }
    const token = req.header("Authorization").replace("Bearer ", "");
    //console.log("USER TOKEN", token);
    if (!token) {
      return next(
        new HttpError(
          "User not authorized.",
          401,
          "User not authorized.",
          "User not authorized."
        )
      );
    }
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (e) {
      new HttpError(
        "User not authorized.",
        401,
        "User not authorized.",
        "User not authorized."
      );
    }
    console.log("Decoded TOken", decodedToken);
    const user = await UserModel.findById(decodedToken.userId);
    if (!user) {
      new HttpError(
        "User not authorized.",
        401,
        "User not authorized.",
        "User not authorized."
      );
    }
    req.xuser = user;
    httpContext.set("xuser", {
      _id: user._id,
      fullName: `${user.firstName} ${user.lastName}`
    });
    next();
  } catch (err) {
    return next(new HttpError(err.message, 500, err.message, err.message));
  }
};

module.exports = verifyToken;
