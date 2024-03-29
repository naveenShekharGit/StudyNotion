// import required modules
const express = require('express');
const router = express.Router();

// import controllers and middlewares functions
const {signup,login,sendOtpEmail,changePassword} = require('../controllers/Auth');

const {resetPasswordToken,resetPassword} = require('../controllers/ResetPassword');

const {auth} = require('../middlewares/auth');

// Routes for Login, Signup and Authentication

// *****************************************************
//                      Authentication Routes
// *****************************************************

// Route for user Login
router.post("/login",login);

// Route for User Signup
router.post("/signup",signup);

// Route for sending OTP to the user's email
router.post("/sendotp", sendOtpEmail);

// Route for Changing the password
router.post("/changepassword", auth, changePassword);

// ****************************************************
//                          Reset Password
// ****************************************************

// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken);

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword);

// Export the router for use in the main application
module.exports = router;