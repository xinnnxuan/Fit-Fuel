const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult, param } = require("express-validator");
const UserPreferences = require("../models/UserPreferences");
const Recipe = require("../models/Recipe");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

async function ensureRecipeInDatabase(recipeData, userId) {
  if (!recipeData || !recipeData.id) {
    return null;
  }

  const originalId = String(recipeData.id);

  if (mongoose.Types.ObjectId.isValid(originalId)) {
    const existingRecipe = await Recipe.findById(originalId);
    if (existingRecipe) {
      return existingRecipe._id;
    }
  }

  let calories = recipeData.calories || 0;
  if (typeof calories === "string") {
    const match = calories.match(/(\d+)/);
    calories = match ? parseInt(match[1]) : 0;
  } else if (typeof calories !== "number") {
    calories = parseInt(calories) || 0;
  }

  let category = recipeData.category || "dinner";
  const validCategories = ["breakfast", "lunch", "dinner", "snack", "dessert"];
  if (!validCategories.includes(category)) {
    category = "dinner";
  }

  let servings = recipeData.servings || 4;
  if (typeof servings === "string") {
    servings = parseInt(servings) || 4;
  } else if (typeof servings !== "number") {
    servings = parseInt(servings) || 4;
  }

  const recipeToSave = {
    name: recipeData.name || "Untitled Recipe",
    description: recipeData.description || "",
    calories: calories,
    category: category,
    tags: Array.isArray(recipeData.tags) ? recipeData.tags : [],
    time: recipeData.time || recipeData.totalTime || "",
    image: recipeData.image || "",
    ingredients: Array.isArray(recipeData.ingredients)
      ? recipeData.ingredients
      : [],
    steps: Array.isArray(recipeData.steps)
      ? recipeData.steps
      : Array.isArray(recipeData.directions)
      ? recipeData.directions
      : [],
    servings: servings,
    imported: recipeData.imported || false,
    sourceUrl: recipeData.sourceUrl || "",
    userId: userId,
  };

  try {
    console.log("Saving recipe to database:", {
      name: recipeToSave.name,
      calories: recipeToSave.calories,
      category: recipeToSave.category,
      userId: userId.toString(),
    });
    const savedRecipe = await Recipe.create(recipeToSave);
    console.log("Recipe saved successfully with ID:", savedRecipe._id);
    return savedRecipe._id;
  } catch (error) {
    console.error("Error saving recipe to database:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      errors: error.errors,
    });
    throw error;
  }
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = await UserPreferences.create({ userId });
    }

    const savedRecipeIds = preferences.savedRecipes || [];
    const likedRecipeIds = preferences.likedRecipes || [];

    const savedRecipes = await Recipe.find({ _id: { $in: savedRecipeIds } });
    const likedRecipes = await Recipe.find({ _id: { $in: likedRecipeIds } });

    const preferencesObj = preferences.toObject();
    preferencesObj.savedRecipesData = savedRecipes;
    preferencesObj.likedRecipesData = likedRecipes;

    res.json({ preferences: preferencesObj });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/saved-recipes",
  body("recipeId")
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return false;
      }
      return true;
    })
    .withMessage("Recipe ID must be a valid MongoDB ObjectId"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { recipeId, recipe } = req.body;
    console.log(
      "POST /saved-recipes - Received recipeId:",
      recipeId,
      "Type:",
      typeof recipeId
    );
    console.log(
      "POST /saved-recipes - Received userId:",
      req.userId,
      "Type:",
      typeof req.userId
    );

    if (!recipeId) {
      return res.status(400).json({ message: "Recipe ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      console.error("Invalid userId format:", req.userId);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);
    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = await UserPreferences.create({ userId });
    }

    let recipeObjectId;

    if (mongoose.Types.ObjectId.isValid(recipeId)) {
      recipeObjectId = new mongoose.Types.ObjectId(recipeId);
      const recipeExists = await Recipe.findById(recipeObjectId);
      if (!recipeExists) {
        if (recipe) {
          try {
            recipeObjectId = await ensureRecipeInDatabase(recipe, userId);
            if (!recipeObjectId) {
              return res
                .status(500)
                .json({ message: "Failed to save recipe to database" });
            }
          } catch (dbError) {
            console.error(
              "Error in ensureRecipeInDatabase (saved-recipes):",
              dbError
            );
            return res.status(500).json({
              message: "Failed to save recipe to database",
              error: dbError.message,
            });
          }
        } else {
          return res
            .status(404)
            .json({ message: "Recipe not found in database" });
        }
      }
    } else {
      if (recipe) {
        try {
          recipeObjectId = await ensureRecipeInDatabase(recipe, userId);
          if (!recipeObjectId) {
            return res
              .status(500)
              .json({ message: "Failed to save recipe to database" });
          }
        } catch (dbError) {
          console.error(
            "Error in ensureRecipeInDatabase (saved-recipes):",
            dbError
          );
          return res.status(500).json({
            message: "Failed to save recipe to database",
            error: dbError.message,
          });
        }
      } else {
        return res.status(400).json({
          message:
            "Invalid recipe ID format. Recipe data is required to save to database.",
          recipeId: recipeId,
        });
      }
    }

    if (
      !preferences.savedRecipes.some(
        (id) => id.toString() === recipeObjectId.toString()
      )
    ) {
      preferences.savedRecipes.push(recipeObjectId);
      await preferences.save();
    }

      res.json({ preferences, savedRecipeId: recipeObjectId.toString() });
    } catch (error) {
    console.error("Save recipe error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (
      error.name === "CastError" ||
      error.message.includes("Cast to ObjectId")
    ) {
      return res.status(400).json({
        message:
          "Invalid recipe ID format. Recipe must be saved to database first.",
        recipeId: req.body.recipeId,
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete(
  "/saved-recipes/:recipeId",
  param("recipeId").isMongoId().withMessage("Invalid recipe ID"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = new mongoose.Types.ObjectId(req.userId);
      const preferences = await UserPreferences.findOne({ userId });
      if (!preferences) {
        return res.status(404).json({ message: "Preferences not found" });
      }

      preferences.savedRecipes = preferences.savedRecipes.filter(
        (id) => id.toString() !== req.params.recipeId
      );
      await preferences.save();

      res.json({ preferences });
    } catch (error) {
      console.error("Unsave recipe error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.post(
  "/liked-recipes",
  body("recipeId")
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return false;
      }
      return true;
    })
    .withMessage("Recipe ID must be a valid MongoDB ObjectId"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { recipeId, recipe } = req.body;
    console.log(
      "POST /liked-recipes - Received recipeId:",
      recipeId,
      "Type:",
      typeof recipeId
    );
    console.log(
      "POST /liked-recipes - Received userId:",
      req.userId,
      "Type:",
      typeof req.userId
    );

    if (!recipeId) {
      return res.status(400).json({ message: "Recipe ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      console.error("Invalid userId format:", req.userId);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);
    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = await UserPreferences.create({ userId });
    }

    let recipeObjectId;

    if (mongoose.Types.ObjectId.isValid(recipeId)) {
      recipeObjectId = new mongoose.Types.ObjectId(recipeId);
      const recipeExists = await Recipe.findById(recipeObjectId);
      if (!recipeExists) {
        if (recipe) {
          try {
            recipeObjectId = await ensureRecipeInDatabase(recipe, userId);
            if (!recipeObjectId) {
              return res
                .status(500)
                .json({ message: "Failed to save recipe to database" });
            }
          } catch (dbError) {
            console.error(
              "Error in ensureRecipeInDatabase (liked-recipes):",
              dbError
            );
            return res.status(500).json({
              message: "Failed to save recipe to database",
              error: dbError.message,
            });
          }
        } else {
          return res
            .status(404)
            .json({ message: "Recipe not found in database" });
        }
      }
    } else {
      if (recipe) {
        try {
          recipeObjectId = await ensureRecipeInDatabase(recipe, userId);
          if (!recipeObjectId) {
            return res
              .status(500)
              .json({ message: "Failed to save recipe to database" });
          }
        } catch (dbError) {
          console.error(
            "Error in ensureRecipeInDatabase (liked-recipes):",
            dbError
          );
          return res.status(500).json({
            message: "Failed to save recipe to database",
            error: dbError.message,
          });
        }
      } else {
        return res.status(400).json({
          message:
            "Invalid recipe ID format. Recipe data is required to save to database.",
          recipeId: recipeId,
        });
      }
    }

    if (
      !preferences.likedRecipes.some(
        (id) => id.toString() === recipeObjectId.toString()
      )
    ) {
      preferences.likedRecipes.push(recipeObjectId);
      await preferences.save();
    }

      res.json({ preferences, likedRecipeId: recipeObjectId.toString() });
    } catch (error) {
    console.error("Like recipe error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (
      error.name === "CastError" ||
      error.message.includes("Cast to ObjectId")
    ) {
      return res.status(400).json({
        message:
          "Invalid recipe ID format. Recipe must be saved to database first.",
        recipeId: req.body.recipeId,
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete(
  "/liked-recipes/:recipeId",
  param("recipeId").isMongoId().withMessage("Invalid recipe ID"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = new mongoose.Types.ObjectId(req.userId);
      const preferences = await UserPreferences.findOne({ userId });
      if (!preferences) {
        return res.status(404).json({ message: "Preferences not found" });
      }

      preferences.likedRecipes = preferences.likedRecipes.filter(
        (id) => id.toString() !== req.params.recipeId
      );
      await preferences.save();

      res.json({ preferences });
    } catch (error) {
      console.error("Unlike recipe error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.post("/saved-posts", async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);
    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = await UserPreferences.create({ userId });
    }

    if (!preferences.savedPosts.includes(postId)) {
      preferences.savedPosts.push(postId);
      await preferences.save();
    }

    res.json({ preferences });
  } catch (error) {
    console.error("Save post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/saved-posts/:postId", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      return res.status(404).json({ message: "Preferences not found" });
    }

    preferences.savedPosts = preferences.savedPosts.filter(
      (id) => id !== req.params.postId
    );
    await preferences.save();

    res.json({ preferences });
  } catch (error) {
    console.error("Unsave post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/liked-posts", async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);
    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = await UserPreferences.create({ userId });
    }

    if (!preferences.likedPosts.includes(postId)) {
      preferences.likedPosts.push(postId);
      await preferences.save();
    }

    res.json({ preferences });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/liked-posts/:postId", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      return res.status(404).json({ message: "Preferences not found" });
    }

    preferences.likedPosts = preferences.likedPosts.filter(
      (id) => id !== req.params.postId
    );
    await preferences.save();

    res.json({ preferences });
  } catch (error) {
    console.error("Unlike post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const validatePrivacy = [
  body("profileVisibility")
    .optional()
    .isIn(["everyone", "followers", "only-you"])
    .withMessage("Profile visibility must be everyone, followers, or only-you"),
  body("activityVisibility")
    .optional()
    .isIn(["everyone", "followers", "only-you"])
    .withMessage("Activity visibility must be everyone, followers, or only-you"),
  body("recipeVisibility")
    .optional()
    .isIn(["everyone", "followers", "only-you"])
    .withMessage("Recipe visibility must be everyone, followers, or only-you"),
  body("mentionsVisibility")
    .optional()
    .isIn(["everyone", "followers", "only-you"])
    .withMessage("Mentions visibility must be everyone, followers, or only-you"),
];

router.put("/privacy", validatePrivacy, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const {
      profileVisibility,
      activityVisibility,
      recipeVisibility,
      mentionsVisibility,
    } = req.body;

    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = await UserPreferences.create({ userId });
    }

    if (profileVisibility) {
      preferences.profileVisibility = profileVisibility;
    }
    if (activityVisibility) {
      preferences.activityVisibility = activityVisibility;
    }
    if (recipeVisibility) {
      preferences.recipeVisibility = recipeVisibility;
    }
    if (mentionsVisibility) {
      preferences.mentionsVisibility = mentionsVisibility;
    }

    await preferences.save();
    res.json({ preferences });
  } catch (error) {
    console.error("Update privacy settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const profileData = req.body;

    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = await UserPreferences.create({ userId });
    }

    if (profileData) {
      preferences.profileData = {
        ...preferences.profileData,
        ...profileData,
      };
    }

    await preferences.save();
    res.json({ preferences });
  } catch (error) {
    console.error("Update profile settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/display", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const displaySettings = req.body;

    let preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      preferences = await UserPreferences.create({ userId });
    }

    if (displaySettings) {
      preferences.displaySettings = {
        ...preferences.displaySettings,
        ...displaySettings,
      };
    }

    await preferences.save();
    res.json({ preferences });
  } catch (error) {
    console.error("Update display settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
