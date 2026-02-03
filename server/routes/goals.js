const express = require("express");
const { body, validationResult } = require("express-validator");
const Goal = require("../models/Goal");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const goal = await Goal.findOne({ userId: req.userId });
    if (!goal) {
      return res.json({ goal: null });
    }
    res.json({ goal });
  } catch (error) {
    console.error("Get goal error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const validateGoal = [
  body("type")
    .optional()
    .isString()
    .withMessage("Type must be a string"),
  body("target")
    .isNumeric()
    .withMessage("Target must be a number")
    .isFloat({ min: 1000, max: 10000 })
    .withMessage("Target must be between 1000 and 10000 calories"),
  body("activityLevel")
    .optional()
    .isIn(["sedentary", "lightly-active", "active", "very-active"])
    .withMessage("Invalid activity level"),
  body("age")
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage("Age must be between 1 and 120"),
  body("height")
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage("Height must be between 30 and 300 cm"),
  body("weight")
    .optional()
    .isFloat({ min: 10, max: 500 })
    .withMessage("Weight must be between 10 and 500 kg"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other", ""])
    .withMessage("Invalid gender"),
  body("dietType")
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every((diet) =>
          ["", "vegetarian", "vegan", "keto", "mediterranean", "high-protein", "low-carb", "paleo"].includes(diet)
        );
      }
      return ["", "vegetarian", "vegan", "keto", "mediterranean", "high-protein", "low-carb", "paleo"].includes(value);
    })
    .withMessage("Invalid diet type"),
  body("allergies")
    .optional()
    .isArray()
    .withMessage("Allergies must be an array"),
];

router.post("/", validateGoal, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const goal = await Goal.findOneAndUpdate(
      { userId: req.userId },
      { ...req.body, userId: req.userId },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ goal });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Save goal error:", error);
    res.status(500).json({ message: "Server error saving goal" });
  }
});

router.put("/", validateGoal, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const goal = await Goal.findOneAndUpdate({ userId: req.userId }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    res.json({ goal });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Update goal error:", error);
    res.status(500).json({ message: "Server error updating goal" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      userId: req.userId,
    });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    res.status(204).end();
  } catch (error) {
    console.error("Delete goal error:", error);
    res.status(500).json({ message: "Server error deleting goal" });
  }
});

module.exports = router;
