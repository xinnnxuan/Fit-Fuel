require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Activity = require("./models/Activity");
const Goal = require("./models/Goal");
const Recipe = require("./models/Recipe");
const UserPreferences = require("./models/UserPreferences");
const config = require("./config");

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to MongoDB");

    console.log("Clearing existing data...");
    await User.deleteMany({});
    await Activity.deleteMany({});
    await Goal.deleteMany({});
    await Recipe.deleteMany({});
    await UserPreferences.deleteMany({});
    console.log("Cleared existing data");

    console.log("Creating test users...");
    const passwordHash = await bcrypt.hash("testpassword123", 12);

    const user1 = await User.create({
      name: "Test User",
      email: "test@fitfuel.com",
      passwordHash: passwordHash,
      followers: [],
      following: [],
    });

    const user2 = await User.create({
      name: "Jane Doe",
      email: "jane@fitfuel.com",
      passwordHash: passwordHash,
      followers: [user1._id],
      following: [user1._id],
    });

    const user3 = await User.create({
      name: "John Smith",
      email: "john@fitfuel.com",
      passwordHash: passwordHash,
      followers: [],
      following: [user1._id],
    });

    console.log("Created test users");

    console.log("Creating test activities...");
    const activities = [
      {
        userId: user1._id,
        type: "cardio",
        title: "Morning Run",
        description: "5K morning run in the park",
        duration: 30,
        intensity: "moderate",
        calories: 350,
        date: new Date(),
        metrics: {
          distance: 5.0,
          pace: 6.0,
        },
      },
      {
        userId: user1._id,
        type: "strength",
        title: "Gym Workout",
        description: "Upper body strength training",
        duration: 45,
        intensity: "high",
        calories: 400,
        date: new Date(Date.now() - 86400000),
        metrics: {
          reps: 120,
          sets: 4,
        },
      },
      {
        userId: user2._id,
        type: "cardio",
        title: "Evening Bike Ride",
        description: "10 mile bike ride",
        duration: 60,
        intensity: "moderate",
        calories: 500,
        date: new Date(),
      },
    ];

    await Activity.insertMany(activities);
    console.log("Created test activities");

    console.log("Creating test goals...");
    const goal1 = await Goal.create({
      userId: user1._id,
      type: "lose-weight",
      category: "general",
      target: 2000,
      activityLevel: "active",
      age: 25,
      gender: "male",
      height: 175,
      weight: 75,
      dietType: "high-protein",
      allergies: ["nuts"],
    });

    const goal2 = await Goal.create({
      userId: user2._id,
      type: "maintain-weight",
      category: "active",
      target: 2200,
      activityLevel: "very-active",
      age: 28,
      gender: "female",
      height: 165,
      weight: 60,
      dietType: "vegetarian",
    });

    console.log("Created test goals");

    console.log("Creating test recipes...");
    const recipes = [
      {
        userId: user1._id,
        name: "Grilled Chicken Salad",
        description: "Healthy grilled chicken with mixed greens",
        calories: 350,
        category: "lunch",
        tags: ["healthy", "high-protein"],
        time: "30 min",
        prepTime: 15,
        cookTime: 15,
        protein: 35,
        carbs: 20,
        fat: 12,
        servings: 2,
        ingredients: [
          "2 chicken breasts",
          "4 cups mixed greens",
          "1 tomato",
          "1 cucumber",
          "2 tbsp olive oil",
        ],
        steps: [
          "Season chicken with salt and pepper",
          "Grill chicken for 6-7 minutes per side",
          "Chop vegetables and mix with greens",
          "Slice chicken and place on top of salad",
          "Drizzle with olive oil dressing",
        ],
      },
      {
        userId: user1._id,
        name: "Overnight Oats",
        description: "Quick and healthy breakfast option",
        calories: 280,
        category: "breakfast",
        tags: ["quick", "healthy"],
        time: "5 min",
        prepTime: 5,
        cookTime: 0,
        protein: 12,
        carbs: 45,
        fat: 8,
        servings: 1,
        ingredients: [
          "1/2 cup rolled oats",
          "1/2 cup almond milk",
          "1 tbsp chia seeds",
          "1/2 banana",
          "1 tbsp honey",
        ],
        steps: [
          "Mix oats, milk, and chia seeds in a jar",
          "Add sliced banana",
          "Drizzle with honey",
          "Refrigerate overnight",
          "Enjoy in the morning",
        ],
      },
      {
        userId: user2._id,
        name: "Vegetarian Pasta",
        description: "Delicious pasta with vegetables",
        calories: 420,
        category: "dinner",
        tags: ["vegetarian", "comfort-food"],
        time: "25 min",
        prepTime: 10,
        cookTime: 15,
        protein: 15,
        carbs: 65,
        fat: 10,
        servings: 3,
        ingredients: [
          "200g pasta",
          "2 bell peppers",
          "1 zucchini",
          "1 onion",
          "2 cloves garlic",
          "2 tbsp olive oil",
        ],
        steps: [
          "Cook pasta according to package directions",
          "Heat olive oil in a pan",
          "Sauté vegetables until tender",
          "Add cooked pasta to vegetables",
          "Season with salt and pepper",
        ],
      },
    ];

    const savedRecipes = await Recipe.insertMany(recipes);
    console.log("Created test recipes");

    console.log("Creating test user preferences...");
    await UserPreferences.create({
      userId: user1._id,
      profileVisibility: "everyone",
      activityVisibility: "everyone",
      recipeVisibility: "followers",
      mentionsVisibility: "everyone",
      savedRecipes: [savedRecipes[0]._id],
      likedRecipes: [savedRecipes[1]._id],
      profileData: {
        name: "Test User",
        location: "San Francisco, CA",
        bio: "Fitness enthusiast and recipe lover",
      },
      displaySettings: {
        unitsMeasurements: "imperial",
        temperature: "fahrenheit",
      },
    });

    await UserPreferences.create({
      userId: user2._id,
      profileVisibility: "followers",
      activityVisibility: "everyone",
      recipeVisibility: "everyone",
      mentionsVisibility: "followers",
    });

    console.log("Created test user preferences");

    console.log("\nDatabase seeding completed successfully!");
    console.log("\nTest Accounts:");
    console.log("  Email: test@fitfuel.com | Password: testpassword123");
    console.log("  Email: jane@fitfuel.com | Password: testpassword123");
    console.log("  Email: john@fitfuel.com | Password: testpassword123");
    console.log("\nYou can now start the server and test the application!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();
