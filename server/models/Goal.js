const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "lose-weight",
        "maintain-weight",
        "gain-weight",
        "improve-diet-quality",
        "increase-energy",

        "fat-loss-exercise",
        "lean-muscle-gain",
        "endurance-support",
        "recomposition",
        "active-lifestyle-maintenance",

        "performance-optimization",
        "strength-training-phase",
        "cutting-competition-prep",
        "endurance-event-prep",
        "recovery-maintenance",

        "lose",
        "maintain",
        "gain",
      ],
    },
    category: {
      type: String,
      enum: ["general", "active", "athlete"],
      default: "general",
    },
    timeHorizon: {
      type: String,
      enum: ["", "short-term", "long-term", "ongoing"],
      default: "",
    },
    motivationTagline: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    target: {
      type: Number,
      required: true,
      min: 1000,
      max: 10000,
    },
    activityLevel: {
      type: String,
      enum: ["sedentary", "lightly-active", "active", "very-active"],
      default: "lightly-active",
    },
    goalDuration: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
    },
    age: {
      type: Number,
      min: 1,
      max: 120,
    },
    height: {
      type: Number,
      min: 30,
      max: 300,
    },
    weight: {
      type: Number,
      min: 10,
      max: 500,
    },
    dietType: {
      type: String,
      enum: [
        "",
        "vegetarian",
        "vegan",
        "keto",
        "mediterranean",
        "high-protein",
        "low-carb",
        "paleo",
      ],
    },
    allergies: [
      {
        type: String,
      },
    ],
    macros: {
      protein: {
        type: Number,
        default: 30,
      },
      carbs: {
        type: Number,
        default: 40,
      },
      fat: {
        type: Number,
        default: 30,
      },
    },
    mealFrequency: {
      type: Number,
      default: 5,
    },
    workoutSync: {
      type: Boolean,
      default: false,
    },
    weekendMode: {
      type: Boolean,
      default: false,
    },
    weekdayCalories: {
      type: Number,
    },
    weekendCalories: {
      type: Number,
    },
    autoAdjust: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Goal", goalSchema);
