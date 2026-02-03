module.exports = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/fitfuel",
  JWT_SECRET:
    process.env.JWT_SECRET ||
    "fitfuel_jwt_secret_key_2024_change_in_production",
  // In production on Render, FRONTEND_ORIGIN should be your Render app URL
  // If not set, it will allow same-origin requests (which is fine since we serve static files)
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || (process.env.NODE_ENV === "production" ? undefined : "http://localhost:8008"),
  NODE_ENV: process.env.NODE_ENV || "development",
};
