const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
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
    calories: {
      type: Number,
      required: true,
      min: 0,
      max: 50000,
    },
    category: {
      type: String,
      enum: [
        "breakfast",
        "lunch",
        "dinner",
        "snack",
        "dessert",
        "sweet",
        "savory",
        "tangy",
      ],
      default: "dinner",
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    time: {
      type: String,
    },
    prepTime: {
      type: Number,
    },
    cookTime: {
      type: Number,
    },
    protein: {
      type: Number,
    },
    carbs: {
      type: Number,
    },
    fat: {
      type: Number,
    },
    fiber: {
      type: Number,
    },
    sugar: {
      type: Number,
    },
    sodium: {
      type: Number,
    },
    image: {
      type: String,
    },
    ingredients: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],
    steps: [
      {
        type: String,
        trim: true,
        maxlength: 2000,
      },
    ],
    servings: {
      type: Number,
      default: 4,
      min: 1,
      max: 100,
    },
    imported: {
      type: Boolean,
      default: false,
    },
    sourceUrl: {
      type: String,
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

module.exports = mongoose.model("Recipe", recipeSchema);
