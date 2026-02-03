class FeedManager {
  constructor() {
    this.feedPosts = [];
    this.currentFilter = null;
    this.userPreferences = null;
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const postDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const diffTime = today - postDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let dateStr;
      if (diffDays === 0) {
        dateStr = "Today";
      } else if (diffDays === 1) {
        dateStr = "Yesterday";
      } else if (diffDays < 7) {
        dateStr = date.toLocaleDateString("en-US", { weekday: "long" });
      } else {
        dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }

      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return `${dateStr} at ${timeStr}`;
    } catch (error) {
      return timestamp;
    }
  }

  init() {
    this.loadFeedData();
    this.setupEventListeners();
  }

  async loadFeedData() {
    const userId = getUserId();

    await this.loadUserPreferences();

    if (userId !== "guest") {
      try {
        const response = await ApiService.getFeed();
        if (response.posts && response.posts.length > 0) {
          const userPosts = await this.getUserPosts();

          this.feedPosts = [...userPosts, ...response.posts];
          this.renderFeed();
          return;
        }
      } catch (error) {
        console.error("Error loading personalized feed: ", error);
      }
    }

    this.feedPosts = this.getMockFeedData();
    this.renderFeed();
  }

  async loadUserPreferences() {
    const userId = getUserId();

    if (userId !== "guest") {
      try {
        const response = await ApiService.getPreferences();
        if (response.preferences) {
          this.userPreferences = response.preferences;
        }
      } catch (error) {
        console.error("Error loading preferences: ", error);
        this.userPreferences = null;
      }
    } else {
      this.userPreferences = null;
    }
  }

  async getUserPosts() {
    const userId = getUserId();
    const userPosts = [];

    if (userId !== "guest") {
      try {
        const activitiesResponse = await ApiService.getActivities();
        if (activitiesResponse.activities) {
          activitiesResponse.activities.forEach((activity) => {
            userPosts.push({
              id: `activity-${activity._id}`,
              _id: activity._id,
              user: { name: "You", avatar: "Y" },
              timestamp:
                activity.date || activity.createdAt || new Date().toISOString(),
              type: "workout",
              title: activity.title,
              description: activity.description || "",
              metrics: {
                duration: `${activity.duration} min`,
                intensity: activity.intensity || "Moderate",
                calories: activity.calories
                  ? `${activity.calories} kcal`
                  : undefined,
                distance: activity.metrics?.distance
                  ? `${activity.metrics.distance} km`
                  : undefined,
              },
              images: activity.images || [],
              isUserUpload: true,
            });
          });
        }
      } catch (error) {
        console.error("Error loading user activities: ", error);
      }

      try {
        const recipesResponse = await ApiService.getRecipes();
        if (recipesResponse.recipes) {
          recipesResponse.recipes.forEach((recipe) => {
            userPosts.push({
              id: `recipe-${recipe._id}`,
              _id: recipe._id,
              user: { name: "You", avatar: "Y" },
              timestamp: recipe.createdAt || new Date().toISOString(),
              type: "recipe",
              title: recipe.name,
              description: recipe.description || "",
              metrics: {
                calories: recipe.calories
                  ? `${recipe.calories} kcal`
                  : undefined,
                time: recipe.time || "N/A",
                protein: recipe.protein ? `${recipe.protein}g` : undefined,
                carbs: recipe.carbs ? `${recipe.carbs}g` : undefined,
              },
              images: recipe.image ? [recipe.image] : [],
              isUserUpload: true,
              recipeData: {
                category: recipe.category,
                tags: recipe.tags || [],
                ingredients: recipe.ingredients || [],
                steps: recipe.steps || [],
                servings: recipe.servings || 4,
              },
            });
          });
        }
      } catch (error) {
        console.error("Error loading user recipes: ", error);
      }
    }

    return userPosts.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  getMockFeedData() {
    return [
      {
        id: 1,
        user: { name: "Sarah Johnson", avatar: "SJ" },
        timestamp: "December 15, 2024 at 2: 30 PM",
        type: "workout",
        title: "Morning Run",
        description: "Beautiful sunrise run through the park. Felt amazing!",
        metrics: {
          distance: "5.2 km",
          elevation: "120m",
          time: "28: 45",
        },
        images: ["workout1.jpg", "workout2.jpg"],
        isUserUpload: false,
      },
      {
        id: 2,
        user: { name: "Mike Chen", avatar: "MC" },
        timestamp: "December 15, 2024 at 1: 15 PM",
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
      },
      {
        id: 3,
        user: { name: "Emma Wilson", avatar: "EW" },
        timestamp: "December 15, 2024 at 11: 45 AM",
        type: "workout",
        title: "HIIT Session",
        description: "Intense 30-minute HIIT workout. Sweating buckets!",
        metrics: {
          calories: "450 kcal",
          intensity: "High",
          time: "30 min",
        },
        images: ["hiit1.jpg", "hiit2.jpg"],
        isUserUpload: false,
      },
      {
        id: 4,
        user: { name: "Alex Rodriguez", avatar: "AR" },
        timestamp: "December 15, 2024 at 9: 20 AM",
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
      },
    ];
  }

  setupEventListeners() {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".sidebar-icon")) {
        const icon = e.target.closest(".sidebar-icon");
        const filter = icon.dataset.filter;
        this.setFilter(filter);
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".post-action")) {
        const action = e.target.closest(".post-action");
        const actionText = action.querySelector("span").textContent;
        if (actionText === "Save" || actionText === "Saved") {
          this.toggleSave(action);
        } else if (actionText === "Like" || actionText === "Liked") {
          this.toggleLike(action);
        } else if (actionText === "Comment") {
          this.handleComment(action);
        }
      }
    });

    document.addEventListener("postSaved", (e) =>
      this.updatePostState(e.detail.postId, "saved", true)
    );
    document.addEventListener("postUnsaved", (e) =>
      this.updatePostState(e.detail.postId, "saved", false)
    );
    document.addEventListener("postLiked", (e) =>
      this.updatePostState(e.detail.postId, "liked", true)
    );
    document.addEventListener("postUnliked", (e) =>
      this.updatePostState(e.detail.postId, "liked", false)
    );

    document.addEventListener("recipeSaved", (e) =>
      this.updateRecipePostState(e.detail.recipeId, "saved", true)
    );
    document.addEventListener("recipeUnsaved", (e) =>
      this.updateRecipePostState(e.detail.recipeId, "saved", false)
    );
    document.addEventListener("recipeLiked", (e) =>
      this.updateRecipePostState(e.detail.recipeId, "liked", true)
    );
    document.addEventListener("recipeUnliked", (e) =>
      this.updateRecipePostState(e.detail.recipeId, "liked", false)
    );

    document.addEventListener("click", (e) => {
      const postElement = e.target.closest(".feed-post.recipe-post");
      if (
        postElement &&
        !e.target.closest(".post-action") &&
        !e.target.closest(".post-menu") &&
        !e.target.closest(".post-edit-form") &&
        !e.target.closest(".post-menu-dropdown")
      ) {
        const postId = postElement.dataset.postId;
        const post = this.feedPosts.find((p) => p.id === Number(postId));
        if (post && post.type === "recipe") {
          e.preventDefault();
          e.stopPropagation();
          this.viewRecipeFromPost(post);
        }
      }
    });

    document.addEventListener("click", (e) => {
      const menu = e.target.closest(".post-menu");
      const menuIcon = e.target.closest(".post-menu i");
      const menuItem = e.target.closest(".menu-item");

      if (menuIcon) {
        e.stopPropagation();

        const dropdown = menu.querySelector(".post-menu-dropdown");
        if (dropdown) {
          document.querySelectorAll(".post-menu-dropdown").forEach((d) => {
            if (d !== dropdown) d.classList.remove("show");
          });
          dropdown.classList.toggle("show");
        }
      } else if (menuItem) {
        e.stopPropagation();

        const action = menuItem.dataset.action;
        const postId = menuItem.dataset.postId;

        if (action === "edit") {
          this.editPost(postId);
        } else if (action === "delete") {
          this.deletePost(postId);
        }

        const dropdown = menuItem.closest(".post-menu-dropdown");
        if (dropdown) dropdown.classList.remove("show");
      } else if (!menu) {
        document.querySelectorAll(".post-menu-dropdown").forEach((d) => {
          d.classList.remove("show");
        });
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".edit-save-btn")) {
        const btn = e.target.closest(".edit-save-btn");
        const postId = btn.dataset.postId;
        this.savePost(postId);
      } else if (e.target.closest(".edit-cancel-btn")) {
        const btn = e.target.closest(".edit-cancel-btn");
        const postId = btn.dataset.postId;
        this.cancelEdit(postId);
      } else if (e.target.closest(".remove-image-btn")) {
        const btn = e.target.closest(".remove-image-btn");
        const postId = btn.closest(".post-edit-form").dataset.postId;
        const imageIndex = Number(btn.dataset.imageIndex);
        this.removeImage(postId, imageIndex);
      } else if (e.target.closest(".add-image-btn")) {
        const btn = e.target.closest(".add-image-btn");
        const postId = btn.closest(".post-edit-form").dataset.postId;
        const fileInput = btn.parentElement.querySelector(".add-image-input");
        fileInput.click();
      }
    });

    document.addEventListener("change", (e) => {
      if (e.target.classList.contains("add-image-input")) {
        const fileInput = e.target;
        const postId = fileInput.closest(".post-edit-form").dataset.postId;
        this.addImages(postId, fileInput.files);
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".add-ingredient-btn")) {
        const btn = e.target.closest(".add-ingredient-btn");
        const postId = btn.dataset.postId;
        this.addIngredientField(postId);
      } else if (e.target.closest(".remove-ingredient")) {
        const btn = e.target.closest(".remove-ingredient");
        const postId =
          btn.closest(".post-edit-form")?.dataset.postId ||
          btn.closest(".edit-ingredients-container")?.dataset.postId;
        this.removeIngredientField(postId, btn);
      } else if (e.target.closest(".add-direction-btn")) {
        const btn = e.target.closest(".add-direction-btn");
        const postId = btn.dataset.postId;
        this.addDirectionField(postId);
      } else if (e.target.closest(".remove-direction")) {
        const btn = e.target.closest(".remove-direction");
        const postId =
          btn.closest(".post-edit-form")?.dataset.postId ||
          btn.closest(".edit-directions-container")?.dataset.postId;
        this.removeDirectionField(postId, btn);
      }
    });
  }

  setFilter(filter) {
    if (this.currentFilter === filter) {
      this.currentFilter = null;
      document.querySelectorAll(".sidebar-icon").forEach((icon) => {
        icon.classList.remove("active");
      });
    } else {
      this.currentFilter = filter;
      document.querySelectorAll(".sidebar-icon").forEach((icon) => {
        icon.classList.remove("active");
      });
      document
        .querySelector(`[data-filter="${filter}"]`)
        .classList.add("active");
    }

    this.renderFeed();
  }

  renderFeed() {
    const feedContainer = document.getElementById("feed-posts");
    if (!feedContainer) return;

    let filteredPosts = this.feedPosts;

    if (this.currentFilter === "workouts") {
      filteredPosts = this.feedPosts.filter((post) => post.type === "workout");
    } else if (this.currentFilter === "recipes") {
      filteredPosts = this.feedPosts.filter((post) => post.type === "recipe");
    } else if (this.currentFilter === "my-uploads") {
      filteredPosts = this.feedPosts.filter(
        (post) => post.isUserUpload === true
      );
    }

    feedContainer.innerHTML = filteredPosts
      .map((post) => this.createPostHTML(post))
      .join("");

    this.applyDynamicGridLayout();
  }

  applyDynamicGridLayout() {
    requestAnimationFrame(() => {
      document.querySelectorAll(".post-images").forEach((container) => {
        const imageCount = parseInt(
          container.getAttribute("data-image-count") || "0"
        );
        if (imageCount === 0) return;

        container.querySelectorAll(".post-image").forEach((img) => {
          img.style.gridColumn = "";
        });

        let columns;
        if (imageCount === 1) {
          columns = 1;
        } else if (imageCount === 2) {
          columns = 2;
        } else if (imageCount <= 4) {
          columns = 2;
        } else if (imageCount <= 6) {
          columns = 3;
        } else if (imageCount <= 9) {
          columns = 3;
        } else if (imageCount <= 12) {
          columns = 4;
        } else {
          columns = "auto-fit";
        }

        if (columns === "auto-fit") {
          container.style.gridTemplateColumns =
            "repeat(auto-fit, minmax(150px, 1fr))";
        } else {
          container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        }

        if (imageCount > columns && columns !== "auto-fit") {
          const remainingImages = imageCount % columns;

          if (remainingImages === 1) {
            const lastImage = container.querySelector(
              `.post-image: nth-child(${imageCount})`
            );
            if (lastImage) {
              lastImage.style.gridColumn = `1 / span 2`;
            }
          } else if (remainingImages === 2 && columns === 3) {
            const secondLast = container.querySelector(
              `.post-image: nth-child(${imageCount - 1})`
            );
            const lastImage = container.querySelector(
              `.post-image: nth-child(${imageCount})`
            );
            if (secondLast) secondLast.style.gridColumn = "1 / span 1";
            if (lastImage) lastImage.style.gridColumn = "2 / span 2";
          } else if (remainingImages === 2 && columns === 4) {
            const secondLast = container.querySelector(
              `.post-image: nth-child(${imageCount - 1})`
            );
            const lastImage = container.querySelector(
              `.post-image: nth-child(${imageCount})`
            );
            if (secondLast) secondLast.style.gridColumn = "1 / span 2";
            if (lastImage) lastImage.style.gridColumn = "3 / span 2";
          }
        }
      });
    });
  }

  async toggleSave(action) {
    const isSaving = !action.classList.contains("saved");
    action.classList.toggle("saved");
    action.querySelector("span").textContent = isSaving ? "Saved" : "Save";

    try {
      const container = action.closest(".feed-post");
      const postId = container && container.getAttribute("data-post-id");
      if (!postId) return;

      const userId = getUserId();
      const post = this.feedPosts.find((p) => String(p.id) === String(postId));
      const isRecipePost = post && post.type === "recipe";

      if (userId !== "guest") {
        try {
          if (isSaving) {
            const response = await ApiService.savePost(postId);

            if (response.preferences) {
              this.userPreferences = response.preferences;
            }

            if (isRecipePost) {
              try {
                const recipe = this.convertPostToRecipe(post);
                const response = await ApiService.saveRecipe(
                  String(postId),
                  recipe
                );
                if (
                  response.savedRecipeId &&
                  response.savedRecipeId !== String(postId)
                ) {
                }
                document.dispatchEvent(
                  new CustomEvent("recipeSaved", {
                    detail: {
                      recipeId: response.savedRecipeId || String(postId),
                      recipe: recipe,
                    },
                  })
                );
              } catch (recipeError) {
                console.error("Error saving recipe from post: ", recipeError);
              }
            }
          } else {
            const response = await ApiService.unsavePost(postId);

            if (response.preferences) {
              this.userPreferences = response.preferences;
            }

            if (isRecipePost) {
              try {
                await ApiService.unsaveRecipe(String(postId));
                document.dispatchEvent(
                  new CustomEvent("recipeUnsaved", {
                    detail: {
                      recipeId: String(postId),
                      recipe: this.convertPostToRecipe(post),
                    },
                  })
                );
              } catch (recipeError) {
                console.error("Error unsaving recipe from post: ", recipeError);
              }
            }
          }

          document.dispatchEvent(
            new CustomEvent(isSaving ? "postSaved" : "postUnsaved", {
              detail: { postId: postId, post: post },
            })
          );
        } catch (error) {
          console.error("Error saving post: ", error);

          action.classList.toggle("saved");
          action.querySelector("span").textContent = isSaving
            ? "Save"
            : "Saved";
        }
      } else {
        const storageKey = getStorageKey(StorageKeys.SAVED_POSTS);
        const saved = new Set(
          JSON.parse(localStorage.getItem(storageKey) || "[]")
        );
        if (isSaving) {
          saved.add(postId);
        } else {
          saved.delete(postId);
        }
        localStorage.setItem(storageKey, JSON.stringify(Array.from(saved)));

        document.dispatchEvent(
          new CustomEvent(isSaving ? "postSaved" : "postUnsaved", {
            detail: { postId: postId, post: post },
          })
        );
      }
    } catch (e) {
      console.error("Error in toggleSave: ", e);
    }
  }

  async toggleLike(action) {
    const isLiking = !action.classList.contains("liked");
    action.classList.toggle("liked");
    action.querySelector("span").textContent = isLiking ? "Liked" : "Like";

    try {
      const container = action.closest(".feed-post");
      const postId = container && container.getAttribute("data-post-id");
      if (!postId) return;

      const userId = getUserId();
      const post = this.feedPosts.find((p) => String(p.id) === String(postId));
      const isRecipePost = post && post.type === "recipe";

      if (userId !== "guest") {
        try {
          if (isLiking) {
            const response = await ApiService.likePost(postId);

            if (response.preferences) {
              this.userPreferences = response.preferences;
            }

            if (isRecipePost) {
              try {
                const recipe = this.convertPostToRecipe(post);
                const response = await ApiService.likeRecipe(
                  String(postId),
                  recipe
                );
                if (
                  response.likedRecipeId &&
                  response.likedRecipeId !== String(postId)
                ) {
                }
                document.dispatchEvent(
                  new CustomEvent("recipeLiked", {
                    detail: {
                      recipeId: response.likedRecipeId || String(postId),
                      recipe: recipe,
                    },
                  })
                );
              } catch (recipeError) {
                console.error("Error liking recipe from post: ", recipeError);
              }
            }
          } else {
            const response = await ApiService.unlikePost(postId);

            if (response.preferences) {
              this.userPreferences = response.preferences;
            }

            if (isRecipePost) {
              try {
                const recipe = this.convertPostToRecipe(post);
                await ApiService.unlikeRecipe(String(postId));
                document.dispatchEvent(
                  new CustomEvent("recipeUnliked", {
                    detail: { recipeId: String(postId), recipe: recipe },
                  })
                );
              } catch (recipeError) {
                console.error("Error unliking recipe from post: ", recipeError);
              }
            }
          }

          document.dispatchEvent(
            new CustomEvent(isLiking ? "postLiked" : "postUnliked", {
              detail: { postId: postId, post: post },
            })
          );
        } catch (error) {
          console.error("Error liking post: ", error);

          action.classList.toggle("liked");
          action.querySelector("span").textContent = isLiking
            ? "Like"
            : "Liked";
        }
      } else {
        const storageKey = getStorageKey(StorageKeys.LIKED_POSTS);
        const liked = new Set(
          JSON.parse(localStorage.getItem(storageKey) || "[]")
        );
        if (isLiking) {
          liked.add(postId);
        } else {
          liked.delete(postId);
        }
        localStorage.setItem(storageKey, JSON.stringify(Array.from(liked)));

        document.dispatchEvent(
          new CustomEvent(isLiking ? "postLiked" : "postUnliked", {
            detail: { postId: postId, post: post },
          })
        );
      }
    } catch (e) {
      console.error("Error in toggleLike: ", e);
    }
  }

  handleComment(action) {
    alert("Comment functionality coming soon!");
  }

  editPost(postId) {
    const post = this.feedPosts.find((p) => String(p.id) === String(postId));
    if (!post) {
      console.error("Post not found for ID:", postId);
      return;
    }

    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) {
      console.error("Post element not found for ID:", postId);
      return;
    }

    const editForm = postElement.querySelector(".post-edit-form");
    const postTypeSection = postElement.querySelector(".post-type");

    if (!editForm || !postTypeSection) return;

    postTypeSection.style.display = "none";
    editForm.classList.add("show");

    const metricsSection = postElement.querySelector(".post-metrics");
    const imagesSection = postElement.querySelector(".post-images");
    if (metricsSection) metricsSection.style.display = "none";
    if (imagesSection) imagesSection.style.display = "none";

    const imageItems = editForm.querySelectorAll(".edit-image-item");
    imageItems.forEach((item, idx) => {
      if (post.images && post.images[idx] instanceof File) {
        item._fileObject = post.images[idx];
      }
    });

    const titleInput = editForm.querySelector(".edit-title-input");
    if (titleInput) {
      titleInput.focus();
      titleInput.select();
    }

    const dropdown = postElement.querySelector(".post-menu-dropdown");
    if (dropdown) dropdown.classList.remove("show");
  }

  convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async savePost(postId) {
    const post = this.feedPosts.find((p) => String(p.id) === String(postId));
    if (!post) {
      console.error("Post not found for ID:", postId);
      return;
    }

    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) {
      console.error("Post element not found for ID:", postId);
      return;
    }

    const editForm = postElement.querySelector(".post-edit-form");
    const titleInput = editForm.querySelector(".edit-title-input");
    const descriptionInput = editForm.querySelector(".edit-description-input");

    if (!titleInput || !descriptionInput) return;

    const newTitle = titleInput.value.trim();
    const newDescription = descriptionInput.value.trim();

    if (!newTitle) {
      alertManager.error("Title cannot be empty!");
      return;
    }

    post.title = newTitle;
    post.description = newDescription;

    if (post.type === "workout") {
      const durationInput = editForm.querySelector(".edit-duration-input");
      const intensityInput = editForm.querySelector(".edit-intensity-input");

      if (durationInput && durationInput.value.trim()) {
        post.metrics.duration = durationInput.value.trim();
        post.metrics.time = durationInput.value.trim();
      }
      if (intensityInput) {
        post.metrics.intensity = intensityInput.value;
      }
    }

    const caloriesInput = editForm.querySelector(".edit-calories-input");
    let calories = 0;
    if (caloriesInput && caloriesInput.value.trim()) {
      const caloriesValue = caloriesInput.value.trim();
      const caloriesMatch = caloriesValue.match(/(\d+)/);
      calories = caloriesMatch ? parseInt(caloriesMatch[1]) : 0;
      post.metrics.calories = caloriesValue.includes("kcal")
        ? caloriesValue
        : `${calories} kcal`;
    }

    const imageItems = editForm.querySelectorAll(".edit-image-item");
    const processedImages = [];

    for (const item of imageItems) {
      if (item._fileObject) {
        try {
          const base64Image = await this.convertImageToBase64(item._fileObject);
          processedImages.push(base64Image);
        } catch (error) {
          console.error("Error converting image to base64:", error);
        }
      } else {
        const imageName = item.querySelector(".image-name")?.textContent;
        const imagePreview = item.querySelector("img");
        if (imagePreview && imagePreview.src) {
          if (
            imagePreview.src.startsWith("data:image/") ||
            imagePreview.src.startsWith("http")
          ) {
            processedImages.push(imagePreview.src);
          } else if (imageName) {
            processedImages.push(imageName);
          }
        } else if (imageName) {
          processedImages.push(imageName);
        }
      }
    }

    post.images = processedImages;

    if (post.type === "workout") {
      let activityId = post._id;
      if (!activityId && String(post.id).startsWith("activity-")) {
        activityId = String(post.id).replace("activity-", "");
      }

      if (activityId) {
        try {
          const activityData = {
            title: post.title,
            description: post.description,
            duration: this.parseDurationToMinutes(
              post.metrics.duration || post.metrics.time
            ),
            intensity: this.mapIntensityToEnum(post.metrics.intensity),
            calories: calories,
            metrics: {
              distance: post.metrics.distance || 0,
            },
            images: processedImages.filter(
              (img) => typeof img === "string" && img.startsWith("data:image/")
            ),
          };

          await ApiService.updateActivity(activityId, activityData);
          alertManager.success("Activity updated successfully!");
        } catch (error) {
          console.error("Error updating activity:", error);
          alertManager.error("Failed to update activity. Please try again.");
          return;
        }
      } else {
        alertManager.success("Post updated successfully!");
      }
    } else if (post.type === "recipe") {
      let recipeId = post._id;
      if (!recipeId && String(post.id).startsWith("recipe-")) {
        recipeId = String(post.id).replace("recipe-", "");
      }

      if (recipeId) {
        try {
          const timeInput = editForm.querySelector(".edit-time-input");
          const categoryInput = editForm.querySelector(".edit-category-input");
          const servingsInput = editForm.querySelector(".edit-servings-input");

          const ingredientsInputs = editForm.querySelectorAll(
            ".edit-ingredients-container .ingredient-input"
          );
          const stepsInputs = editForm.querySelectorAll(
            ".edit-directions-container .direction-input"
          );

          const ingredients = Array.from(ingredientsInputs)
            .map((input) => input.value.trim())
            .filter((value) => value.length > 0);

          const steps = Array.from(stepsInputs)
            .map((input) => input.value.trim())
            .filter((value) => value.length > 0);

          const recipeData = {
            name: post.title,
            description: post.description,
            calories: calories,
            time: timeInput
              ? timeInput.value.trim()
              : post.metrics.time || "N/A",
            category: categoryInput
              ? categoryInput.value
              : post.recipeData?.category || "dinner",
            ingredients:
              ingredients.length > 0
                ? ingredients
                : post.recipeData?.ingredients || [],
            steps: steps.length > 0 ? steps : post.recipeData?.steps || [],
            servings: servingsInput
              ? parseInt(servingsInput.value) || 4
              : post.recipeData?.servings || 4,
          };

          if (processedImages.length > 0) {
            const firstImage = processedImages[0];
            if (
              typeof firstImage === "string" &&
              (firstImage.startsWith("data:image/") ||
                firstImage.startsWith("http"))
            ) {
              recipeData.image = firstImage;
            }
          } else if (post.images && post.images.length > 0) {
            const existingImage = post.images[0];
            if (
              typeof existingImage === "string" &&
              (existingImage.startsWith("data:image/") ||
                existingImage.startsWith("http"))
            ) {
              recipeData.image = existingImage;
            }
          }

          await ApiService.updateRecipe(recipeId, recipeData);

          post.metrics.time = recipeData.time;
          post.metrics.calories = `${recipeData.calories} kcal`;
          if (!post.recipeData) {
            post.recipeData = {};
          }
          post.recipeData.category = recipeData.category;
          post.recipeData.ingredients = recipeData.ingredients;
          post.recipeData.steps = recipeData.steps;
          post.recipeData.servings = recipeData.servings;

          if (recipeData.image) {
            post.images = [recipeData.image];
          } else if (processedImages.length > 0) {
            post.images = processedImages;
          } else if (post.images && post.images.length > 0) {
            post.images = post.images;
          }

          alertManager.success("Recipe updated successfully!");
        } catch (error) {
          console.error("Error updating recipe:", error);
          alertManager.error("Failed to update recipe. Please try again.");
          return;
        }
      } else {
        alertManager.success("Post updated successfully!");
      }
    } else {
      alertManager.success("Post updated successfully!");
    }

    this.renderFeed();
    this.applyDynamicGridLayout();
  }

  parseDurationToMinutes(durationStr) {
    if (!durationStr) return 0;
    const match = durationStr.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
  }

  mapIntensityToEnum(intensity) {
    const intensityMap = {
      low: "low",
      Low: "low",
      medium: "moderate",
      Medium: "moderate",
      moderate: "moderate",
      high: "high",
      High: "high",
    };
    return intensityMap[intensity] || "moderate";
  }

  cancelEdit(postId) {
    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) return;

    const editForm = postElement.querySelector(".post-edit-form");
    const postTypeSection = postElement.querySelector(".post-type");

    if (!editForm || !postTypeSection) return;

    editForm.classList.remove("show");
    postTypeSection.style.display = "";

    const metricsSection = postElement.querySelector(".post-metrics");
    const imagesSection = postElement.querySelector(".post-images");
    if (metricsSection) metricsSection.style.display = "";
    if (imagesSection) imagesSection.style.display = "";

    const post = this.feedPosts.find((p) => String(p.id) === String(postId));
    if (post) {
      const titleInput = editForm.querySelector(".edit-title-input");
      const descriptionInput = editForm.querySelector(
        ".edit-description-input"
      );
      if (titleInput) titleInput.value = post.title;
      if (descriptionInput) descriptionInput.value = post.description;

      if (post.type === "workout") {
        const durationInput = editForm.querySelector(".edit-duration-input");
        const intensityInput = editForm.querySelector(".edit-intensity-input");
        if (durationInput)
          durationInput.value =
            post.metrics.duration || post.metrics.time || "";
        if (intensityInput)
          intensityInput.value = post.metrics.intensity || "Medium";
      }
      const caloriesInput = editForm.querySelector(".edit-calories-input");
      if (caloriesInput) caloriesInput.value = post.metrics.calories || "";

      const imagesList = editForm.querySelector(".edit-images-list");
      if (imagesList) {
        imagesList.innerHTML = (post.images || [])
          .map((img, idx) => {
            let previewHtml = "";
            let displayName = "";
            const isFile = img instanceof File;
            if (isFile) {
              const previewUrl = URL.createObjectURL(img);
              previewHtml = `<div class="edit-image-preview"> <img src="${previewUrl}" alt="${img.name}" class="edit-image-thumb"> </div>`;
              displayName = img.name;
            } else if (typeof img === "string") {
              if (
                img.startsWith("data:image/") ||
                img.startsWith("http://") ||
                img.startsWith("https://")
              ) {
                previewHtml = `<div class="edit-image-preview"> <img src="${img}" alt="Image ${
                  idx + 1
                }" class="edit-image-thumb" onerror="this.style.display='none';"> </div>`;
                displayName = `Image ${idx + 1}`;
              } else {
                displayName = img;
              }
            }
            const truncatedName =
              displayName.length > 30
                ? displayName.substring(0, 30) + "..."
                : displayName;
            return `
                <div class="edit-image-item" data-image-index="${idx}" ${
              isFile ? 'data-has-file="true"' : ""
            }>
                ${previewHtml}
                ${
                  displayName
                    ? `<span class="image-name" title="${
                        typeof img === "string" &&
                        (img.startsWith("data:image/") || img.length > 50)
                          ? "Image"
                          : displayName
                      }">${truncatedName}</span>`
                    : ""
                } <button type="button" class="remove-image-btn" data-image-index="${idx}"> <i class="fas fa-times"></i> </button> </div>
                `;
          })
          .join("");

        const restoredItems = imagesList.querySelectorAll(".edit-image-item");
        restoredItems.forEach((item, idx) => {
          if (post.images && post.images[idx] instanceof File) {
            item._fileObject = post.images[idx];
          }
        });
      }

      const fileInput = editForm.querySelector(".add-image-input");
      if (fileInput) fileInput.value = "";

      this.updateEditRemoveButtons(postId);
    }
  }

  removeImage(postId, imageIndex) {
    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) return;

    const editForm = postElement.querySelector(".post-edit-form");
    const imageItem = editForm.querySelector(
      `.edit-image-item[data-image-index="${imageIndex}"]`
    );
    if (imageItem) {
      imageItem.remove();
    }
  }

  addImages(postId, files) {
    if (!files || files.length === 0) return;

    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) return;

    const editForm = postElement.querySelector(".post-edit-form");
    const imagesList = editForm.querySelector(".edit-images-list");
    if (!imagesList) return;

    const currentImages = imagesList.querySelectorAll(".edit-image-item");
    let nextIndex = currentImages.length;

    Array.from(files).forEach((file) => {
      const fileName = file.name;
      const imageItem = document.createElement("div");
      imageItem.className = "edit-image-item";
      imageItem.setAttribute("data-image-index", nextIndex);

      imageItem._fileObject = file;

      const previewUrl = URL.createObjectURL(file);

      const displayFileName =
        fileName.length > 30 ? fileName.substring(0, 30) + "..." : fileName;
      imageItem.innerHTML = `
        <div class="edit-image-preview"> <img src="${previewUrl}" alt="${fileName}" class="edit-image-thumb"> </div> <span class="image-name" title="${fileName}">${displayFileName}</span> <button type="button" class="remove-image-btn" data-image-index="${nextIndex}"> <i class="fas fa-times"></i> </button>
        `;
      imagesList.appendChild(imageItem);
      nextIndex++;
    });

    const fileInput = editForm.querySelector(".add-image-input");
    if (fileInput) fileInput.value = "";
  }

  addIngredientField(postId) {
    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) return;

    const editForm = postElement.querySelector(".post-edit-form");
    const container = editForm?.querySelector(".edit-ingredients-container");
    if (!container) return;

    const addButton = container.querySelector(".add-ingredient-btn");

    const ingredientGroup = document.createElement("div");
    ingredientGroup.className = "ingredient-input-group";
    ingredientGroup.innerHTML = `
            <input type="text" class="ingredient-input" placeholder="e.g., 2 cups flour" required>
            <button type="button" class="remove-ingredient">&times;</button>
        `;

    if (addButton) {
      container.insertBefore(ingredientGroup, addButton);
    } else {
      container.appendChild(ingredientGroup);
    }

    this.updateEditRemoveButtons(postId);
  }

  removeIngredientField(postId, button) {
    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) return;

    const editForm = postElement.querySelector(".post-edit-form");
    const container = editForm?.querySelector(".edit-ingredients-container");
    if (!container || container.children.length <= 1) return;

    button.closest(".ingredient-input-group")?.remove();
    this.updateEditRemoveButtons(postId);
  }

  addDirectionField(postId) {
    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) return;

    const editForm = postElement.querySelector(".post-edit-form");
    const container = editForm?.querySelector(".edit-directions-container");
    if (!container) return;

    const addButton = container.querySelector(".add-direction-btn");
    const stepNumber =
      container.querySelectorAll(".direction-input-group").length + 1;

    const directionGroup = document.createElement("div");
    directionGroup.className = "direction-input-group";
    directionGroup.innerHTML = `
            <textarea class="direction-input" placeholder="Enter step ${stepNumber}..." required></textarea>
            <button type="button" class="remove-direction">&times;</button>
        `;

    if (addButton) {
      container.insertBefore(directionGroup, addButton);
    } else {
      container.appendChild(directionGroup);
    }

    this.updateEditRemoveButtons(postId);
  }

  removeDirectionField(postId, button) {
    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) return;

    const editForm = postElement.querySelector(".post-edit-form");
    const container = editForm?.querySelector(".edit-directions-container");
    if (!container || container.children.length <= 1) return;

    button.closest(".direction-input-group")?.remove();
    this.updateEditRemoveButtons(postId);
  }

  updateEditRemoveButtons(postId) {
    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) return;

    const editForm = postElement.querySelector(".post-edit-form");
    if (!editForm) return;

    const ingredientGroups = editForm.querySelectorAll(
      ".edit-ingredients-container .ingredient-input-group"
    );
    const directionGroups = editForm.querySelectorAll(
      ".edit-directions-container .direction-input-group"
    );

    ingredientGroups.forEach((group) => {
      const removeBtn = group.querySelector(".remove-ingredient");
      if (removeBtn) {
        if (ingredientGroups.length > 1) {
          removeBtn.style.display = "flex";
          removeBtn.style.color = "";
          removeBtn.style.background = "";
        } else {
          removeBtn.style.display = "none";
        }
      }
    });

    directionGroups.forEach((group) => {
      const removeBtn = group.querySelector(".remove-direction");
      if (removeBtn) {
        if (directionGroups.length > 1) {
          removeBtn.style.display = "flex";
          removeBtn.style.color = "";
          removeBtn.style.background = "";
        } else {
          removeBtn.style.display = "none";
        }
      }
    });
  }

  async deletePost(postId) {
    const post = this.feedPosts.find((p) => String(p.id) === String(postId));
    if (!post) {
      console.error("Post not found for ID:", postId);
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${post.title}"?`
    );
    if (!confirmed) return;

    if (post.type === "workout") {
      let activityId = post._id;
      if (!activityId && String(post.id).startsWith("activity-")) {
        activityId = String(post.id).replace("activity-", "");
      }

      if (activityId) {
        try {
          await ApiService.deleteActivity(activityId);
        } catch (error) {
          console.error("Error deleting activity:", error);
          alertManager.error("Failed to delete activity. Please try again.");
          return;
        }
      }
    } else if (post.type === "recipe") {
      let recipeId = post._id;
      if (!recipeId && String(post.id).startsWith("recipe-")) {
        recipeId = String(post.id).replace("recipe-", "");
      }

      if (recipeId) {
        try {
          await ApiService.deleteRecipe(recipeId);
        } catch (error) {
          console.error("Error deleting recipe:", error);
          alertManager.error("Failed to delete recipe. Please try again.");
          return;
        }
      }
    }

    const userId = getUserId();
    try {
      const savedKey = `${userId}: fitfuel-saved-posts`;
      const savedIds = JSON.parse(localStorage.getItem(savedKey) || "[]");
      const filteredSaved = savedIds.filter((id) => id !== postId);
      localStorage.setItem(savedKey, JSON.stringify(filteredSaved));
    } catch {}

    try {
      const likedKey = `${userId}: fitfuel-liked-posts`;
      const likedIds = JSON.parse(localStorage.getItem(likedKey) || "[]");
      const filteredLiked = likedIds.filter((id) => id !== postId);
      localStorage.setItem(likedKey, JSON.stringify(filteredLiked));
    } catch {}

    this.feedPosts = this.feedPosts.filter((p) => p.id !== postId);

    this.renderFeed();
    alertManager.success("Post deleted successfully!");
  }

  viewRecipeFromPost(post) {
    if (!window.recipeViewManager) {
      console.error("RecipeViewManager not initialized");
      return;
    }

    const recipe = this.convertPostToRecipe(post);
    const detailedRecipe = window.recipesManager
      ? window.recipesManager.createDetailedRecipe(recipe)
      : recipe;
    window.recipeViewManager.showRecipe(detailedRecipe);
  }

  convertPostToRecipe(post) {
    const caloriesMatch = post.metrics.calories
      ? post.metrics.calories.match(/(\d+)/)
      : null;
    const calories = caloriesMatch ? parseInt(caloriesMatch[1]) : 0;

    const timeMatch = post.metrics.time
      ? post.metrics.time.match(/(\d+)/)
      : null;
    const time = timeMatch ? `${timeMatch[1]} min` : "15 min";

    let lastUpdated = "December 2024";
    try {
      if (post.timestamp) {
        const date =
          post.timestamp instanceof Date
            ? post.timestamp
            : new Date(post.timestamp);
        if (!isNaN(date.getTime())) {
          lastUpdated = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
      }
    } catch (error) {
      console.error("Error parsing timestamp: ", error);
    }

    return {
      id: post.id,
      name: post.title,
      description: post.description || "",
      calories: calories,
      category: "other",
      tags: [],
      time: time,
      image: post.images && post.images.length > 0 ? post.images[0] : null,
      author: post.user.name,
      lastUpdated: lastUpdated,
      prepTime: time,
      cookTime: "0 min",
      totalTime: time,
      servings: "2",
      ingredients: [],
      directions: [],
      notes: "",
      nutrition: {
        calories: calories,
        protein: post.metrics.protein || "N/A",
        carbs: post.metrics.carbs || "N/A",
        fat: "N/A",
        fiber: "N/A",
        sugar: "N/A",
        sodium: "N/A",
      },
    };
  }

  createPostHTML(post) {
    const typeIcon =
      post.type === "workout" ? "fas fa-dumbbell" : "fas fa-utensils";

    const metricLabels = Object.keys(post.metrics);
    const metricValues = Object.values(post.metrics);

    const userId = getUserId();
    let isLiked = false;
    let isSaved = false;

    if (userId !== "guest" && this.userPreferences) {
      const likedPostIds = this.userPreferences.likedPosts || [];
      const savedPostIds = this.userPreferences.savedPosts || [];
      isLiked = likedPostIds.includes(String(post.id));
      isSaved = savedPostIds.includes(String(post.id));
    } else {
      try {
        const likedKey = `${userId}: fitfuel-liked-posts`;
        const likedIds = JSON.parse(localStorage.getItem(likedKey) || "[]");
        isLiked = likedIds.includes(post.id);
      } catch {}

      try {
        const savedKey = `${userId}: fitfuel-saved-posts`;
        const savedIds = JSON.parse(localStorage.getItem(savedKey) || "[]");
        isSaved = savedIds.includes(post.id);
      } catch {}
    }

    return `
            <div class="feed-post ${post.isUserUpload ? "user-post" : ""} ${
      post.type === "recipe" ? "recipe-post" : ""
    }" data-post-id="${post.id}" data-post-type="${post.type}">
                <div class="post-header">
                    <div class="post-avatar">${post.user.avatar}</div>
                    <div class="post-user-info">
                        <div class="post-user-name">
                            ${post.user.name}
                            ${
                              post.isUserUpload
                                ? '<span class="user-badge">You</span>'
                                : ""
                            }
                        </div>
                        <div class="post-timestamp">${this.formatTimestamp(
                          post.timestamp
                        )}</div>
                    </div>
                    ${
                      post.isUserUpload
                        ? `
                        <div class="post-menu">
                            <i class="fas fa-ellipsis-v"></i>
                            <div class="post-menu-dropdown">
                                <div class="menu-item" data-action="edit" data-post-id="${post.id}">
                                    <i class="fas fa-edit"></i>
                                    <span>Edit</span>
                                </div>
                                <div class="menu-item" data-action="delete" data-post-id="${post.id}">
                                    <i class="fas fa-trash"></i>
                                    <span>Delete</span>
                                </div>
                            </div>
                        </div>
                        `
                        : ""
                    }
                </div>
                <div class="post-content">
                    <div class="post-type">
                        <i class="${typeIcon} post-type-icon"></i>
                        <div>
                            <div class="post-title">${post.title}</div>
                            ${
                              post.description
                                ? `<div class="post-description">${post.description}</div>`
                                : ""
                            }
                        </div>
                    </div>
                    ${
                      post.isUserUpload
                        ? `
                        <div class="post-edit-form" data-post-id="${post.id}">
                            <input type="text" class="edit-title-input" value="${
                              post.title
                            }" placeholder="Post title">
                            <textarea class="edit-description-input" placeholder="Post description">${
                              post.description
                            }</textarea>
                            <div class="edit-metrics-section">
                                <h4>Metrics</h4>
                                ${
                                  post.type === "workout"
                                    ? `
                                    <div class="edit-metric-row">
                                        <label>Duration:</label>
                                        <input type="text" class="edit-duration-input" value="${
                                          post.metrics.duration ||
                                          post.metrics.time ||
                                          ""
                                        }" placeholder="e.g., 45 min">
                                    </div>
                                    <div class="edit-metric-row">
                                        <label>Intensity:</label>
                                        <select class="edit-intensity-input">
                                            <option value="Low" ${
                                              post.metrics.intensity === "Low"
                                                ? "selected"
                                                : ""
                                            }>Low</option>
                                            <option value="Medium" ${
                                              post.metrics.intensity ===
                                              "Medium"
                                                ? "selected"
                                                : ""
                                            }>Medium</option>
                                            <option value="High" ${
                                              post.metrics.intensity === "High"
                                                ? "selected"
                                                : ""
                                            }>High</option>
                                        </select>
                                    </div>
                                    `
                                    : post.type === "recipe"
                                    ? `
                                    <div class="edit-metric-row">
                                        <label>Time:</label>
                                        <input type="text" class="edit-time-input" value="${
                                          post.metrics.time || ""
                                        }" placeholder="e.g., 30 min">
                                    </div>
                                    <div class="edit-metric-row">
                                        <label>Category:</label>
                                        <select class="edit-category-input">
                                            <option value="breakfast" ${
                                              post.recipeData?.category ===
                                              "breakfast"
                                                ? "selected"
                                                : ""
                                            }>Breakfast</option>
                                            <option value="lunch" ${
                                              post.recipeData?.category ===
                                              "lunch"
                                                ? "selected"
                                                : ""
                                            }>Lunch</option>
                                            <option value="dinner" ${
                                              post.recipeData?.category ===
                                              "dinner"
                                                ? "selected"
                                                : ""
                                            }>Dinner</option>
                                            <option value="snack" ${
                                              post.recipeData?.category ===
                                              "snack"
                                                ? "selected"
                                                : ""
                                            }>Snack</option>
                                            <option value="dessert" ${
                                              post.recipeData?.category ===
                                              "dessert"
                                                ? "selected"
                                                : ""
                                            }>Dessert</option>
                                        </select>
                                    </div>
                                    `
                                    : ""
                                }
                                <div class="edit-metric-row">
                                    <label>Calories:</label>
                                    <input type="text" class="edit-calories-input" value="${
                                      post.metrics.calories || ""
                                    }" placeholder="e.g., 320 kcal">
                                </div>
                            </div>
                            ${
                              post.type === "recipe" && post.recipeData
                                ? `
                            <div class="edit-recipe-details-section">
                                <h4>Recipe Details</h4>
                                <div class="edit-metric-row">
                                    <label>Ingredients *</label>
                                    <div class="edit-ingredients-container" data-post-id="${
                                      post.id
                                    }">
                                        ${
                                          (post.recipeData.ingredients || [])
                                            .length > 0
                                            ? (
                                                post.recipeData.ingredients ||
                                                []
                                              )
                                                .map((ing, idx) => {
                                                  const ingredients =
                                                    post.recipeData
                                                      .ingredients || [];
                                                  const showRemove =
                                                    ingredients.length > 1;
                                                  return `
                                                <div class="ingredient-input-group">
                                                    <input type="text" class="ingredient-input" placeholder="e.g., 2 cups flour" value="${ing
                                                      .replace(/"/g, "&quot;")
                                                      .replace(
                                                        /'/g,
                                                        "&#39;"
                                                      )}" required>
                                                    <button type="button" class="remove-ingredient" ${
                                                      showRemove
                                                        ? ""
                                                        : 'style="display: none;"'
                                                    }>&times;</button>
                                                </div>
                                            `;
                                                })
                                                .join("")
                                            : `
                                                <div class="ingredient-input-group">
                                                    <input type="text" class="ingredient-input" placeholder="e.g., 2 cups flour" required>
                                                    <button type="button" class="remove-ingredient" style="display: none;">&times;</button>
                                                </div>
                                            `
                                        }
                                        <button type="button" class="add-ingredient-btn" data-post-id="${
                                          post.id
                                        }">+ Add Ingredient</button>
                                    </div>
                                </div>
                                <div class="edit-metric-row">
                                    <label>Steps *</label>
                                    <div class="edit-directions-container" data-post-id="${
                                      post.id
                                    }">
                                        ${
                                          (post.recipeData.steps || []).length >
                                          0
                                            ? (post.recipeData.steps || [])
                                                .map((step, idx) => {
                                                  const steps =
                                                    post.recipeData.steps || [];
                                                  const showRemove =
                                                    steps.length > 1;
                                                  return `
                                                <div class="direction-input-group">
                                                    <textarea class="direction-input" placeholder="Enter step ${
                                                      idx + 1
                                                    }..." required>${step
                                                    .replace(/"/g, "&quot;")
                                                    .replace(
                                                      /'/g,
                                                      "&#39;"
                                                    )}</textarea>
                                                    <button type="button" class="remove-direction" ${
                                                      showRemove
                                                        ? ""
                                                        : 'style="display: none;"'
                                                    }>&times;</button>
                                                </div>
                                            `;
                                                })
                                                .join("")
                                            : `
                                                <div class="direction-input-group">
                                                    <textarea class="direction-input" placeholder="Enter step 1..." required></textarea>
                                                    <button type="button" class="remove-direction" style="display: none;">&times;</button>
                                                </div>
                                            `
                                        }
                                        <button type="button" class="add-direction-btn" data-post-id="${
                                          post.id
                                        }">+ Add Step</button>
                                    </div>
                                </div>
                                <div class="edit-metric-row">
                                    <label>Servings:</label>
                                    <input type="number" class="edit-servings-input" value="${
                                      post.recipeData.servings || 4
                                    }" min="1" placeholder="4">
                                </div>
                            </div>
                            `
                                : ""
                            }
                            <div class="edit-images-section">
                                <h4>Images</h4>
                                <div class="edit-images-list">
                                    ${(post.images || [])
                                      .map((img, idx) => {
                                        let previewHtml = "";
                                        let displayName = "";
                                        const isFile = img instanceof File;
                                        if (isFile) {
                                          const previewUrl =
                                            URL.createObjectURL(img);
                                          previewHtml = `<div class="edit-image-preview"><img src="${previewUrl}" alt="${img.name}" class="edit-image-thumb"></div>`;
                                          displayName = img.name;
                                        } else if (typeof img === "string") {
                                          if (
                                            img.startsWith("data:image/") ||
                                            img.startsWith("http://") ||
                                            img.startsWith("https://")
                                          ) {
                                            previewHtml = `<div class="edit-image-preview"><img src="${img}" alt="Image ${
                                              idx + 1
                                            }" class="edit-image-thumb" onerror="this.style.display='none';"></div>`;
                                            displayName = `Image ${idx + 1}`;
                                          } else {
                                            displayName = img;
                                          }
                                        }
                                        return `
                                        <div class="edit-image-item" data-image-index="${idx}" ${
                                          isFile ? 'data-has-file="true"' : ""
                                        }>
                                            ${previewHtml}
                                            ${
                                              displayName
                                                ? `<span class="image-name" title="${
                                                    typeof img === "string" &&
                                                    (img.startsWith(
                                                      "data:image/"
                                                    ) ||
                                                      img.length > 50)
                                                      ? "Image"
                                                      : displayName
                                                  }">${
                                                    displayName.length > 30
                                                      ? displayName.substring(
                                                          0,
                                                          30
                                                        ) + "..."
                                                      : displayName
                                                  }</span>`
                                                : ""
                                            }
                                            <button type="button" class="remove-image-btn" data-image-index="${idx}">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    `;
                                      })
                                      .join("")}
                                </div>
                                <div class="add-image-container">
                                    <input type="file" class="add-image-input" accept="image/*" multiple>
                                    <button type="button" class="add-image-btn">
                                        <i class="fas fa-plus"></i> Add Image
                                    </button>
                                </div>
                            </div>
                            <div class="edit-actions">
                                <button class="edit-save-btn" data-post-id="${
                                  post.id
                                }">
                                    <i class="fas fa-check"></i> Save
                                </button>
                                <button class="edit-cancel-btn" data-post-id="${
                                  post.id
                                }">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            </div>
                        </div>
                        `
                        : ""
                    }
                </div>
                <div class="post-metrics">
                    ${metricLabels
                      .map(
                        (label, index) => `
                            <div class="metric-item">
                                <div class="metric-label">${label}</div>
                                <div class="metric-value">${metricValues[index]}</div>
                            </div>
                            `
                      )
                      .join("")}
                </div>
                ${
                  post.images && post.images.length > 0
                    ? `
                    <div class="post-images" data-image-count="${
                      post.images.length
                    }">
                        ${post.images
                          .map((img, idx) => {
                            if (img instanceof File) {
                              const previewUrl = URL.createObjectURL(img);
                              return `<div class="post-image" data-image-index="${idx}"><img src="${previewUrl}" alt="Post image ${
                                idx + 1
                              }" class="post-image-preview"></div>`;
                            } else if (typeof img === "string") {
                              if (
                                img.startsWith("data:image/") ||
                                img.startsWith("http://") ||
                                img.startsWith("https://")
                              ) {
                                return `<div class="post-image" data-image-index="${idx}"><img src="${img}" alt="Post image ${
                                  idx + 1
                                }" class="post-image-preview" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="post-image-placeholder" style="display: none;">Image ${
                                  idx + 1
                                }</div></div>`;
                              } else {
                                const fileName = img.split("/").pop();
                                return `<div class="post-image" data-image-index="${idx}"><div class="post-image-placeholder"><i class="fas fa-image"></i><span class="image-filename">${fileName}</span></div></div>`;
                              }
                            }
                            return `<div class="post-image"><div class="post-image-placeholder"><i class="fas fa-image"></i><span class="image-filename">Image</span></div></div>`;
                          })
                          .join("")}
                    </div>
                    `
                    : ""
                }
                <div class="post-actions">
                    <div class="post-action ${isLiked ? "liked" : ""}">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${isLiked ? "Liked" : "Like"}</span>
                    </div>
                    <div class="post-action">
                        <i class="fas fa-comment"></i>
                        <span>Comment</span>
                    </div>
                    <div class="post-action ${isSaved ? "saved" : ""}">
                        <i class="fas fa-bookmark"></i>
                        <span>${isSaved ? "Saved" : "Save"}</span>
                    </div>
                </div>
            </div>
        `;
  }

  updatePostState(postId, state, isActive) {
    const postElement = document.querySelector(
      `.feed-post[data-post-id="${postId}"]`
    );
    if (!postElement) return;

    const action = postElement.querySelector(
      `.post-action[data-action="${state === "saved" ? "save" : "like"}"]`
    );
    if (!action) return;

    const span = action.querySelector("span");
    if (!span) return;

    if (state === "saved") {
      if (isActive) {
        action.classList.add("saved");
        span.textContent = "Saved";
      } else {
        action.classList.remove("saved");
        span.textContent = "Save";
      }
    } else if (state === "liked") {
      if (isActive) {
        action.classList.add("liked");
        span.textContent = "Liked";
      } else {
        action.classList.remove("liked");
        span.textContent = "Like";
      }
    }
  }

  updateRecipePostState(recipeId, state, isActive) {
    const recipePosts = this.feedPosts.filter(
      (p) => p.type === "recipe" && String(p.id) === String(recipeId)
    );
    recipePosts.forEach((post) => {
      const postElement = document.querySelector(
        `.feed-post[data-post-id="${post.id}"]`
      );
      if (!postElement) return;

      const action = postElement.querySelector(
        `.post-action[data-action="${state === "saved" ? "save" : "like"}"]`
      );
      if (!action) return;

      const span = action.querySelector("span");
      if (!span) return;

      if (state === "saved") {
        if (isActive) {
          action.classList.add("saved");
          span.textContent = "Saved";
        } else {
          action.classList.remove("saved");
          span.textContent = "Save";
        }
      } else if (state === "liked") {
        if (isActive) {
          action.classList.add("liked");
          span.textContent = "Liked";
        } else {
          action.classList.remove("liked");
          span.textContent = "Like";
        }
      }
    });
  }
}
