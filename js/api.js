// Use relative URL for API calls - works in both development and production
// In development with separate servers: use absolute URL to backend
// In production: use relative URL since server serves static files
const API_BASE_URL = (() => {
  // Check if we're in development mode with separate frontend/backend servers
  const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const isFrontendPort = window.location.port === "8008" || window.location.port === "";
  
  // In development with live-server on port 8008, use backend on port 4000
  if (isDev && isFrontendPort) {
    return "http://localhost:4000/api";
  }
  
  // In production or when backend serves static files, use relative URL
  return "/api";
})();

const StorageKeys = {
  SAVED_RECIPES: "fitfuel-saved-recipes",
  LIKED_RECIPES: "fitfuel-liked-recipes",
  SAVED_POSTS: "fitfuel-saved-posts",
  LIKED_POSTS: "fitfuel-liked-posts",
};

function getUserId() {
  return window.currentUserId || "guest";
}

function getStorageKey(key) {
  return `${getUserId()}: ${key}`;
}

class AlertManager {
  success(message) {
    alert("✓ " + message);
  }

  error(message) {
    alert("✗ " + message);
  }

  info(message) {
    alert("ℹ " + message);
  }
}

class ApiService {
  static getToken() {
    return localStorage.getItem("fitfuel_token");
  }

  static setToken(token) {
    if (token) {
      localStorage.setItem("fitfuel_token", token);
    } else {
      localStorage.removeItem("fitfuel_token");
    }
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (
        !response.ok &&
        response.status === 401 &&
        endpoint.includes("/auth/me") &&
        !this.getToken()
      ) {
        return { user: null };
      }

      let data = {};
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        try {
          const responseText = await response.text();
          data = JSON.parse(responseText);
        } catch (jsonError) {
          if (!response.ok && response.status !== 401) {
            console.error("Failed to parse JSON response: ", jsonError);
          }
          if (!response.ok) {
            data = { message: `HTTP error! status: ${response.status}` };
          } else {
            throw jsonError;
          }
        }
      } else {
        try {
          const text = await response.text();
          if (text) {
            data = { message: text };
          }
        } catch (textError) {
          if (!response.ok && response.status !== 401) {
            console.error("Failed to read response text: ", textError);
          }
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          if (endpoint.includes("/auth/me")) {
            return { user: null };
          }
          const errorMessage = data.message || data.error || "Unauthorized";
          throw new Error(errorMessage);
        }
        const errorMessage =
          data.message ||
          data.error ||
          `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      if (
        !error.message ||
        (!error.message.includes("Unauthorized") &&
          !error.message.includes("401"))
      ) {
        console.error("API request failed: ", error);
      }
      throw error;
    }
  }

  static async register(userData) {
    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  static async login(credentials) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (response && response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  static async getCurrentUser() {
    try {
      return await this.request("/auth/me");
    } catch (error) {
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        return { user: null };
      }
      throw error;
    }
  }

  static async logout() {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  static async getRecipes() {
    return this.request("/recipes");
  }

  static async createRecipe(recipeData) {
    return this.request("/recipes", {
      method: "POST",
      body: JSON.stringify(recipeData),
    });
  }

  static async getRecipe(id) {
    return this.request(`/recipes/${id}`);
  }

  static async updateRecipe(id, recipeData) {
    return this.request(`/recipes/${id}`, {
      method: "PUT",
      body: JSON.stringify(recipeData),
    });
  }

  static async deleteRecipe(id) {
    return this.request(`/recipes/${id}`, {
      method: "DELETE",
    });
  }

  static async getActivities() {
    return this.request("/activities");
  }

  static async createActivity(activityData) {
    return this.request("/activities", {
      method: "POST",
      body: JSON.stringify(activityData),
    });
  }

  static async getActivity(id) {
    return this.request(`/activities/${id}`);
  }

  static async updateActivity(id, activityData) {
    return this.request(`/activities/${id}`, {
      method: "PUT",
      body: JSON.stringify(activityData),
    });
  }

  static async deleteActivity(id) {
    return this.request(`/activities/${id}`, {
      method: "DELETE",
    });
  }

  static async getGoal() {
    return this.request("/goals");
  }

  static async saveGoal(goalData) {
    return this.request("/goals", {
      method: "POST",
      body: JSON.stringify(goalData),
    });
  }

  static async updateGoal(goalData) {
    return this.request("/goals", {
      method: "PUT",
      body: JSON.stringify(goalData),
    });
  }

  static async deleteGoal() {
    return this.request("/goals", {
      method: "DELETE",
    });
  }

  static async getPreferences() {
    return this.request("/preferences");
  }

  static async saveRecipe(recipeId, recipe = null) {
    const payload = { recipeId };
    if (recipe) {
      payload.recipe = recipe;
    }
    return this.request("/preferences/saved-recipes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async unsaveRecipe(recipeId) {
    return this.request(`/preferences/saved-recipes/${recipeId}`, {
      method: "DELETE",
    });
  }

  static async likeRecipe(recipeId, recipe = null) {
    const payload = { recipeId };
    if (recipe) {
      payload.recipe = recipe;
    }
    return this.request("/preferences/liked-recipes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async unlikeRecipe(recipeId) {
    return this.request(`/preferences/liked-recipes/${recipeId}`, {
      method: "DELETE",
    });
  }

  static async savePost(postId) {
    return this.request("/preferences/saved-posts", {
      method: "POST",
      body: JSON.stringify({ postId }),
    });
  }

  static async unsavePost(postId) {
    return this.request(`/preferences/saved-posts/${postId}`, {
      method: "DELETE",
    });
  }

  static async likePost(postId) {
    return this.request("/preferences/liked-posts", {
      method: "POST",
      body: JSON.stringify({ postId }),
    });
  }

  static async unlikePost(postId) {
    return this.request(`/preferences/liked-posts/${postId}`, {
      method: "DELETE",
    });
  }

  static async getFeed() {
    return this.request("/feed");
  }

  static async getRecipeRecommendations(period = null) {
    const endpoint = period
      ? `/recommendations/recipes?period=${period}`
      : "/recommendations/recipes";
    return this.request(endpoint);
  }

  static async updatePrivacySettings(privacyData) {
    return this.request("/preferences/privacy", {
      method: "PUT",
      body: JSON.stringify(privacyData),
    });
  }

  static async getUserProfile(userId) {
    return this.request(`/auth/users/${userId}`);
  }

  static async updateProfileSettings(profileData) {
    return this.request("/preferences/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  static async updateDisplaySettings(displayData) {
    return this.request("/preferences/display", {
      method: "PUT",
      body: JSON.stringify(displayData),
    });
  }
}
