const express = require("express");
const Goal = require("../models/Goal");
const Activity = require("../models/Activity");
const UserPreferences = require("../models/UserPreferences");
const Recipe = require("../models/Recipe");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

router.use(requireAuth);

router.get("/recipes", async (req, res) => {
  try {
    const userId = req.userId;

    const [goal, activities, preferences, allRecipes] = await Promise.all([
      Goal.findOne({ userId }),
      Activity.find({ userId }).sort({ date: -1 }).limit(10),
      UserPreferences.findOne({ userId }),
      Recipe.find().sort({ createdAt: -1 }),
    ]);

    console.log(
      `[Recommendations] Fetched ${allRecipes.length} recipes from database for user ${userId}`
    );

    const likedRecipeIds = preferences?.likedRecipes || [];
    const savedRecipeIds = preferences?.savedRecipes || [];

    const recommendations = generateRecipeRecommendations({
      goal,
      activities,
      likedRecipeIds,
      savedRecipeIds,
      allRecipes,
    });

    console.log(
      `[Recommendations] Returning ${recommendations.length} recommendations`
    );
    res.json({ recipes: recommendations });
  } catch (error) {
    console.error("Get recipe recommendations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

function generateRecipeRecommendations({
  goal,
  activities,
  likedRecipeIds,
  savedRecipeIds,
  allRecipes = [],
}) {
  if (!allRecipes || allRecipes.length === 0) {
    return [];
  }

  const recipes = allRecipes.map((recipe) => ({
    id: recipe._id.toString(),
    _id: recipe._id,
    name: recipe.name,
    description: recipe.description || "",
    calories: recipe.calories || 0,
    carbs: recipe.carbs || 0,
    protein: recipe.protein || 0,
    category: recipe.category || "dinner",
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    time: recipe.time || "N/A",
    image: recipe.image || "",
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    servings: recipe.servings || 4,
    createdAt: recipe.createdAt || new Date(),
  }));

  const hasUserData =
    goal ||
    (activities && activities.length > 0) ||
    (likedRecipeIds && likedRecipeIds.length > 0) ||
    (savedRecipeIds && savedRecipeIds.length > 0);

  if (!hasUserData) {
    return recipes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }

  const scoredRecipes = recipes.map((recipe) => {
    let score = 0;

    if (goal) {
      if (goal.type === "lose" && recipe.calories < 400) {
        score += 10;
      }
      if (goal.type === "gain" && recipe.calories > 400) {
        score += 10;
      }
      if (
        goal.type === "maintain" &&
        recipe.calories >= 300 &&
        recipe.calories <= 500
      ) {
        score += 8;
      }

      if (goal.dietType === "high-protein" && recipe.protein > 25) {
        score += 12;
      }
      if (goal.dietType === "low-carb" && recipe.carbs < 30) {
        score += 12;
      }
      if (goal.dietType === "keto" && recipe.carbs < 20) {
        score += 15;
      }
      if (
        goal.dietType === "vegetarian" &&
        recipe.tags &&
        recipe.tags.includes("vegetarian")
      ) {
        score += 10;
      }
      if (
        goal.dietType === "vegan" &&
        recipe.tags &&
        recipe.tags.includes("vegan")
      ) {
        score += 10;
      }
      if (
        goal.dietType === "mediterranean" &&
        recipe.tags &&
        recipe.tags.includes("mediterranean")
      ) {
        score += 10;
      }

      if (goal.macros && recipe.calories > 0) {
        const targetProtein = goal.macros.protein || 30;
        const targetCarbs = goal.macros.carbs || 40;
        const targetFat = goal.macros.fat || 30;

        const totalMacros =
          recipe.carbs + recipe.protein + (recipe.calories * 0.3) / 9;
        if (totalMacros > 0) {
          const recipeProteinPct =
            ((recipe.protein * 4) / recipe.calories) * 100;
          const recipeCarbsPct = ((recipe.carbs * 4) / recipe.calories) * 100;

          if (Math.abs(recipeProteinPct - targetProtein) < 10) score += 5;
          if (Math.abs(recipeCarbsPct - targetCarbs) < 10) score += 5;
        }
      }
    }

    if (activities && activities.length > 0) {
      const recentActivityTypes = activities.slice(0, 5).map((a) => a.type);

      if (
        recentActivityTypes.includes("cardio") ||
        recentActivityTypes.includes("strength")
      ) {
        if (
          (recipe.tags && recipe.tags.includes("post-workout")) ||
          recipe.protein > 25
        ) {
          score += 8;
        }
      }

      if (recentActivityTypes.includes("strength") && recipe.protein > 30) {
        score += 6;
      }
    }

    const recipeIdStr = recipe.id || recipe._id?.toString();
    if (
      likedRecipeIds &&
      likedRecipeIds.some((id) => id.toString() === recipeIdStr)
    ) {
      score += 15;
    }
    if (
      savedRecipeIds &&
      savedRecipeIds.some((id) => id.toString() === recipeIdStr)
    ) {
      score += 12;
    }

    const likedRecipes = recipes.filter((r) => {
      const rId = r.id || r._id?.toString();
      return (
        likedRecipeIds && likedRecipeIds.some((id) => id.toString() === rId)
      );
    });
    const savedRecipes = recipes.filter((r) => {
      const rId = r.id || r._id?.toString();
      return (
        savedRecipeIds && savedRecipeIds.some((id) => id.toString() === rId)
      );
    });

    likedRecipes.forEach((likedRecipe) => {
      if (likedRecipe.category === recipe.category) score += 4;
      if (
        likedRecipe.tags &&
        recipe.tags &&
        likedRecipe.tags.some((tag) => recipe.tags.includes(tag))
      )
        score += 3;
      if (Math.abs(likedRecipe.calories - recipe.calories) < 100) score += 2;
    });

    savedRecipes.forEach((savedRecipe) => {
      if (savedRecipe.category === recipe.category) score += 3;
      if (
        savedRecipe.tags &&
        recipe.tags &&
        savedRecipe.tags.some((tag) => recipe.tags.includes(tag))
      )
        score += 2;
    });

    if (recipe.protein > 25) {
      score += 3;
    }

    return { ...recipe, score };
  });

  return scoredRecipes
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, 6)
    .map(({ score, ...recipe }) => recipe);
}

module.exports = router;
