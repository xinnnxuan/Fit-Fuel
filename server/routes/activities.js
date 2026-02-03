const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult, param } = require("express-validator");
const Activity = require("../models/Activity");
const User = require("../models/User");
const UserPreferences = require("../models/UserPreferences");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

router.use(requireAuth);

async function canMentionUser(mentionedUserId, mentionerId) {
  if (!mentionedUserId || !mentionerId) return false;

  if (mentionedUserId.toString() === mentionerId) {
    return true;
  }

  const mentionedUser = await User.findById(mentionedUserId);
  if (!mentionedUser) return false;

  const preferences = await UserPreferences.findOne({
    userId: mentionedUserId,
  });
  const mentionsVisibility = preferences?.mentionsVisibility || "everyone";

  if (mentionsVisibility === "only-you") {
    return false;
  }

  if (mentionsVisibility === "followers") {
    const isFollower = mentionedUser.followers.some(
      (followerId) => followerId.toString() === mentionerId
    );
    return isFollower;
  }

  return true;
}

async function validateMentions(mentions, mentionerId) {
  if (!mentions || !Array.isArray(mentions) || mentions.length === 0) {
    return { valid: true, invalidUsers: [] };
  }

  const invalidUsers = [];
  for (const mentionedUserId of mentions) {
    if (!mongoose.Types.ObjectId.isValid(mentionedUserId)) {
      invalidUsers.push(mentionedUserId);
      continue;
    }

    const canMention = await canMentionUser(mentionedUserId, mentionerId);
    if (!canMention) {
      invalidUsers.push(mentionedUserId);
    }
  }

  return {
    valid: invalidUsers.length === 0,
    invalidUsers,
  };
}

router.get("/", async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.userId }).sort({
      date: -1,
      createdAt: -1,
    });
    res.json({ activities });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const validateActivity = [
  body("type")
    .optional()
    .isIn(["cardio", "strength", "flexibility", "sports", "other"])
    .withMessage("Invalid activity type"),
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title is required and must be 1-200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be less than 2000 characters"),
  body("duration")
    .isNumeric()
    .withMessage("Duration must be a number")
    .isFloat({ min: 0, max: 1440 })
    .withMessage("Duration must be between 0 and 1440 minutes"),
  body("intensity")
    .optional()
    .isIn(["low", "moderate", "high"])
    .withMessage("Intensity must be low, moderate, or high"),
  body("calories")
    .optional()
    .isNumeric()
    .withMessage("Calories must be a number")
    .isFloat({ min: 0, max: 10000 })
    .withMessage("Calories must be between 0 and 10000"),
  body("mentions")
    .optional()
    .isArray()
    .withMessage("Mentions must be an array"),
  body("mentions.*")
    .optional()
    .isMongoId()
    .withMessage("Each mention must be a valid MongoDB ObjectId"),
];

router.post("/", validateActivity, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (
      req.body.mentions &&
      Array.isArray(req.body.mentions) &&
      req.body.mentions.length > 0
    ) {
      const validation = await validateMentions(req.body.mentions, req.userId);
      if (!validation.valid) {
        return res.status(403).json({
          message: "You do not have permission to mention one or more users",
          invalidUsers: validation.invalidUsers,
        });
      }
    }

    const activityData = {
      ...req.body,
      userId: req.userId,
    };
    const activity = await Activity.create(activityData);
    res.status(201).json({ activity });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Create activity error:", error);
    res.status(500).json({ message: "Server error creating activity" });
  }
});

router.get(
  "/:id",
  param("id").isMongoId().withMessage("Invalid activity ID"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const activity = await Activity.findOne({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json({ activity });
    } catch (error) {
      console.error("Get activity error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/:id",
  param("id").isMongoId().withMessage("Invalid activity ID"),
  validateActivity,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (
        req.body.mentions &&
        Array.isArray(req.body.mentions) &&
        req.body.mentions.length > 0
      ) {
        const validation = await validateMentions(req.body.mentions, req.userId);
        if (!validation.valid) {
          return res.status(403).json({
            message: "You do not have permission to mention one or more users",
            invalidUsers: validation.invalidUsers,
          });
        }
      }

      const activity = await Activity.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true, runValidators: true }
      );
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json({ activity });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Update activity error:", error);
      res.status(500).json({ message: "Server error updating activity" });
    }
  }
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("Invalid activity ID"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const activity = await Activity.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Delete activity error:", error);
      res.status(500).json({ message: "Server error deleting activity" });
    }
  }
);

module.exports = router;
