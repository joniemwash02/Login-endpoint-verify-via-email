import mongoose from "mongoose";
import Verification from "../models/emailVerification.js";
import Users from "../models/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import PasswordReset from "../models/PasswordReset.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
import FriendRequest from "../models/friendRequest.js";

// ------------------------
// Email Verification
// ------------------------
export const verifyEmail = async (req, res) => {
  const { userId, token } = req.params;

  try {
    const verificationRecord = await Verification.findOne({ userId });

    if (!verificationRecord) {
      const message = "Invalid verification link. Try again later.";
      return res.redirect(`/users/verified?status=error&message=${message}`);
    }

    const { expiresAt, token: hashedToken } = verificationRecord;

    if (expiresAt < Date.now()) {
      // Token expired: delete verification and user
      await Verification.findOneAndDelete({ userId });
      await Users.findByIdAndDelete(userId);

      const message = "Verification token has expired.";
      return res.redirect(`/users/verified?status=error&message=${message}`);
    }

    const isMatch = await compareString(token, hashedToken);
    if (!isMatch) {
      const message = "Verification failed or link is invalid.";
      return res.redirect(`/users/verified?status=error&message=${message}`);
    }

    // Token valid: verify user
    await Users.findByIdAndUpdate(userId, { verified: true });
    await Verification.findOneAndDelete({ userId });

    const message = "Email verified successfully.";
    return res.redirect(`/users/verified?status=success&message=${message}`);
  } catch (error) {
    console.log(error);
    res.redirect(`/users/verified?status=error&message=Server error`);
  }
};

// ------------------------
// Request Password Reset
// ------------------------
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: "FAILED", message: "Email address not found." });
    }

    const existingRequest = await PasswordReset.findOne({ email });
    if (existingRequest && existingRequest.expiresAt > Date.now()) {
      return res.status(201).json({
        status: "PENDING",
        message: "Reset password link has already been sent to your email.",
      });
    }

    if (existingRequest) await PasswordReset.findOneAndDelete({ email });

    await resetPasswordLink(user, res);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// Reset Password Link
// ------------------------
export const resetPassword = async (req, res) => {
  const { userId, token } = req.params;

  try {
    const user = await Users.findById(userId);
    if (!user) {
      const message = "Invalid password reset link. Try again.";
      return res.redirect(`/users/resetpassword?status=error&message=${message}`);
    }

    const resetRecord = await PasswordReset.findOne({ userId });
    if (!resetRecord) {
      const message = "Invalid password reset link. Try again.";
      return res.redirect(`/users/resetpassword?status=error&message=${message}`);
    }

    const { expiresAt, token: resetToken } = resetRecord;
    if (expiresAt < Date.now()) {
      const message = "Reset password link has expired. Please try again.";
      return res.redirect(`/users/resetpassword?status=error&message=${message}`);
    }

    const isMatch = await compareString(token, resetToken);
    if (!isMatch) {
      const message = "Invalid reset password link. Please try again.";
      return res.redirect(`/users/resetpassword?status=error&message=${message}`);
    }

    // Token valid: redirect to reset page
    res.redirect(`/users/resetpassword?type=reset&id=${userId}`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// Change Password
// ------------------------
export const changePassword = async (req, res) => {
  try {
    const { userId, password } = req.body;
    const hashedPassword = await hashString(password);

    await Users.findByIdAndUpdate(userId, { password: hashedPassword });
    await PasswordReset.findOneAndDelete({ userId });

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// Get User Profile
// ------------------------
export const getUser = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.params;

    const user = await Users.findById(id ?? userId).populate({ path: "friends", select: "-password" });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = undefined;
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------
// Update User Profile
// ------------------------
export const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, location, profileUrl, profession, contact } = req.body;

    if (!(firstName || lastName || location || profileUrl || profession || contact)) {
      return next("Please provide all required fields");
    }

    const { userId } = req.body.user;

    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { firstName, lastName, location, profileUrl, profession },
      { new: true }
    ).populate({ path: "friends", select: "-password" });

    const token = createJWT(updatedUser._id);
    updatedUser.password = undefined;

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// Friend Request
// ------------------------
export const friendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { requestTo } = req.body;

    const exists = await FriendRequest.findOne({
      $or: [
        { requestFrom: userId, requestTo },
        { requestFrom: requestTo, requestTo: userId },
      ],
    });

    if (exists) return next("Friend Request already sent.");

    await FriendRequest.create({ requestFrom: userId, requestTo });

    res.status(201).json({ success: true, message: "Friend request sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------
// Get Friend Requests
// ------------------------
export const getFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body.user;

    const requests = await FriendRequest.find({ requestTo: userId, requestStatus: "Pending" })
      .populate({ path: "requestFrom", select: "firstName lastName profileUrl profession -password" })
      .limit(10)
      .sort({ _id: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------
// Accept or Reject Friend Request
// ------------------------
export const acceptRequest = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { rid, status } = req.body;

    const request = await FriendRequest.findById(rid);
    if (!request) return next("No Friend Request Found.");

    await FriendRequest.findByIdAndUpdate(rid, { requestStatus: status });

    if (status === "Accepted") {
      await Users.findByIdAndUpdate(userId, { $addToSet: { friends: request.requestFrom } });
      await Users.findByIdAndUpdate(request.requestFrom, { $addToSet: { friends: userId } });
    }

    res.status(201).json({ success: true, message: `Friend Request ${status}` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------
// Track Profile Views
// ------------------------
export const profileViews = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.body;

    const user = await Users.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.views.includes(userId)) {
      user.views.push(userId);
      await user.save();
    }

    res.status(201).json({ success: true, message: "Profile view recorded" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------
// Suggested Friends
// ------------------------
export const suggestedFriends = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const objectId = mongoose.Types.ObjectId(userId);

    const users = await Users.find({
      _id: { $ne: objectId },
      friends: { $nin: [objectId] },
    })
      .limit(15)
      .select("firstName lastName profileUrl profession -password");

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};