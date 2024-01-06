const UserModel = require("../models/user.model"); // Import your Mongoose model
const bcrypt = require("bcrypt"); // For password hashing
const jwt = require("jsonwebtoken"); // For generating JSON Web Tokens
const {
  signUpValidationSchema,
  signInValidationSchema,
} = require("../dto/user.validations");
const HttpError = require("../utils/httpError");
const EventModel = require("../models/event.model");
const TOKEN_SECRET = process.env.TOKEN_SECRET;
// Register a new user
const registerUser = async (req, res, next) => {
  try {
    const img = req.file;
    //console.log("saif", JSON.stringify(req));
    // Extract user data from the request body
    const { error, value } = signUpValidationSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return next(
        new HttpError(
          error.details[0].message,
          400,
          error.details[0].message,
          error.details[0].message
        )
      );
    }
    const ExistingEmail = await UserModel.findOne({
      email: value.email.toLowerCase(),
    });
    if (ExistingEmail) {
      return next(
        new HttpError(
          "this email not valid.",
          400,
          "this email not valid.",
          "this email not valid."
        )
      );
    }

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(value.password, 10);
    console.log("PREF", JSON.parse(value.preferences));
    // Create a new user
    const newUser = new UserModel({
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email.toLowerCase(),
      phoneNumber: value.phoneNumber,
      gender: value.gender,
      password: hashedPassword,
      preferences: JSON.parse(value.preferences),
      profileImg: img.path,
      userLocation: JSON.parse(value.userLocation),
    });

    // Save the user to the database
    await newUser.save();
    res.locals.res_body = {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
    };
    return next();
  } catch (error) {
    next(new HttpError(error.message, 500, error.message, error.message));
  }
};

// Login a user
const loginUser = async (req, res, next) => {
  try {
    const { error, value } = signInValidationSchema.validate(req.body, {
      abortEarly: false,
    });
    // console.log("Value ERROR", error);
    console.log(value);
    if (error) {
      return next(
        new HttpError(
          error.details[0].message,
          400,
          error.details[0].message,
          error.details[0].message
        )
      );
    }
    const foundUser = await UserModel.findOne({
      email: value.email.toLowerCase(),
    });
    console.log("Found User", foundUser);
    if (!foundUser)
      return next(
        new HttpError(
          "Invalid Password",
          401,
          "Invalid Password",
          "Invalid Password"
        )
      );
    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(
      value.password,
      foundUser.password
    );

    if (!isPasswordValid) {
      return next(
        new HttpError(
          "Invalid Password",
          401,
          "Invalid Password",
          "Invalid Password"
        )
      );
    }

    // Generate a JWT token for authentication
    const token = jwt.sign({ userId: foundUser._id }, TOKEN_SECRET);
    await UserModel.findByIdAndUpdate(foundUser._id, {
      deviceId: value.deviceId,
    });

    res.locals.res_body = {
      statusCode: 200,
      success: true,
      token: token,
      user: foundUser,
    };
    return next();
  } catch (error) {
    console.log("Error", error);
    next(
      new HttpError(
        "Internal Server Error",
        500,
        "Internal Server Error",
        "Internal Server Error"
      )
    );
  }
};

// Update a user
const updateUser = async (req, res) => {
  try {
    const { _id } = req.xuser;
    const updatedData = req.body; // Updated user data
    // Update the user in the database
    await UserModel.findByIdAndUpdate(_id, updatedData);
    res
      .status(200)
      .json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const updateUserImage = async (req, res) => {
  try {
    const { _id } = req.xuser;
    const img = req.file.path;
    await UserModel.findByIdAndUpdate(_id, {
      profileImg: img,
    });
    res
      .status(200)
      .json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete a user
const deleteUser = async (req, res, next) => {
  try {
    let { _id } = req.xuser;
    // Delete the user from the database
    await UserModel.findByIdAndRemove(_id);

    res.locals.res_body = {
      statusCode: 201,
      success: true,
      message: "User deleted successfully",
    };
    return next();
  } catch (error) {
    new HttpError(
      "Internal Server Error",
      500,
      "Internal Server Error",
      "Internal Server Error"
    );
  }
};

const getUserById = async (req, res, next) => {
  try {
    let { _id } = req.xuser;
    // Find the user by ID in the database
    const user = await UserModel.findById(_id);

    if (!user) {
      return next(
        new HttpError(
          "User Not Found.",
          404,
          "User Not Found.",
          "User Not Found."
        )
      );
    }
    res.locals.res_body = {
      statusCode: 200,
      success: true,
      user: user,
    };
    return next();
  } catch (error) {
    new HttpError(
      "Internal Server Error",
      500,
      "Internal Server Error",
      "Internal Server Error"
    );
  }
};

const updateUserPassword = async (req, res, next) => {
  try {
    //const userId = req.xuser._id;

    const { oldPassword, password, userId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const currentUser = await UserModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );
    res.status(200).json({
      user: currentUser,
      success: true,
    });
    //const verif = await bcrypt.compare(oldPassword, req.xuser.password);
    // if (!verif) {
    //   res.status(401).json({
    //     message: "wrong old password",
    //     success: false
    //   });
    // } else {

    // }

    //return next();
  } catch (error) {
    console.log("Error", error);
    new HttpError(
      "Internal Server Error",
      500,
      "Internal Server Error",
      "Internal Server Error"
    );
  }
};
const getExternalProfileInfo = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = await UserModel.findById(userId);
    const events = await EventModel.find({ creator: currentUser._id })
      .populate("field")
      .populate("creator")
      .populate("participants");
    res.status(200).json({
      userProfile: { user: currentUser, eventList: events },
      success: true,
    });
    //return next();
  } catch (error) {
    console.log("Error", error);
    new HttpError(
      "Internal Server Error",
      500,
      "Internal Server Error",
      "Internal Server Error"
    );
  }
};
module.exports = {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  getUserById,
  getExternalProfileInfo,
  updateUserPassword,
  updateUserImage,
};
