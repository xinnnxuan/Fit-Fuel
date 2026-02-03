const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["cardio", "strength", "flexibility", "sports", "other"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
      max: 1440,
    },
    intensity: {
      type: String,
      enum: ["low", "moderate", "high"],
      default: "moderate",
    },
    calories: {
      type: Number,
      min: 0,
      max: 10000,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    images: [
      {
        type: String,
      },
    ],
    metrics: {
      distance: {
        type: Number,
        min: 0,
        max: 10000,
      },
      pace: {
        type: Number,
        min: 0,
        max: 1000,
      },
      heartRate: {
        type: Number,
        min: 0,
        max: 300,
      },
      weight: {
        type: Number,
        min: 0,
        max: 1000,
      },
      reps: {
        type: Number,
        min: 0,
        max: 10000,
      },
      sets: {
        type: Number,
        min: 0,
        max: 1000,
      },
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);
