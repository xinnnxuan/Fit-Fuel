class ProfileManager {
  constructor() {
    this.mockData = {
      todayBurn: 0,
      dailyGoal: 2000,
      weeklyStats: {
        distance: "10.3km",
        duration: "0h 58m",
        elevation: "60m",
      },
    };
  }

  init() {
    this.loadProfileData();
    this.setupTabNavigation();
    this.setupFollowingDropdown();
    this.setupRecipeCardClicks();
    this.setupRecipeSaveLikeListeners();
    this.setupFilterButtons();
    this.setupGalleryRemoveButtons();
  }

  setupRecipeSaveLikeListeners() {
    document.addEventListener("recipeSaved", (e) => {
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="saved"]')
          ?.dataset.filter || "all";
      this.renderSaved(activeFilter);
    });

    document.addEventListener("recipeUnsaved", (e) => {
      const recipeId = String(e.detail.recipeId || "");
      if (recipeId) {
        const recipesKey = getStorageKey(StorageKeys.SAVED_RECIPES);
        try {
          const localSavedRecipes = JSON.parse(
            localStorage.getItem(recipesKey) || "[]"
          );
          const filtered = localSavedRecipes.filter((r) => {
            const id = String(r.id || r._id || r);
            return id !== recipeId;
          });
          localStorage.setItem(recipesKey, JSON.stringify(filtered));
        } catch (err) {
          console.error("Error removing recipe from localStorage:", err);
        }
      }
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="saved"]')
          ?.dataset.filter || "all";
      this.renderSaved(activeFilter);
    });

    document.addEventListener("recipeLiked", (e) => {
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="like"]')
          ?.dataset.filter || "all";
      this.renderLiked(activeFilter);
    });

    document.addEventListener("recipeUnliked", (e) => {
      const recipeId = String(e.detail.recipeId || "");
      if (recipeId) {
        const recipesKey = getStorageKey(StorageKeys.LIKED_RECIPES);
        try {
          const localLikedRecipes = JSON.parse(
            localStorage.getItem(recipesKey) || "[]"
          );
          const filtered = localLikedRecipes.filter((r) => {
            const id = String(r.id || r._id || r);
            return id !== recipeId;
          });
          localStorage.setItem(recipesKey, JSON.stringify(filtered));
        } catch (err) {
          console.error("Error removing recipe from localStorage:", err);
        }
      }
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="like"]')
          ?.dataset.filter || "all";
      this.renderLiked(activeFilter);
    });

    document.addEventListener("postSaved", (e) => {
      const postId = String(e.detail.postId || "");
      if (postId) {
        const postsKey = getStorageKey(StorageKeys.SAVED_POSTS);
        try {
          const localSavedPostIds = JSON.parse(
            localStorage.getItem(postsKey) || "[]"
          );
          if (!localSavedPostIds.includes(postId)) {
            localSavedPostIds.push(postId);
            localStorage.setItem(postsKey, JSON.stringify(localSavedPostIds));
          }
        } catch (err) {
          console.error("Error adding post to localStorage:", err);
        }
      }
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="saved"]')
          ?.dataset.filter || "all";
      this.renderSaved(activeFilter);
    });

    document.addEventListener("postUnsaved", (e) => {
      const postId = String(e.detail.postId || "");
      if (postId) {
        const postsKey = getStorageKey(StorageKeys.SAVED_POSTS);
        try {
          const localSavedPostIds = JSON.parse(
            localStorage.getItem(postsKey) || "[]"
          );
          const filtered = localSavedPostIds.filter(
            (id) => String(id) !== postId
          );
          localStorage.setItem(postsKey, JSON.stringify(filtered));
        } catch (err) {
          console.error("Error removing post from localStorage:", err);
        }
      }
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="saved"]')
          ?.dataset.filter || "all";
      this.renderSaved(activeFilter);
    });

    document.addEventListener("postLiked", (e) => {
      const postId = String(e.detail.postId || "");
      if (postId) {
        const postsKey = getStorageKey(StorageKeys.LIKED_POSTS);
        try {
          const localLikedPostIds = JSON.parse(
            localStorage.getItem(postsKey) || "[]"
          );
          if (!localLikedPostIds.includes(postId)) {
            localLikedPostIds.push(postId);
            localStorage.setItem(postsKey, JSON.stringify(localLikedPostIds));
          }
        } catch (err) {
          console.error("Error adding post to localStorage:", err);
        }
      }
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="like"]')
          ?.dataset.filter || "all";
      this.renderLiked(activeFilter);
    });

    document.addEventListener("postUnliked", (e) => {
      const postId = String(e.detail.postId || "");
      if (postId) {
        const postsKey = getStorageKey(StorageKeys.LIKED_POSTS);
        try {
          const localLikedPostIds = JSON.parse(
            localStorage.getItem(postsKey) || "[]"
          );
          const filtered = localLikedPostIds.filter(
            (id) => String(id) !== postId
          );
          localStorage.setItem(postsKey, JSON.stringify(filtered));
        } catch (err) {
          console.error("Error removing post from localStorage:", err);
        }
      }
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="like"]')
          ?.dataset.filter || "all";
      this.renderLiked(activeFilter);
    });
  }

  setupFilterButtons() {
    document.addEventListener("click", (e) => {
      const filterBtn = e.target.closest(".profile-filter-btn");
      if (!filterBtn) return;

      const filter = filterBtn.dataset.filter;
      const tab = filterBtn.dataset.tab;

      document
        .querySelectorAll(`.profile-filter-btn[data-tab="${tab}"]`)
        .forEach((btn) => {
          btn.classList.remove("active");
        });
      filterBtn.classList.add("active");

      if (tab === "saved") {
        this.renderSaved(filter);
      } else if (tab === "like") {
        this.renderLiked(filter);
      }
    });
  }

  setupGalleryRemoveButtons() {
    document.addEventListener("click", async (e) => {
      const removeBtn = e.target.closest(".gallery-remove-btn");
      if (!removeBtn) return;

      e.preventDefault();
      e.stopPropagation();

      const itemType = removeBtn.dataset.type;
      const itemId = removeBtn.dataset.id;
      const action = removeBtn.dataset.action;
      const card = removeBtn.closest(".gallery-card");
      const container = card?.closest(".gallery-grid")?.parentElement;
      const isSavedTab = container?.id === "saved-items-container";
      const isLikedTab = container?.id === "like-items-container";

      if (!itemId || !action) return;

      try {
        if (action === "unsave") {
          if (itemType === "post") {
            await ApiService.unsavePost(itemId);
            document.dispatchEvent(
              new CustomEvent("postUnsaved", {
                detail: { postId: itemId },
              })
            );
          } else if (itemType === "recipe") {
            await ApiService.unsaveRecipe(itemId);
            document.dispatchEvent(
              new CustomEvent("recipeUnsaved", {
                detail: { recipeId: itemId },
              })
            );
          }
          alertManager.success("Removed from saved items.");
        } else if (action === "unlike") {
          if (itemType === "post") {
            await ApiService.unlikePost(itemId);
            document.dispatchEvent(
              new CustomEvent("postUnliked", {
                detail: { postId: itemId },
              })
            );
          } else if (itemType === "recipe") {
            await ApiService.unlikeRecipe(itemId);
            document.dispatchEvent(
              new CustomEvent("recipeUnliked", {
                detail: { recipeId: itemId },
              })
            );
          }
          alertManager.success("Removed from liked items.");
        }

        const activeFilter =
          document.querySelector(
            `.profile-filter-btn.active[data-tab="${
              isSavedTab ? "saved" : "like"
            }"]`
          )?.dataset.filter || "all";
        if (isSavedTab) {
          this.renderSaved(activeFilter);
        } else if (isLikedTab) {
          this.renderLiked(activeFilter);
        }
      } catch (error) {
        console.error("Error removing item:", error);
        alertManager.error("Failed to remove item. Please try again.");
      }
    });
  }

  setupRecipeCardClicks() {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".gallery-remove-btn")) return;

      const recipeCard = e.target.closest(".recommended-recipe-card");
      if (recipeCard) {
        const recipeId = recipeCard.dataset.recipeId;
        const recipeBtn = recipeCard.querySelector(".recipe-card-btn");

        if (e.target === recipeBtn || recipeBtn.contains(e.target)) {
          const recipe = this.getRecipeFromCard(recipeCard);
          if (recipe && window.recipeViewManager) {
            window.recipeViewManager.showRecipe(recipe);
          }
        }
        return;
      }

      const galleryCard = e.target.closest(".gallery-card.recipe-card");
      if (
        galleryCard &&
        !e.target.closest(".recipe-action-btn") &&
        !e.target.closest(".gallery-remove-btn")
      ) {
        const recipeId = galleryCard.dataset.recipeId;
        const postId = galleryCard.dataset.postId;

        if (recipeId && window.recipesManager) {
          window.recipesManager.viewRecipeById(recipeId);
        } else if (postId && window.feedManager) {
          const post = window.feedManager.feedPosts.find(
            (p) => String(p.id) === String(postId)
          );
          if (post) {
            window.feedManager.viewRecipeFromPost(post);
          }
        }
      }
    });
  }

  getRecipeFromCard(card) {
    const title = card.querySelector(".recipe-card-title")?.textContent || "";
    const description =
      card.querySelector(".recipe-card-description")?.textContent || "";

    const metricItems = card.querySelectorAll(".metric-item");
    let calories = 0,
      protein = 0,
      carbs = 0,
      time = "N/A";

    metricItems.forEach((item) => {
      const label =
        item.querySelector(".metric-label")?.textContent?.toLowerCase() || "";
      const value = item.querySelector(".metric-value")?.textContent || "";

      if (label.includes("calories")) {
        calories = parseInt(value.replace(/[^\d]/g, "")) || 0;
      } else if (label.includes("protein")) {
        protein = parseInt(value.replace(/[^\d]/g, "")) || 0;
      } else if (label.includes("carbs")) {
        carbs = parseInt(value.replace(/[^\d]/g, "")) || 0;
      } else if (label.includes("time")) {
        time = value;
      }
    });

    const tags = Array.from(
      card.querySelectorAll(".recipe-card-tags .tag")
    ).map((tag) => tag.textContent);

    return {
      id: card.dataset.recipeId,
      name: title,
      description: description,
      calories: calories,
      protein: protein,
      carbs: carbs,
      time: time,
      tags: tags,
    };
  }

  showDashboard() {
    document.querySelectorAll("section").forEach((section) => {
      section.style.display = "none";
    });

    const profile = document.getElementById("profile");
    if (profile) {
      profile.style.display = "block";
      this.loadProfileData();
    }
  }

  setupTabNavigation() {
    const tabButtons = document.querySelectorAll(".profile-nav-item");
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        tabButtons.forEach((btn) => btn.classList.remove("active"));

        button.classList.add("active");

        const tabName = button.getAttribute("data-tab");
        this.switchTab(tabName);
      });
    });
  }

  setupFollowingDropdown() {
    const dropdownBtn = document.getElementById("following-dropdown-btn");
    const dropdownMenu = document.getElementById("following-dropdown-menu");
    const dropdownItems = document.querySelectorAll(".dropdown-item");

    if (!dropdownBtn || !dropdownMenu) return;

    const defaultItem = document.querySelector(
      '.dropdown-item[data-option="following"]'
    );
    if (defaultItem) {
      defaultItem.classList.add("active");
      const buttonSpan = dropdownBtn.querySelector("span");
      if (buttonSpan) {
        buttonSpan.textContent = "I'm Following";
      }

      this.handleDropdownOption("following");
    }

    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    dropdownItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();

        dropdownItems.forEach((dropdownItem) => {
          dropdownItem.classList.remove("active");
        });

        item.classList.add("active");

        const buttonSpan = dropdownBtn.querySelector("span");
        if (buttonSpan) {
          buttonSpan.textContent = item.textContent;
        }

        dropdownMenu.classList.remove("show");

        const option = item.getAttribute("data-option");
        this.handleDropdownOption(option);
      });
    });

    document.addEventListener("click", () => {
      dropdownMenu.classList.remove("show");
    });
  }

  initializeFollowingDropdown() {
    const dropdownBtn = document.getElementById("following-dropdown-btn");
    const dropdownItems = document.querySelectorAll(".dropdown-item");

    if (!dropdownBtn || !dropdownItems.length) return;

    const defaultItem = document.querySelector(
      '.dropdown-item[data-option="following"]'
    );
    if (defaultItem) {
      dropdownItems.forEach((item) => {
        item.classList.remove("active");
      });

      defaultItem.classList.add("active");

      const buttonSpan = dropdownBtn.querySelector("span");
      if (buttonSpan) {
        buttonSpan.textContent = "I'm Following";
      }

      this.handleDropdownOption("following");
    }
  }

  handleDropdownOption(option) {
    const followingList = document.querySelector(".following-list");
    if (!followingList) return;

    switch (option) {
      case "following":
        followingList.innerHTML = `

            <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Dalton Dawson< /div> <div class="following-location">Spokane, Washington< /div> </div> <button class="following-btn"> </button> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Emma Spence< /div> <div class="following-location">Seattle, Washington< /div> </div> <button class="following-btn"> </button> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Jacob Spence< /div> <div class="following-location">Spokane, Washington< /div> </div> <button class="following-btn"> </button> </div>
            `;
        break;

      case "followers":
        followingList.innerHTML = `
            <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Dalton Dawson< /div> <div class="following-location">Spokane, Washington< /div> </div> <div class="following-actions"> <button class="following-btn"> </button> <button class="settings-btn" onclick="showFollowerOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Emma Spence< /div> <div class="following-location">Seattle, Washington< /div> </div> <div class="following-actions"> <button class="following-btn"> </button> <button class="settings-btn" onclick="showFollowerOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Jacob Spence< /div> <div class="following-location">Spokane, Washington< /div> </div> <div class="following-actions"> <button class="following-btn"> </button> <button class="settings-btn" onclick="showFollowerOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div>
            `;
        break;

      case "suggestions":
        followingList.innerHTML = `

            <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Clark Dunmore< /div> <div class="following-location">Spokane, Washington< /div> <div class="connection-reason">You have mutual friends on FitFuel< /div> </div> <div class="following-actions"> <button class="follow-btn private" onclick="handleFollowAction(this, 'request')"> <i class="fas fa-lock"> </i>
            Request to Follow
            < /button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Jazz Scott< /div> <div class="following-location">Portland, Oregon< /div> <div class="connection-reason">You have mutual friends on FitFuel< /div> </div> <div class="following-actions"> <button class="follow-btn" onclick="handleFollowAction(this, 'follow')">Follow< /button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Brock Bozett< /div> <div class="following-location">Coeur d'Alene, Idaho< /div> <div class="connection-reason">You have mutual friends on FitFuel< /div> </div> <div class="following-actions"> <button class="following-btn" onclick="handleFollowAction(this, 'unfollow')"> </button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Derek Dunmore< /div> <div class="following-location">Spokane, Washington< /div> <div class="connection-reason">You have mutual friends on FitFuel< /div> </div> <div class="following-actions"> <button class="follow-btn" onclick="handleFollowAction(this, 'follow')">Follow< /button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">JD Howard< /div> <div class="following-location">Spokane, Washington< /div> <div class="connection-reason">You have mutual friends on FitFuel< /div> </div> <div class="following-actions"> <button class="following-btn" onclick="handleFollowAction(this, 'unfollow')"> </button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <div class="avatar-initial">C< /div> </div> <div class="following-info"> <div class="following-name">Connor Spanos< /div> <div class="following-location">Flagstaff, Arizona< /div> <div class="connection-reason">You have mutual friends on FitFuel< /div> </div> <div class="following-actions"> <button class="follow-btn" onclick="handleFollowAction(this, 'follow')">Follow< /button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <div class="avatar-initial">I< /div> </div> <div class="following-info"> <div class="following-name">Iain Palmer< /div> <div class="following-location">Spokane, Washington< /div> <div class="connection-reason">You have mutual friends on FitFuel< /div> </div> <div class="following-actions"> <button class="follow-btn private" onclick="handleFollowAction(this, 'request')"> <i class="fas fa-lock"> </i>
            Request to Follow
            < /button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Adystra Bimo / One Track Mind< /div> <div class="following-location">Singapore< /div> <div class="connection-reason">Fan favorite on FitFuel< /div> </div> <div class="following-actions"> <button class="follow-btn" onclick="handleFollowAction(this, 'follow')">Follow< /button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Logan O'Dell< /div> <div class="following-location">Washington< /div> <div class="connection-reason">You have mutual friends on FitFuel< /div> </div> <div class="following-actions"> <button class="following-btn" onclick="handleFollowAction(this, 'unfollow')"> </button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <img src="https:
            < /div> <div class="following-info"> <div class="following-name">Sabin Mulch< /div> <div class="following-location">Seattle, Washington< /div> <div class="connection-reason">You have mutual friends on FitFuel< /div> </div> <div class="following-actions"> <button class="follow-btn" onclick="handleFollowAction(this, 'follow')">Follow< /button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <div class="avatar-initial generic">👤< /div> </div> <div class="following-info"> <div class="following-name">Ian McDowell< /div> <div class="following-location">Christchurch, Canterbury, New Zealand< /div> <div class="connection-reason">You've done activities together< /div> </div> <div class="following-actions"> <button class="follow-btn" onclick="handleFollowAction(this, 'follow')">Follow< /button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div> <div class="following-item"> <div class="following-avatar"> <div class="avatar-initial">A< /div> </div> <div class="following-info"> <div class="following-name">Andrew Smith< /div> <div class="following-location">Seattle, Washington< /div> <div class="connection-reason">You have mutual friends on FitFuel< /div> </div> <div class="following-actions"> <button class="following-btn" onclick="handleFollowAction(this, 'unfollow')"> </button> <button class="settings-btn" onclick="showSuggestionsOptions(this)"> <i class="fas fa-cog"> </i> </button> </div> </div>
            `;
        break;
    }
  }

  switchTab(tabName) {
    document.querySelectorAll(".profile-nav-item").forEach((item) => {
      item.classList.remove("active");
    });

    const selectedNavItem = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedNavItem) {
      selectedNavItem.classList.add("active");
    }

    document.querySelectorAll(".profile-section").forEach((section) => {
      section.style.display = "none";
    });

    const selectedContent = document.getElementById(`${tabName}-content`);
    if (selectedContent) {
      selectedContent.style.display = "block";
    }

    if (tabName === "following") {
      this.initializeFollowingDropdown();
    }

    if (tabName === "saved") {
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="saved"]')
          ?.dataset.filter || "all";
      this.renderSaved(activeFilter);
    }

    if (tabName === "like") {
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="like"]')
          ?.dataset.filter || "all";
      this.renderLiked(activeFilter);
    }
  }

  async loadProfileData() {
    await this.updateProfileInfo();
    await this.updateKPIs();
    this.loadActivities();
    this.updateWeeklyStats();
    this.updateTotalCounters();
    this.updateCalendar();
    this.loadRecipeRecommendations();

    const savedSection = document.getElementById("saved-content");
    if (savedSection && savedSection.style.display !== "none") {
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="saved"]')
          ?.dataset.filter || "all";
      this.renderSaved(activeFilter);
    }

    const likeSection = document.getElementById("like-content");
    if (likeSection && likeSection.style.display !== "none") {
      const activeFilter =
        document.querySelector('.profile-filter-btn.active[data-tab="like"]')
          ?.dataset.filter || "all";
      this.renderLiked(activeFilter);
    }
  }

  async updateProfileInfo() {
    try {
      const response = await ApiService.getCurrentUser();
      const user = response?.user;

      const nameElement = document.querySelector(".profile-info h1");
      const locationElement = document.querySelector(".profile-info .location");
      const avatarElement = document.querySelector(".profile-avatar");

      if (user) {
        if (nameElement) {
          nameElement.textContent = user.name || "User";
        }
        if (locationElement) {
          locationElement.textContent = user.location || "Location not set";
        }
        if (avatarElement && user.avatar) {
          avatarElement.innerHTML = `<img src="${user.avatar}" alt="${user.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else if (avatarElement && user.name) {
          const initials = user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          avatarElement.innerHTML = initials || '<i class="fas fa-user"></i>';
        }
      } else {
        if (nameElement) {
          nameElement.textContent = "Guest";
        }
        if (locationElement) {
          locationElement.textContent = "Not logged in";
        }
      }
    } catch (error) {
      console.error("Error loading profile info:", error);
      const nameElement = document.querySelector(".profile-info h1");
      const locationElement = document.querySelector(".profile-info .location");
      if (nameElement) {
        nameElement.textContent = "Guest";
      }
      if (locationElement) {
        locationElement.textContent = "Not logged in";
      }
    }
  }

  async renderSaved(filter = "all") {
    const container = document.getElementById("saved-items-container");
    if (!container) {
      return;
    }

    const userId = getUserId();
    let savedPostIds = [];
    let savedRecipes = [];

    if (userId !== "guest") {
      try {
        const response = await ApiService.getPreferences();
        if (response && response.preferences) {
          savedPostIds = response.preferences.savedPosts || [];
          savedRecipes =
            response.preferences.savedRecipesData ||
            response.preferences.savedRecipes ||
            [];
        }
      } catch (error) {
        if (error.message && !error.message.includes("Unauthorized")) {
          console.error("Error loading saved items: ", error);
        }
      }
    }

    const postsKey = getStorageKey(StorageKeys.SAVED_POSTS);
    const recipesKey = getStorageKey(StorageKeys.SAVED_RECIPES);

    const apiSavedPostIds = new Set(savedPostIds.map(String));
    const apiSavedRecipeIds = new Set(
      savedRecipes.map((r) => String(r._id || r.id || r))
    );

    try {
      const localSavedPostIds = JSON.parse(
        localStorage.getItem(postsKey) || "[]"
      );
      if (Array.isArray(localSavedPostIds)) {
        const localIds = localSavedPostIds
          .map(String)
          .filter((id) => !apiSavedPostIds.has(id));
        savedPostIds = [...savedPostIds.map(String), ...localIds];
      } else {
        savedPostIds = savedPostIds.map(String);
      }
    } catch {
      savedPostIds = savedPostIds.map(String);
    }
    try {
      const localSavedRecipes = JSON.parse(
        localStorage.getItem(recipesKey) || "[]"
      );
      if (Array.isArray(localSavedRecipes)) {
        const recipeMap = new Map();
        savedRecipes.forEach((r) => {
          const id = String(r._id || r.id || r);
          recipeMap.set(id, r);
        });
        localSavedRecipes.forEach((r) => {
          const id = String(r.id || r);
          if (!recipeMap.has(id) && !apiSavedRecipeIds.has(id)) {
            recipeMap.set(id, r);
          }
        });
        savedRecipes = Array.from(recipeMap.values());
      }
    } catch {}

    const savedPostIdsSet = new Set(savedPostIds.map(String));
    const posts =
      window.feedManager && window.feedManager.feedPosts
        ? window.feedManager.feedPosts.filter((p) =>
            savedPostIdsSet.has(String(p.id))
          )
        : [];

    const items = [];
    const allItems = [];

    if (filter === "all" || filter === "posts") {
      posts.forEach((post) => {
        allItems.push({
          type: "post",
          id: post.id,
          data: post,
        });
      });
    }

    if (filter === "all" || filter === "recipes") {
      savedRecipes.forEach((r) => {
        const recipeId = String(r._id || r.id || r);
        allItems.push({
          type: "recipe",
          id: recipeId,
          data: r,
        });
      });
    }

    if (allItems.length > 0) {
      items.push('<div class="gallery-grid">');
      allItems.forEach((item) => {
        if (item.type === "post") {
          const postImage =
            item.data.images && item.data.images.length > 0
              ? item.data.images[0]
              : null;
          const hasPostImage =
            postImage &&
            (postImage.startsWith("data:image/") ||
              postImage.startsWith("http"));

          items.push(`
                    <div class="gallery-card recipe-card" data-type="post" data-post-id="${
                      item.id
                    }">
                        <button class="gallery-remove-btn" data-type="post" data-id="${
                          item.id
                        }" data-action="unsave" title="Remove from saved">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="recipe-image">
                            ${
                              hasPostImage
                                ? `<img src="${postImage}" alt="${
                                    item.data.title || "Post"
                                  }" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                                : ""
                            }
                        </div>
                    </div>
                    `);
        } else {
          const recipeImage = item.data.image;
          const hasRecipeImage =
            recipeImage &&
            (recipeImage.startsWith("data:image/") ||
              recipeImage.startsWith("http"));

          items.push(`
                    <div class="gallery-card recipe-card" data-type="recipe" data-recipe-id="${
                      item.id
                    }">
                        <button class="gallery-remove-btn" data-type="recipe" data-id="${
                          item.id
                        }" data-action="unsave" title="Remove from saved">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="recipe-image">
                            ${
                              hasRecipeImage
                                ? `<img src="${recipeImage}" alt="${
                                    item.data.name || "Recipe"
                                  }" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                                : ""
                            }
                        </div>
                    </div>
                    `);
        }
      });
      items.push("</div>");
    }

    if (!items.length) {
      container.innerHTML = `
            <h2>Saved ${
              filter === "recipes"
                ? "Recipes"
                : filter === "posts"
                ? "Posts"
                : "Items"
            }</h2> <p>Your saved ${
        filter === "recipes"
          ? "recipes"
          : filter === "posts"
          ? "posts"
          : "items"
      } will appear here.</p>
            `;
    } else {
      container.innerHTML = items.join("");
    }
  }

  async renderLiked(filter = "all") {
    const container = document.getElementById("like-items-container");
    if (!container) {
      return;
    }

    const userId = getUserId();
    let likedPostIds = [];
    let likedRecipeIds = [];
    let likedRecipes = [];

    if (userId !== "guest") {
      try {
        const response = await ApiService.getPreferences();
        if (response && response.preferences) {
          likedPostIds = response.preferences.likedPosts || [];
          likedRecipeIds = (response.preferences.likedRecipes || []).map(
            String
          );
          likedRecipes = response.preferences.likedRecipesData || [];
        }
      } catch (error) {
        if (error.message && !error.message.includes("Unauthorized")) {
          console.error("Error loading liked items: ", error);
        }
      }
    }

    const postsKey = getStorageKey(StorageKeys.LIKED_POSTS);
    const recipesKey = getStorageKey(StorageKeys.LIKED_RECIPES);

    const apiLikedPostIds = new Set(likedPostIds.map(String));
    const apiLikedRecipeIds = new Set(likedRecipeIds);

    try {
      const localLikedPostIds = JSON.parse(
        localStorage.getItem(postsKey) || "[]"
      );
      if (Array.isArray(localLikedPostIds)) {
        const localIds = localLikedPostIds
          .map(String)
          .filter((id) => !apiLikedPostIds.has(id));
        likedPostIds = [...likedPostIds.map(String), ...localIds];
      } else {
        likedPostIds = likedPostIds.map(String);
      }
    } catch {
      likedPostIds = likedPostIds.map(String);
    }
    try {
      const localLikedRecipeIds = JSON.parse(
        localStorage.getItem(recipesKey) || "[]"
      ).map(String);
      if (Array.isArray(localLikedRecipeIds)) {
        const localIds = localLikedRecipeIds.filter(
          (id) => !apiLikedRecipeIds.has(id)
        );
        likedRecipeIds = [...likedRecipeIds, ...localIds];
      }
    } catch {}

    const likedPostIdsSet = new Set(likedPostIds.map(String));
    const posts =
      window.feedManager && window.feedManager.feedPosts
        ? window.feedManager.feedPosts.filter((p) =>
            likedPostIdsSet.has(String(p.id))
          )
        : [];

    const recipeMap = new Map();

    likedRecipes.forEach((r) => {
      const id = String(r._id || r.id || r);
      recipeMap.set(id, r);
    });

    const allRecipes =
      window.recipesManager && window.recipesManager.recipes
        ? window.recipesManager.recipes
        : [];
    allRecipes.forEach((r) => {
      const id = String(r.id || r);
      if (likedRecipeIds.includes(id) && !recipeMap.has(id)) {
        recipeMap.set(id, r);
      }
    });

    let recipes = Array.from(recipeMap.values());

    try {
      const localLikedRecipes = JSON.parse(
        localStorage.getItem(recipesKey) || "[]"
      );
      if (Array.isArray(localLikedRecipes)) {
        localLikedRecipes.forEach((r) => {
          if (typeof r === "object" && r !== null && (r.id || r.name)) {
            const id = String(r.id || r);
            if (!recipeMap.has(id)) {
              recipeMap.set(id, r);
            }
          }
        });
        recipes = Array.from(recipeMap.values());
      }
    } catch {}

    const items = [];
    const allItems = [];

    if (filter === "all" || filter === "posts") {
      posts.forEach((post) => {
        allItems.push({
          type: "post",
          id: post.id,
          data: post,
        });
      });
    }

    if (filter === "all" || filter === "recipes") {
      recipes.forEach((r) => {
        const recipeId = String(r._id || r.id || r);
        allItems.push({
          type: "recipe",
          id: recipeId,
          data: r,
        });
      });
    }

    if (allItems.length > 0) {
      items.push('<div class="gallery-grid">');
      allItems.forEach((item) => {
        if (item.type === "post") {
          const postImage =
            item.data.images && item.data.images.length > 0
              ? item.data.images[0]
              : null;
          const hasPostImage =
            postImage &&
            (postImage.startsWith("data:image/") ||
              postImage.startsWith("http"));

          items.push(`
                    <div class="gallery-card recipe-card" data-type="post" data-post-id="${
                      item.id
                    }">
                        <button class="gallery-remove-btn" data-type="post" data-id="${
                          item.id
                        }" data-action="unlike" title="Remove from liked">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="recipe-image">
                            ${
                              hasPostImage
                                ? `<img src="${postImage}" alt="${
                                    item.data.title || "Post"
                                  }" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                                : ""
                            }
                        </div>
                    </div>
                    `);
        } else {
          const recipeImage = item.data.image;
          const hasRecipeImage =
            recipeImage &&
            (recipeImage.startsWith("data:image/") ||
              recipeImage.startsWith("http"));

          items.push(`
                    <div class="gallery-card recipe-card" data-type="recipe" data-recipe-id="${
                      item.id
                    }">
                        <button class="gallery-remove-btn" data-type="recipe" data-id="${
                          item.id
                        }" data-action="unlike" title="Remove from liked">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="recipe-image">
                            ${
                              hasRecipeImage
                                ? `<img src="${recipeImage}" alt="${
                                    item.data.name || "Recipe"
                                  }" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                                : ""
                            }
                        </div>
                    </div>
                    `);
        }
      });
      items.push("</div>");
    }

    if (!items.length) {
      container.innerHTML = `
            <h2>Liked ${
              filter === "recipes"
                ? "Recipes"
                : filter === "posts"
                ? "Posts"
                : "Items"
            }</h2> <p>Your liked ${
        filter === "recipes"
          ? "recipes"
          : filter === "posts"
          ? "posts"
          : "items"
      } will appear here.</p>
            `;
    } else {
      container.innerHTML = items.join("");
    }
  }

  async updateKPIs() {
    const userId = getUserId();
    let todayBurn = 0;
    let dailyGoal = null;

    if (userId !== "guest") {
      try {
        const activitiesResponse = await ApiService.getActivities();
        if (activitiesResponse.activities) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          activitiesResponse.activities.forEach((activity) => {
            const activityDate = new Date(activity.date);
            activityDate.setHours(0, 0, 0, 0);

            if (
              activityDate.getTime() === today.getTime() &&
              activity.calories
            ) {
              todayBurn += activity.calories;
            }
          });
        }
      } catch (error) {
        console.error("Error loading activities for KPIs:", error);
      }

      try {
        const goalResponse = await ApiService.getGoal();
        if (goalResponse.goal && goalResponse.goal.target) {
          dailyGoal = goalResponse.goal.target;
        }
      } catch (error) {
        console.error("Error loading goal:", error);
      }
    }

    const kpiValues = document.querySelectorAll(".kpi-tile .kpi-value");
    if (kpiValues.length >= 3) {
      kpiValues[0].textContent = todayBurn;

      if (dailyGoal !== null) {
        kpiValues[1].textContent = dailyGoal;
        const delta = todayBurn - dailyGoal;
        kpiValues[2].textContent = delta >= 0 ? `+${delta}` : delta;

        if (delta > 0) {
          kpiValues[2].style.color = "#28a745";
        } else if (delta < 0) {
          kpiValues[2].style.color = "#dc3545";
        } else {
          kpiValues[2].style.color = "#007bff";
        }
      } else {
        const accentColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--theme-accent-color")
          .trim();
        kpiValues[1].textContent = "Set your goals first";
        kpiValues[1].style.fontSize = "14px";
        kpiValues[1].style.color = accentColor || "#666";
        kpiValues[2].textContent = "N/A";
        kpiValues[2].style.color = accentColor || "#666";
      }
    }
  }

  loadActivities() {
    const activityList = document.querySelector(".activity-list");
    if (!activityList) return;

    const userPosts = this.getUserPosts();

    activityList.innerHTML = "";

    userPosts.forEach((post) => {
      const activityItem = this.createPostElement(post);
      activityList.appendChild(activityItem);
    });
  }

  getUserPosts() {
    if (window.feedManager && window.feedManager.feedPosts) {
      return window.feedManager.feedPosts
        .filter((post) => post.isUserUpload)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    return this.mockData.userPosts || [];
  }

  async loadRecipeRecommendations() {
    const container = document.getElementById("recipe-recommendations-grid");
    if (!container) return;

    const defaultPeriod = this.getDefaultRecommendationPeriod();
    this.setupRecommendationsPeriodSelector();
    await this.fetchAndRenderRecommendations(defaultPeriod);
  }

  getDefaultRecommendationPeriod() {
    const savedSettings = localStorage.getItem("fitfuel-settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.recommendationPeriodDefault) {
          return parseInt(settings.recommendationPeriodDefault);
        }
      } catch (error) {
        console.error("Error parsing saved settings: ", error);
      }
    }
    return 7;
  }

  setupRecommendationsPeriodSelector() {
    const periodDropdown = document.getElementById("recommendations-period");
    if (!periodDropdown) return;

    const defaultPeriod = this.getDefaultRecommendationPeriod();
    periodDropdown.value = defaultPeriod.toString();

    periodDropdown.addEventListener("change", async (e) => {
      const days = parseInt(e.target.value);
      const container = document.getElementById("recipe-recommendations-grid");
      if (container) {
        if (days === 1) {
          container.classList.add("one-day-layout");
        } else {
          container.classList.remove("one-day-layout");
        }
      }
      await this.fetchAndRenderRecommendations(days);
    });

    const initialPeriod = parseInt(periodDropdown.value);
    const container = document.getElementById("recipe-recommendations-grid");
    if (container && initialPeriod === 1) {
      container.classList.add("one-day-layout");
    }
  }

  async fetchAndRenderRecommendations(periodDays = 7) {
    const userId = getUserId();
    let recipes = [];

    if (userId !== "guest") {
      try {
        const response = await ApiService.getRecipeRecommendations(periodDays);
        if (response.recipes && response.recipes.length > 0) {
          recipes = response.recipes.map((recipe) => ({
            id: recipe._id || recipe.id,
            name: recipe.name,
            description: recipe.description || "",
            calories: recipe.calories || 0,
            protein: recipe.protein || 0,
            carbs: recipe.carbs || 0,
            time: recipe.time || "N/A",
            category: recipe.category || "dinner",
            tags: recipe.tags || [],
            image: recipe.image || "",
            ingredients: recipe.ingredients || [],
            steps: recipe.steps || [],
            servings: recipe.servings || 4,
            createdAt: recipe.createdAt || new Date(),
          }));
        } else {
          const allRecipesResponse = await ApiService.getRecipes();
          if (
            allRecipesResponse.recipes &&
            allRecipesResponse.recipes.length > 0
          ) {
            recipes = allRecipesResponse.recipes.map((recipe) => ({
              id: recipe._id || recipe.id,
              name: recipe.name,
              description: recipe.description || "",
              calories: recipe.calories || 0,
              protein: recipe.protein || 0,
              carbs: recipe.carbs || 0,
              time: recipe.time || "N/A",
              category: recipe.category || "dinner",
              tags: recipe.tags || [],
              image: recipe.image || "",
              ingredients: recipe.ingredients || [],
              steps: recipe.steps || [],
              servings: recipe.servings || 4,
              createdAt: recipe.createdAt || new Date(),
            }));
          }
        }
      } catch (error) {
        if (error.message && !error.message.includes("Unauthorized")) {
          console.error("Error loading recipe recommendations: ", error);
        }
        try {
          const allRecipesResponse = await ApiService.getRecipes();
          if (
            allRecipesResponse.recipes &&
            allRecipesResponse.recipes.length > 0
          ) {
            recipes = allRecipesResponse.recipes.map((recipe) => ({
              id: recipe._id || recipe.id,
              name: recipe.name,
              description: recipe.description || "",
              calories: recipe.calories || 0,
              protein: recipe.protein || 0,
              carbs: recipe.carbs || 0,
              time: recipe.time || "N/A",
              category: recipe.category || "dinner",
              tags: recipe.tags || [],
              image: recipe.image || "",
              ingredients: recipe.ingredients || [],
              steps: recipe.steps || [],
              servings: recipe.servings || 4,
              createdAt: recipe.createdAt || new Date(),
            }));
          }
        } catch (fallbackError) {
          console.error("Error loading recipes as fallback: ", fallbackError);
        }
      }
    }

    const filteredRecipes = this.filterRecipesByPeriod(recipes, periodDays);
    this.renderRecipeRecommendations(filteredRecipes, periodDays);
  }

  filterRecipesByPeriod(recipes, days) {
    if (!days || days <= 0) return recipes;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return recipes.filter((recipe) => {
      let recipeDate;

      if (recipe.createdAt) {
        recipeDate = new Date(recipe.createdAt);
      } else if (recipe.date) {
        recipeDate = new Date(recipe.date);
      } else if (recipe.updatedAt) {
        recipeDate = new Date(recipe.updatedAt);
      } else {
        return true;
      }

      return recipeDate >= cutoffDate;
    });
  }

  renderRecipeRecommendations(recipes, periodDays = 7) {
    if (periodDays === 1) {
      this.renderOneDayRecommendations(recipes);
    } else {
      this.renderWeeklyRecommendations(recipes);
    }
  }

  renderOneDayRecommendations(recipes) {
    const container = document.getElementById("recipe-recommendations-grid");
    if (!container) return;

    const mealCategories = ["breakfast", "lunch", "dinner"];
    const mealTitles = {
      breakfast: "BREAKFAST",
      lunch: "LUNCH",
      dinner: "DINNER",
    };

    container.innerHTML = "";

    mealCategories.forEach((meal) => {
      const mealCategoryDiv = document.createElement("div");
      mealCategoryDiv.className = "meal-category";

      const mealTitle = document.createElement("h3");
      mealTitle.className = "meal-category-title";
      mealTitle.textContent = mealTitles[meal];
      mealCategoryDiv.appendChild(mealTitle);

      const mealGrid = document.createElement("div");
      mealGrid.className = "meal-recipes-grid";
      mealGrid.setAttribute("data-meal", meal);

      let mealRecipes = recipes.filter((recipe) => {
        const recipeCategory = (recipe.category || "").toLowerCase();
        return recipeCategory === meal.toLowerCase();
      });

      if (mealRecipes.length > 0) {
        mealRecipes = mealRecipes.slice(0, 1);
      }

      if (mealRecipes.length === 0) {
        mealGrid.innerHTML =
          '<p class="empty-meal-state">No recipes available for this meal category.</p>';
        mealCategoryDiv.appendChild(mealGrid);
        container.appendChild(mealCategoryDiv);
        return;
      }

      mealGrid.innerHTML = mealRecipes
        .map((recipe) => {
          const protein = recipe.protein || 0;
          const carbs = recipe.carbs || 0;
          const calories = recipe.calories || 0;
          const time = recipe.time || "N/A";
          const tags = recipe.tags || [];

          let imageSrc = recipe.image || "";
          if (
            imageSrc &&
            !imageSrc.startsWith("data:image/") &&
            !imageSrc.startsWith("http://") &&
            !imageSrc.startsWith("https://")
          ) {
            imageSrc = `data:image/jpeg;base64,${imageSrc}`;
          }
          const hasImage =
            imageSrc &&
            (imageSrc.startsWith("data:image/") || imageSrc.startsWith("http"));

          return `
                    <div class="recommended-recipe-card" data-recipe-id="${
                      recipe.id
                    }">
                        <div class="recipe-card-thumb">
                            ${
                              hasImage
                                ? `<img src="${imageSrc}" alt="${recipe.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                                : ""
                            }
                </div>
                        <div class="recipe-card-content">
                            <h3 class="recipe-card-title">${recipe.name}</h3>
                            <p class="recipe-card-description">${
                              recipe.description || ""
                            }</p>
                            <div class="recipe-card-metrics">
                                <div class="metric-item">
                                    <span class="metric-label">Calories</span>
                                    <span class="metric-value">${calories} kcal</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Protein</span>
                                    <span class="metric-value">${protein}g</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Carbs</span>
                                    <span class="metric-value">${carbs}g</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Time</span>
                                    <span class="metric-value">${time}</span>
                                </div>
                            </div>
            ${
              tags.length > 0
                ? `
            <div class="recipe-card-tags">
                                ${tags
                                  .slice(0, 3)
                                  .map(
                                    (tag) => `<span class="tag">${tag}</span>`
                                  )
                                  .join("")}
                            </div>
            `
                : ""
            }
            <button class="recipe-card-btn" data-recipe-id="${recipe.id}">
            View Recipe
                            </button>
                        </div>
                    </div>
            `;
        })
        .join("");

      mealCategoryDiv.appendChild(mealGrid);
      container.appendChild(mealCategoryDiv);

      const recipeCards = mealGrid.querySelectorAll(".recommended-recipe-card");
      recipeCards.forEach((card) => {
        card.addEventListener("click", (e) => {
          if (e.target.classList.contains("recipe-card-btn")) return;
          const recipeId = card.dataset.recipeId;
          if (recipeId && window.recipesManager) {
            window.recipesManager.viewRecipeById(recipeId);
          }
        });
      });

      const recipeButtons = mealGrid.querySelectorAll(".recipe-card-btn");
      recipeButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const recipeId = button.dataset.recipeId;
          if (recipeId && window.recipesManager) {
            window.recipesManager.viewRecipeById(recipeId);
          }
        });
      });
    });
  }

  renderWeeklyRecommendations(recipes) {
    const container = document.getElementById("recipe-recommendations-grid");
    if (!container) return;

    const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const mealCategories = ["breakfast", "lunch", "dinner"];
    const mealTitles = {
      breakfast: "BREAKFAST",
      lunch: "LUNCH",
      dinner: "DINNER",
    };

    container.innerHTML = "";

    const weeklyGrid = document.createElement("div");
    weeklyGrid.className = "weekly-recipes-grid";

    const headerRow = document.createElement("div");
    headerRow.className = "weekly-header-row";

    const emptyHeader = document.createElement("div");
    emptyHeader.className = "weekly-meal-label-header";
    headerRow.appendChild(emptyHeader);

    daysOfWeek.forEach((day) => {
      const dayHeader = document.createElement("div");
      dayHeader.className = "weekly-day-header";
      dayHeader.textContent = day;
      headerRow.appendChild(dayHeader);
    });
    weeklyGrid.appendChild(headerRow);

    mealCategories.forEach((meal) => {
      const mealRow = document.createElement("div");
      mealRow.className = "weekly-meal-row";

      const mealLabel = document.createElement("div");
      mealLabel.className = "weekly-meal-label";
      mealLabel.textContent = mealTitles[meal];
      mealRow.appendChild(mealLabel);

      const mealRecipes = recipes.filter((recipe) => {
        const recipeCategory = (recipe.category || "").toLowerCase();
        return recipeCategory === meal.toLowerCase();
      });

      const recipesForWeek = mealRecipes.slice(0, 7);

      daysOfWeek.forEach((day, dayIndex) => {
        const dayCell = document.createElement("div");
        dayCell.className = "weekly-day-cell";

        if (dayIndex < recipesForWeek.length) {
          const recipe = recipesForWeek[dayIndex];
          dayCell.innerHTML = this.createWeeklyRecipeCardHTML(recipe);
        } else {
          dayCell.innerHTML = '<p class="empty-day-state">No recipe</p>';
        }

        mealRow.appendChild(dayCell);
      });

      weeklyGrid.appendChild(mealRow);
    });

    container.appendChild(weeklyGrid);
    this.attachRecipeCardListeners(container);
  }

  renderTwoWeeksRecommendations(recipes) {
    const container = document.getElementById("recipe-recommendations-grid");
    if (!container) return;

    const daysOfWeek = [
      "MON",
      "TUE",
      "WED",
      "THU",
      "FRI",
      "SAT",
      "SUN",
      "MON",
      "TUE",
      "WED",
      "THU",
      "FRI",
      "SAT",
      "SUN",
    ];
    const weekLabels = ["WEEK 1", "WEEK 2"];
    const mealCategories = ["breakfast", "lunch", "dinner"];
    const mealTitles = {
      breakfast: "BREAKFAST",
      lunch: "LUNCH",
      dinner: "DINNER",
    };

    container.innerHTML = "";

    const weeklyGrid = document.createElement("div");
    weeklyGrid.className = "weekly-recipes-grid two-weeks-grid";

    const headerRow = document.createElement("div");
    headerRow.className = "weekly-header-row two-weeks-header-row";

    const emptyHeader = document.createElement("div");
    emptyHeader.className = "weekly-meal-label-header";
    headerRow.appendChild(emptyHeader);

    daysOfWeek.forEach((day, index) => {
      const dayHeader = document.createElement("div");
      dayHeader.className = "weekly-day-header";
      dayHeader.textContent = day;
      if (index === 0 || index === 7) {
        dayHeader.classList.add("week-divider");
      }
      headerRow.appendChild(dayHeader);
    });
    weeklyGrid.appendChild(headerRow);

    mealCategories.forEach((meal) => {
      const mealRow = document.createElement("div");
      mealRow.className = "weekly-meal-row two-weeks-meal-row";

      const mealLabel = document.createElement("div");
      mealLabel.className = "weekly-meal-label";
      mealLabel.textContent = mealTitles[meal];
      mealRow.appendChild(mealLabel);

      const mealRecipes = recipes.filter((recipe) => {
        const recipeCategory = (recipe.category || "").toLowerCase();
        return recipeCategory === meal.toLowerCase();
      });

      const recipesForTwoWeeks = mealRecipes.slice(0, 28);

      daysOfWeek.forEach((day, dayIndex) => {
        const dayCell = document.createElement("div");
        dayCell.className = "weekly-day-cell two-weeks-day-cell";
        if (dayIndex === 0 || dayIndex === 7) {
          dayCell.classList.add("week-divider");
        }

        const dayRecipes = [];
        const recipeIndex1 = dayIndex * 2;
        const recipeIndex2 = dayIndex * 2 + 1;

        if (recipeIndex1 < recipesForTwoWeeks.length) {
          dayRecipes.push(recipesForTwoWeeks[recipeIndex1]);
        }
        if (recipeIndex2 < recipesForTwoWeeks.length) {
          dayRecipes.push(recipesForTwoWeeks[recipeIndex2]);
        }

        if (dayRecipes.length > 0) {
          const recipesContainer = document.createElement("div");
          recipesContainer.className = "two-recipes-container";
          dayRecipes.forEach((recipe) => {
            recipesContainer.innerHTML +=
              this.createWeeklyRecipeCardHTML(recipe);
          });
          dayCell.appendChild(recipesContainer);
        } else {
          dayCell.innerHTML = '<p class="empty-day-state">No recipe</p>';
        }

        mealRow.appendChild(dayCell);
      });

      weeklyGrid.appendChild(mealRow);
    });

    container.appendChild(weeklyGrid);
    this.attachRecipeCardListeners(container);
  }

  createRecipeCardHTML(recipe) {
    const protein = recipe.protein || 0;
    const carbs = recipe.carbs || 0;
    const calories = recipe.calories || 0;
    const time = recipe.time || "N/A";
    const tags = recipe.tags || [];

    let imageSrc = recipe.image || "";
    if (
      imageSrc &&
      !imageSrc.startsWith("data:image/") &&
      !imageSrc.startsWith("http://") &&
      !imageSrc.startsWith("https://")
    ) {
      imageSrc = `data:image/jpeg;base64,${imageSrc}`;
    }
    const hasImage =
      imageSrc &&
      (imageSrc.startsWith("data:image/") || imageSrc.startsWith("http"));

    return `
            <div class="recommended-recipe-card" data-recipe-id="${recipe.id}">
                <div class="recipe-card-thumb">
                    ${
                      hasImage
                        ? `<img src="${imageSrc}" alt="${recipe.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                        : ""
                    }
                </div>
                <div class="recipe-card-content">
                    <h3 class="recipe-card-title">${recipe.name}</h3>
                    <p class="recipe-card-description">${
                      recipe.description || ""
                    }</p>
                    <div class="recipe-card-metrics">
                        <div class="metric-item">
                            <span class="metric-label">Calories</span>
                            <span class="metric-value">${calories} kcal</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Protein</span>
                            <span class="metric-value">${protein}g</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Carbs</span>
                            <span class="metric-value">${carbs}g</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Time</span>
                            <span class="metric-value">${time}</span>
                        </div>
                    </div>
            ${
              tags.length > 0
                ? `
            <div class="recipe-card-tags">
                        ${tags
                          .slice(0, 3)
                          .map((tag) => `<span class="tag">${tag}</span>`)
                          .join("")}
                    </div>
            `
                : ""
            }
            <button class="recipe-card-btn" data-recipe-id="${recipe.id}">
            View Recipe
                    </button>
                </div>
            </div>
        `;
  }

  createWeeklyRecipeCardHTML(recipe) {
    const protein = recipe.protein || 0;
    const carbs = recipe.carbs || 0;
    const calories = recipe.calories || 0;
    const time = recipe.time || "N/A";

    let imageSrc = recipe.image || "";
    if (
      imageSrc &&
      !imageSrc.startsWith("data:image/") &&
      !imageSrc.startsWith("http://") &&
      !imageSrc.startsWith("https://")
    ) {
      imageSrc = `data:image/jpeg;base64,${imageSrc}`;
    }
    const hasImage =
      imageSrc &&
      (imageSrc.startsWith("data:image/") || imageSrc.startsWith("http"));

    return `
            <div class="recommended-recipe-card weekly-recipe-card" data-recipe-id="${
              recipe.id
            }">
                ${
                  hasImage
                    ? `<div class="recipe-card-thumb" style="width: 100%; height: 120px; overflow: hidden; border-radius: 8px 8px 0 0;">
                        <img src="${imageSrc}" alt="${recipe.name}" style="width: 100%; height: 100%; object-fit: cover;">
                       </div>`
                    : ""
                }
                <div class="recipe-card-header-bar">
                    <i class="fas fa-utensils"></i>
                </div>
                <div class="recipe-card-content">
                    <h3 class="recipe-card-title">${recipe.name}</h3>
                    <p class="recipe-card-description">${
                      recipe.description || ""
                    }</p>
                    <div class="recipe-card-metrics-table">
                        <div class="metrics-left">
                            <div class="metric-row">
                                <span class="metric-label">CALORIES:</span>
                                <span class="metric-value">${calories} kcal</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">CARBS:</span>
                                <span class="metric-value">${carbs}g</span>
                            </div>
                        </div>
                        <div class="metrics-right">
                            <div class="metric-row">
                                <span class="metric-label">PROTEIN:</span>
                                <span class="metric-value">${protein}g</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">TIME:</span>
                                <span class="metric-value">${time}</span>
                            </div>
                        </div>
                    </div>
                    <button class="recipe-card-btn" data-recipe-id="${
                      recipe.id
                    }">
                        VIEW RECIPE
                    </button>
                </div>
            </div>
        `;
  }

  attachRecipeCardListeners(container) {
    const recipeCards = container.querySelectorAll(".recommended-recipe-card");
    recipeCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.classList.contains("recipe-card-btn")) return;
        const recipeId = card.dataset.recipeId;
        if (recipeId && window.recipesManager) {
          window.recipesManager.viewRecipeById(recipeId);
        }
      });
    });

    const recipeButtons = container.querySelectorAll(".recipe-card-btn");
    recipeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const recipeId = button.dataset.recipeId;
        if (recipeId && window.recipesManager) {
          window.recipesManager.viewRecipeById(recipeId);
        }
      });
    });
  }

  renderCategoryRecommendations(recipes, periodDays) {
    const mealCategories = ["breakfast", "lunch", "dinner"];

    mealCategories.forEach((meal) => {
      const mealGrid = document.querySelector(
        `.meal-recipes-grid[data-meal="${meal}"]`
      );
      if (!mealGrid) return;

      let mealRecipes = recipes.filter((recipe) => {
        const recipeCategory = (recipe.category || "").toLowerCase();
        return recipeCategory === meal.toLowerCase();
      });

      if (periodDays === 1 && mealRecipes.length > 0) {
        mealRecipes = mealRecipes.slice(0, 1);
      }

      if (mealRecipes.length === 0) {
        mealGrid.innerHTML =
          '<p class="empty-meal-state">No recipes available for this meal category.</p>';
        return;
      }

      mealGrid.innerHTML = mealRecipes
        .map((recipe) => {
          const protein = recipe.protein || 0;
          const carbs = recipe.carbs || 0;
          const calories = recipe.calories || 0;
          const time = recipe.time || "N/A";
          const tags = recipe.tags || [];

          let imageSrc = recipe.image || "";
          if (
            imageSrc &&
            !imageSrc.startsWith("data:image/") &&
            !imageSrc.startsWith("http://") &&
            !imageSrc.startsWith("https://")
          ) {
            imageSrc = `data:image/jpeg;base64,${imageSrc}`;
          }
          const hasImage =
            imageSrc &&
            (imageSrc.startsWith("data:image/") || imageSrc.startsWith("http"));

          return `
                <div class="recommended-recipe-card" data-recipe-id="${
                  recipe.id
                }">
                    <div class="recipe-card-thumb">
                        ${
                          hasImage
                            ? `<img src="${imageSrc}" alt="${recipe.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                            : ""
                        }
                    </div>
                    <div class="recipe-card-content">
                        <h3 class="recipe-card-title">${recipe.name}</h3>
                        <p class="recipe-card-description">${
                          recipe.description || ""
                        }</p>
                        <div class="recipe-card-metrics">
                            <div class="metric-item">
                                <span class="metric-label">Calories</span>
                                <span class="metric-value">${calories} kcal</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Protein</span>
                                <span class="metric-value">${protein}g</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Carbs</span>
                                <span class="metric-value">${carbs}g</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Time</span>
                                <span class="metric-value">${time}</span>
                            </div>
                        </div>
            ${
              tags.length > 0
                ? `
            <div class="recipe-card-tags">
                            ${tags
                              .slice(0, 3)
                              .map((tag) => `<span class="tag">${tag}</span>`)
                              .join("")}
                        </div>
            `
                : ""
            }
            <button class="recipe-card-btn" data-recipe-id="${recipe.id}">
            View Recipe
                        </button>
                    </div>
                </div>
            `;
        })
        .join("");

      const recipeCards = mealGrid.querySelectorAll(".recommended-recipe-card");
      recipeCards.forEach((card) => {
        card.addEventListener("click", (e) => {
          if (e.target.classList.contains("recipe-card-btn")) return;
          const recipeId = card.dataset.recipeId;
          if (recipeId && window.recipesManager) {
            window.recipesManager.viewRecipeById(recipeId);
          }
        });
      });

      const recipeButtons = mealGrid.querySelectorAll(".recipe-card-btn");
      recipeButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const recipeId = button.dataset.recipeId;
          if (recipeId && window.recipesManager) {
            window.recipesManager.viewRecipeById(recipeId);
          }
        });
      });
    });
  }

  createPostElement(post) {
    const activityItem = document.createElement("div");
    activityItem.className = "activity-item";

    const iconClass = this.getIconClass(post);

    let metricsHtml = "";
    if (post.type === "recipe") {
      metricsHtml = `
            <span>${post.metrics.calories || "N/A"}< /span> <span>${
        post.metrics.carbs || "N/A"
      }< /span> <span>${post.metrics.protein || "N/A"}< /span>
            `;
    } else {
      const metrics = post.metrics;
      metricsHtml = `
            <span>${
              metrics.distance || metrics.duration || "N/A"
            }< /span> <span>${
        metrics.elevation || metrics.intensity || "N/A"
      }< /span> <span>${metrics.time || metrics.calories || "N/A"}< /span>
            `;
    }

    const timestamp = this.formatTimestamp(post.timestamp);

    activityItem.innerHTML = `
        <div class="activity-header"> <div class="activity-icon"> <i class="${iconClass}"> </i> </div> <div> <h4 class="activity-title">${
      post.title
    }< /h4> <p class="activity-meta">${
      post.user.name
    } • ${timestamp}< /p> </div> </div> <div class="activity-stats">
        ${metricsHtml}
        < /div>
        ${
          post.description
            ? `<p class="activity-message">${post.description}< /p>`
            : ""
        }
        <div class="activity-actions"> <button class="action-btn"> <i class="fas fa-share"> </i> </button> <button class="action-btn"> <i class="fas fa-comment"> </i> </button> <button class="action-btn"> <i class="fas fa-heart"> </i> </button> </div>
        `;

    return activityItem;
  }

  getIconClass(post) {
    if (post.type === "recipe") {
      return "fas fa-utensils";
    }

    const title = post.title.toLowerCase();
    if (title.includes("run") || title.includes("running")) {
      return "fas fa-running";
    } else if (
      title.includes("bike") ||
      title.includes("ride") ||
      title.includes("cycling")
    ) {
      return "fas fa-bicycle";
    } else if (title.includes("swim") || title.includes("swimming")) {
      return "fas fa-swimmer";
    } else if (title.includes("yoga") || title.includes("stretch")) {
      return "fas fa-leaf";
    } else if (
      title.includes("strength") ||
      title.includes("weight") ||
      title.includes("gym")
    ) {
      return "fas fa-dumbbell";
    } else if (title.includes("hiit") || title.includes("cardio")) {
      return "fas fa-fire";
    } else {
      return "fas fa-dumbbell";
    }
  }

  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      return (
        date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }) +
        " at " +
        date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    } catch (error) {
      return timestamp;
    }
  }

  updateWeeklyStats() {
    const statsElements = document.querySelectorAll(".activities-stats span");
    if (statsElements.length >= 3) {
      statsElements[0].textContent = this.mockData.weeklyStats.distance;
      statsElements[1].textContent = this.mockData.weeklyStats.duration;
      statsElements[2].textContent = this.mockData.weeklyStats.elevation;
    }
  }

  updateTotalCounters() {
    const userPosts = window.feedManager
      ? window.feedManager.feedPosts.filter((post) => post.isUserUpload)
      : [];

    let activityCount = 0;
    let recipeCount = 0;

    userPosts.forEach((post) => {
      if (post.type === "recipe") {
        recipeCount++;
      } else {
        activityCount++;
      }
    });

    const totalActivitiesElement = document.querySelector(".total-activities");
    const totalRecipesElement = document.querySelector(".total-recipes");

    if (totalActivitiesElement) {
      totalActivitiesElement.textContent = activityCount;
    }

    if (totalRecipesElement) {
      totalRecipesElement.textContent = recipeCount;
    }
  }

  updateCalendar() {
    const today = new Date();
    const currentDay = today.getDate();

    document.querySelectorAll(".calendar-count").forEach((element) => {
      element.classList.remove("calendar-count");
      element.textContent = "";
    });

    const calendarDays = document.querySelectorAll(".calendar-day");

    const targetIndex = 24;

    if (calendarDays[targetIndex]) {
      calendarDays[targetIndex].classList.add("calendar-count");
      calendarDays[targetIndex].textContent = currentDay;
    }
  }

  addActivity(calories) {
    this.loadProfileData();
  }

  showProfile() {
    this.loadProfileData();
  }
}
