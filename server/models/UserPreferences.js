const mongoose = require("mongoose");

const userPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    savedRecipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
      },
    ],
    savedPosts: [
      {
        type: String,
      },
    ],
    likedRecipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
      },
    ],
    likedPosts: [
      {
        type: String,
      },
    ],
    profileVisibility: {
      type: String,
      enum: ["everyone", "followers", "only-you"],
      default: "everyone",
    },
    activityVisibility: {
      type: String,
      enum: ["everyone", "followers", "only-you"],
      default: "everyone",
    },
    recipeVisibility: {
      type: String,
      enum: ["everyone", "followers", "only-you"],
      default: "everyone",
    },
    mentionsVisibility: {
      type: String,
      enum: ["everyone", "followers", "only-you"],
      default: "everyone",
    },
    profileData: {
      name: String,
      birthday: String,
      gender: String,
      location: String,
      club: String,
      vanityUrl: String,
      bio: String,
      photoUrl: String,
    },
    displaySettings: {
      unitsMeasurements: {
        type: String,
        enum: ["metric", "imperial"],
        default: "metric",
      },
      temperature: {
        type: String,
        enum: ["celsius", "fahrenheit"],
        default: "celsius",
      },
      leaderboardView: {
        type: String,
        enum: ["all", "following", "you"],
        default: "all",
      },
      highlightImage: {
        type: String,
        enum: ["photo", "map", "none"],
        default: "photo",
      },
      feedOrdering: {
        type: String,
        enum: ["personalized", "recent", "popular"],
        default: "personalized",
      },
      recommendationPeriodDefault: {
        type: String,
        default: "7",
      },
      themePrimaryColor: {
        type: String,
        default: "#000000",
      },
      themeSecondaryColor: {
        type: String,
        default: "#ffffff",
      },
      themeAccentColor: {
        type: String,
        default: "#666666",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserPreferences", userPreferencesSchema);
