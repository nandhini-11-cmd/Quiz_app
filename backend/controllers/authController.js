import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";


// Register
export const registerUser = async (req, res) => {
  const { username, email, password, role, avatar  } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User exists" });

  const user = await User.create({ username, email, password, role,  avatar: avatar || "/avatars/default.png",});
  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};



// Get logged-in user's profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update logged-in user's profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.avatar = req.body.avatar || user.avatar;

      if (req.body.password) {
        user.password = req.body.password; // will be hashed by pre-save hook
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        token: generateToken(updatedUser._id, updatedUser.role), // new token in case email/role updated
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// controllers/authController.js (forgotPassword)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No user with that email" });

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const message = `
      <p>Hello ${user.username},</p>
      <p>Click below to reset your password (valid for 10 minutes):</p>
      <p><a href="${resetUrl}" target="_blank" rel="noreferrer">Reset Password</a></p>
    `;

    await sendEmail({
      to: user.email,
      subject: "Password Reset - QuizNova",
      html: message,
    });

    return res.json({ message: "Email sent successfully!" });
  } catch (err) {
    console.error("[FORGOT] Error:", err?.message || err);

    // rollback token if email failed
    try {
      if (req.body?.email) {
        const u = await User.findOne({ email: req.body.email });
        if (u) {
          u.resetPasswordToken = undefined;
          u.resetPasswordExpire = undefined;
          await u.save({ validateBeforeSave: false });
        }
      }
    } catch {}

    return res.status(500).json({ message: "Email could not be sent" });
  }
};


// Reset Password (Change it)
export const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: "Password reset successful! You can now log in." });
};