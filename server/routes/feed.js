const express = require("express");
const mongoose = require("mongoose");
const Goal = require("../models/Goal");
const Activity = require("../models/Activity");
const User = require("../models/User");
const UserPreferences = require("../models/UserPreferences");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

router.use(requireAuth);

async function canViewActivity(activity, viewerId, activityOwner) {
  if (!viewerId) return false;

  if (activityOwner._id.toString() === viewerId) {
    return true;
  }

  const preferences = await UserPreferences.findOne({
    userId: activityOwner._id,
  });
  const activityVisibility = preferences?.activityVisibility || "everyone";

  if (activityVisibility === "only-you") {
    return false;
  }

  if (activityVisibility === "followers") {
    const isFollower = activityOwner.followers.some(
      (followerId) => followerId.toString() === viewerId
    );
    return isFollower;
  }

  return true;
}

router.get("/", async (req, res) => {
  try {
    const userId = req.userId;

    const [goal, userActivities, preferences, allActivities, users] =
      await Promise.all([
        Goal.findOne({ userId }),
        Activity.find({ userId }).sort({ date: -1 }).limit(10),
        UserPreferences.findOne({ userId }),
        Activity.find().sort({ date: -1, createdAt: -1 }).limit(100),
        User.find().select("_id name email followers"),
      ]);

    const userMap = new Map();
    users.forEach((user) => {
      userMap.set(user._id.toString(), user);
    });

    const visibleActivities = [];
    for (const activity of allActivities) {
      const activityOwnerId = activity.userId?.toString();
      if (!activityOwnerId) continue;

      const activityOwner = userMap.get(activityOwnerId);
      if (!activityOwner) continue;

      const canView = await canViewActivity(activity, userId, activityOwner);
      if (canView) {
        const populatedActivity = activity.toObject();
        populatedActivity.userId = activityOwner;
        visibleActivities.push(populatedActivity);
      }
    }

    const likedPostIds = preferences?.likedPosts || [];
    const savedPostIds = preferences?.savedPosts || [];
    const likedRecipeIds = preferences?.likedRecipes || [];
    const savedRecipeIds = preferences?.savedRecipes || [];

    const recommendations = generatePersonalizedFeed({
      goal,
      activities: userActivities,
      visibleActivities,
      likedPostIds,
      savedPostIds,
      likedRecipeIds,
      savedRecipeIds,
    });

    res.json({ posts: recommendations });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

function generatePersonalizedFeed({
  goal,
  activities,
  visibleActivities,
  likedPostIds,
  savedPostIds,
  likedRecipeIds,
  savedRecipeIds,
}) {
  const activityPosts = (visibleActivities || []).map((activity) => {
    const ownerName = activity.userId?.name || "Unknown User";
    const ownerInitials = ownerName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const activityId = activity._id?.toString() || activity._id;

    return {
      id: `activity-${activityId}`,
      _id: activityId,
      user: { name: ownerName, avatar: ownerInitials },
      timestamp:
        activity.date || activity.createdAt || new Date().toISOString(),
      type: "workout",
      title: activity.title || "Activity",
      description: activity.description || "",
      metrics: {
        ...(activity.duration && { duration: `${activity.duration} min` }),
        ...(activity.intensity && { intensity: activity.intensity }),
        ...(activity.calories && { calories: `${activity.calories} kcal` }),
        ...(activity.metrics?.distance && {
          distance: `${activity.metrics.distance} km`,
        }),
        ...(activity.metrics?.elevation && {
          elevation: `${activity.metrics.elevation} m`,
        }),
      },
      images: activity.images || [],
      isUserUpload: false,
      likes: 0,
      saves: 0,
    };
  });

  const allPosts = [
    {
      id: "1",
      user: { name: "Sarah Johnson", avatar: "SJ" },
      timestamp: "December 15, 2024 at 2:30 PM",
      type: "workout",
      title: "Morning Run",
      description: "Beautiful sunrise run through the park. Felt amazing!",
      metrics: {
        distance: "5.2 km",
        elevation: "120m",
        time: "28:45",
        calories: "320 kcal",
      },
      images: ["workout1.jpg", "workout2.jpg"],
      isUserUpload: false,
      likes: 45,
      saves: 12,
    },
    {
      id: "2",
      user: { name: "Mike Chen", avatar: "MC" },
      timestamp: "December 15, 2024 at 1:15 PM",
      type: "recipe",
      title: "Protein Smoothie Bowl",
      description:
        "Perfect post-workout fuel with fresh berries and protein powder.",
      metrics: {
        calories: "320 kcal",
        carbs: "35g",
        protein: "25g",
        time: "5 min",
      },
      images: ["smoothie1.jpg", "smoothie2.jpg"],
      isUserUpload: false,
      likes: 38,
      saves: 15,
    },
    {
      id: "3",
      user: { name: "Emma Wilson", avatar: "EW" },
      timestamp: "December 15, 2024 at 11:45 AM",
      type: "workout",
      title: "HIIT Session",
      description: "Intense 30-minute HIIT workout. Sweating buckets!",
      metrics: { calories: "450 kcal", intensity: "High", time: "30 min" },
      images: ["hiit1.jpg", "hiit2.jpg"],
      isUserUpload: false,
      likes: 52,
      saves: 20,
    },
    {
      id: "4",
      user: { name: "Alex Rodriguez", avatar: "AR" },
      timestamp: "December 15, 2024 at 9:20 AM",
      type: "recipe",
      title: "Quinoa Power Bowl",
      description:
        "Loaded with veggies, quinoa, and tahini dressing. So satisfying!",
      metrics: {
        calories: "480 kcal",
        carbs: "65g",
        protein: "18g",
        time: "15 min",
      },
      images: ["quinoa1.jpg", "quinoa2.jpg"],
      isUserUpload: false,
      likes: 41,
      saves: 18,
    },
    {
      id: "5",
      user: { name: "Jessica Park", avatar: "JP" },
      timestamp: "December 14, 2024 at 6:00 PM",
      type: "workout",
      title: "Yoga Flow",
      description: "Evening yoga session to unwind after a long day.",
      metrics: {
        duration: "45 min",
        intensity: "Medium",
        calories: "180 kcal",
      },
      images: ["yoga1.jpg"],
      isUserUpload: false,
      likes: 35,
      saves: 10,
    },
    {
      id: "6",
      user: { name: "David Kim", avatar: "DK" },
      timestamp: "December 14, 2024 at 4:30 PM",
      type: "recipe",
      title: "Grilled Chicken Salad",
      description: "High protein, low carb meal perfect for weight loss goals.",
      metrics: {
        calories: "280 kcal",
        carbs: "12g",
        protein: "35g",
        time: "20 min",
      },
      images: ["salad1.jpg"],
      isUserUpload: false,
      likes: 48,
      saves: 22,
    },
    {
      id: "7",
      user: { name: "Lisa Thompson", avatar: "LT" },
      timestamp: "December 14, 2024 at 2:15 PM",
      type: "workout",
      title: "Strength Training",
      description: "Leg day! Focused on squats and deadlifts.",
      metrics: { duration: "60 min", intensity: "High", calories: "520 kcal" },
      images: ["strength1.jpg", "strength2.jpg"],
      isUserUpload: false,
      likes: 55,
      saves: 25,
    },
    {
      id: "8",
      user: { name: "Ryan Miller", avatar: "RM" },
      timestamp: "December 14, 2024 at 12:00 PM",
      type: "recipe",
      title: "Keto Avocado Toast",
      description: "Low carb breakfast option that keeps you full.",
      metrics: {
        calories: "220 kcal",
        carbs: "8g",
        protein: "12g",
        time: "10 min",
      },
      images: ["toast1.jpg"],
      isUserUpload: false,
      likes: 42,
      saves: 19,
    },
  ];

  const combinedPosts = [...activityPosts, ...allPosts];

  const hasUserData =
    goal ||
    (activities && activities.length > 0) ||
    (likedPostIds && likedPostIds.length > 0) ||
    (savedPostIds && savedPostIds.length > 0);

  if (!hasUserData) {
    return combinedPosts
      .map((post) => ({
        ...post,
        popularityScore: (post.likes || 0) + (post.saves || 0) * 2,
      }))
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 10);
  }

  const scoredPosts = combinedPosts.map((post) => {
    let score = 0;

    const caloriesStr = post.metrics?.calories || "";
    const postCalories =
      typeof caloriesStr === "string"
        ? parseInt(caloriesStr.replace(/[^\d]/g, "")) || 0
        : caloriesStr || 0;
    const postType = post.type;

    if (goal) {
      if (goal.type === "lose" && postType === "recipe" && postCalories < 400) {
        score += 10;
      }
      if (
        goal.type === "lose" &&
        postType === "workout" &&
        post.metrics?.intensity === "High"
      ) {
        score += 8;
      }
      if (goal.type === "gain" && postType === "recipe" && postCalories > 400) {
        score += 10;
      }
      if (
        goal.type === "maintain" &&
        postType === "recipe" &&
        postCalories >= 300 &&
        postCalories <= 500
      ) {
        score += 8;
      }

      const proteinStr = post.metrics?.protein || "";
      const protein =
        typeof proteinStr === "string"
          ? parseInt(proteinStr.replace(/[^\d]/g, "")) || 0
          : proteinStr || 0;
      const carbsStr = post.metrics?.carbs || "";
      const carbs =
        typeof carbsStr === "string"
          ? parseInt(carbsStr.replace(/[^\d]/g, "")) || 0
          : carbsStr || 0;

      if (
        goal.dietType === "high-protein" &&
        postType === "recipe" &&
        protein > 20
      ) {
        score += 7;
      }
      if (goal.dietType === "low-carb" && postType === "recipe" && carbs < 30) {
        score += 7;
      }
      if (goal.dietType === "keto" && postType === "recipe" && carbs < 20) {
        score += 8;
      }
      if (
        goal.dietType === "vegetarian" &&
        postType === "recipe" &&
        !post.title.toLowerCase().includes("chicken") &&
        !post.title.toLowerCase().includes("meat")
      ) {
        score += 6;
      }
    }

    if (activities && activities.length > 0) {
      const recentActivityTypes = activities.slice(0, 5).map((a) => a.type);
      if (postType === "workout") {
        if (
          recentActivityTypes.includes("cardio") &&
          post.title.toLowerCase().includes("run")
        ) {
          score += 6;
        }
        if (
          recentActivityTypes.includes("strength") &&
          post.title.toLowerCase().includes("strength")
        ) {
          score += 6;
        }
        if (
          recentActivityTypes.includes("flexibility") &&
          post.title.toLowerCase().includes("yoga")
        ) {
          score += 6;
        }
      }
    }

    if (likedPostIds.includes(post.id)) {
      score += 15;
    }
    if (savedPostIds.includes(post.id)) {
      score += 12;
    }

    const likedPosts = allPosts.filter((p) => likedPostIds.includes(p.id));
    const savedPosts = allPosts.filter((p) => savedPostIds.includes(p.id));

    likedPosts.forEach((likedPost) => {
      if (likedPost.type === post.type) score += 3;
      if (likedPost.user.name === post.user.name) score += 2;
    });

    savedPosts.forEach((savedPost) => {
      if (savedPost.type === post.type) score += 2;
      if (savedPost.user.name === post.user.name) score += 1;
    });

    score += (post.likes || 0) * 0.1;
    score += (post.saves || 0) * 0.2;

    return { ...post, score };
  });

  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ score, ...post }) => post);
}

module.exports = router;
