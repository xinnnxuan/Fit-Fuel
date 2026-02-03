const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const UserPreferences = require("../models/UserPreferences");
const Activity = require("../models/Activity");
const Recipe = require("../models/Recipe");
const Goal = require("../models/Goal");
const optionalAuth = require("../middleware/optionalAuth");
const config = require("../config");
const router = express.Router();

const validateRegister = [
  body("name").isLength({ min: 2 }).withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be 8+ chars"),
];

const validateLogin = [
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
];

router.post("/register", validateRegister, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    const token = jwt.sign({ userId: user._id.toString() }, config.JWT_SECRET, {
      expiresIn: "365d",
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

router.post("/login", validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id.toString() }, config.JWT_SECRET, {
      expiresIn: "365d",
    });

    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token: token,
      message: "Login successful",
    };
    console.log("Sending login response with token:", !!responseData.token);
    res.json(responseData);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ user: null });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ user: null });
    }

    const user = await User.findById(decoded.userId).select("_id name email");
    if (!user) {
      return res.status(401).json({ user: null });
    }
    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/users/:userId", optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).select(
      "_id name email followers following"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const preferences = await UserPreferences.findOne({ userId });
    const profileVisibility = preferences?.profileVisibility || "everyone";

    if (profileVisibility === "only-you") {
      if (!viewerId || viewerId !== userId) {
        return res.status(403).json({ message: "This profile is private" });
      }
    } else if (profileVisibility === "followers") {
      if (!viewerId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (viewerId !== userId) {
        const isFollower = user.followers.some(
          (followerId) => followerId.toString() === viewerId
        );
        if (!isFollower) {
          return res
            .status(403)
            .json({ message: "This profile is only visible to followers" });
        }
      }
    }

    const [activities, recipes, goal] = await Promise.all([
      Activity.find({ userId }).sort({ date: -1 }).limit(50),
      Recipe.find({ userId }).sort({ createdAt: -1 }).limit(50),
      Goal.findOne({ userId }),
    ]);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        followers: user.followers.length,
        following: user.following.length,
      },
      activities: activities.map((a) => ({
        _id: a._id,
        title: a.title,
        sport: a.sport,
        date: a.date,
        calories: a.calories,
        distance: a.distance,
        duration: a.duration,
        elevation: a.elevation,
      })),
      recipes: recipes.map((r) => ({
        _id: r._id,
        name: r.name,
        description: r.description,
        calories: r.calories,
        image: r.image,
        category: r.category,
      })),
      goal: goal
        ? {
            dailyCalories: goal.dailyCalories,
            weeklyDistance: goal.weeklyDistance,
          }
        : null,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
