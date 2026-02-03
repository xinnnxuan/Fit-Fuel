const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult, param } = require("express-validator");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const UserPreferences = require("../models/UserPreferences");
const requireAuth = require("../middleware/requireAuth");
const optionalAuth = require("../middleware/optionalAuth");
const router = express.Router();

async function canViewRecipe(recipe, viewerId, recipeOwner) {
  if (!viewerId) {
    const preferences = await UserPreferences.findOne({
      userId: recipeOwner._id,
    });
    const recipeVisibility = preferences?.recipeVisibility || "everyone";
    return recipeVisibility === "everyone";
  }

  if (recipeOwner._id.toString() === viewerId) {
    return true;
  }

  const preferences = await UserPreferences.findOne({
    userId: recipeOwner._id,
  });
  const recipeVisibility = preferences?.recipeVisibility || "everyone";

  if (recipeVisibility === "only-you") {
    return false;
  }

  if (recipeVisibility === "followers") {
    const isFollower = recipeOwner.followers.some(
      (followerId) => followerId.toString() === viewerId
    );
    return isFollower;
  }

  return true;
}

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

const validateRecipe = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Recipe name is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Recipe name must be between 1 and 200 characters"),
  body("calories")
    .isNumeric()
    .withMessage("Calories must be a number")
    .isInt({ min: 0, max: 50000 })
    .withMessage("Calories must be between 0 and 50000"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be less than 2000 characters"),
  body("category")
    .optional()
    .isIn([
      "breakfast",
      "lunch",
      "dinner",
      "snack",
      "dessert",
      "sweet",
      "savory",
      "tangy",
    ])
    .withMessage("Invalid category"),
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Each tag must be less than 50 characters"),
  body("ingredients")
    .optional()
    .isArray()
    .withMessage("Ingredients must be an array"),
  body("ingredients.*")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Each ingredient must be less than 500 characters"),
  body("steps")
    .optional()
    .isArray()
    .withMessage("Steps must be an array"),
  body("steps.*")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Each step must be less than 2000 characters"),
  body("servings")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Servings must be between 1 and 100"),
  body("prepTime")
    .optional()
    .isNumeric()
    .withMessage("Prep time must be a number"),
  body("cookTime")
    .optional()
    .isNumeric()
    .withMessage("Cook time must be a number"),
  body("protein")
    .optional()
    .isNumeric()
    .withMessage("Protein must be a number"),
  body("carbs")
    .optional()
    .isNumeric()
    .withMessage("Carbs must be a number"),
  body("fat")
    .optional()
    .isNumeric()
    .withMessage("Fat must be a number"),
  body("fiber")
    .optional()
    .isNumeric()
    .withMessage("Fiber must be a number"),
  body("sugar")
    .optional()
    .isNumeric()
    .withMessage("Sugar must be a number"),
  body("sodium")
    .optional()
    .isNumeric()
    .withMessage("Sodium must be a number"),
  body("image")
    .optional()
    .isString()
    .withMessage("Image must be a string"),
  body("sourceUrl")
    .optional()
    .isURL()
    .withMessage("Source URL must be a valid URL"),
  body("mentions")
    .optional()
    .isArray()
    .withMessage("Mentions must be an array"),
  body("mentions.*")
    .optional()
    .isMongoId()
    .withMessage("Each mention must be a valid user ID"),
];

router.get("/", optionalAuth, async (req, res) => {
  try {
    const viewerId = req.userId;
    const allRecipes = await Recipe.find().sort({ createdAt: -1 });
    const users = await User.find().select("_id name email followers");

    const userMap = new Map();
    users.forEach((user) => {
      userMap.set(user._id.toString(), user);
    });

    const visibleRecipes = [];
    for (const recipe of allRecipes) {
      const recipeOwnerId = recipe.userId?.toString();
      if (!recipeOwnerId) continue;

      const recipeOwner = userMap.get(recipeOwnerId);
      if (!recipeOwner) continue;

      const canView = await canViewRecipe(recipe, viewerId, recipeOwner);
      if (canView) {
        visibleRecipes.push(recipe);
      }
    }

    res.json({ recipes: visibleRecipes });
  } catch (error) {
    console.error("Get recipes error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/:id",
  optionalAuth,
  param("id").isMongoId().withMessage("Invalid recipe ID"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const viewerId = req.userId;
      const recipe = await Recipe.findById(req.params.id);

      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      const recipeOwner = await User.findById(recipe.userId).select(
        "_id name email followers"
      );
      if (!recipeOwner) {
        return res.status(404).json({ message: "Recipe owner not found" });
      }

      const canView = await canViewRecipe(recipe, viewerId, recipeOwner);
      if (!canView) {
        return res
          .status(403)
          .json({ message: "You do not have permission to view this recipe" });
      }

      res.json({ recipe });
    } catch (error) {
      console.error("Get recipe error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.use(requireAuth);

router.post("/", validateRecipe, async (req, res) => {
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

    const recipeData = {
      ...req.body,
      userId: req.userId,
    };
    const recipe = await Recipe.create(recipeData);
    res.status(201).json({ recipe });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Create recipe error:", error);
    res.status(500).json({ message: "Server error creating recipe" });
  }
});

router.put(
  "/:id",
  param("id").isMongoId().withMessage("Invalid recipe ID"),
  validateRecipe,
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

      const recipe = await Recipe.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true, runValidators: true }
      );
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json({ recipe });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Update recipe error:", error);
      res.status(500).json({ message: "Server error updating recipe" });
    }
  }
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("Invalid recipe ID"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const recipe = await Recipe.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Delete recipe error:", error);
      res.status(500).json({ message: "Server error deleting recipe" });
    }
  }
);

module.exports = router;
