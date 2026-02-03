class RecipesManager {
  constructor() {
    this.recipes = [];
    this.filteredRecipes = [];
    this.currentPage = 1;
    this.recipesPerPage = 8;
    this.selectedCategory = null;
    this.selectedOccasion = null;
    this.selectedCuisine = null;
    this.initializeRecipes().catch((error) => {
      console.error("Error initializing recipes:", error);
    });
  }

  async initializeRecipes() {
    await this.loadRecipes();
    this.setupEventListeners();
    this.renderRecipes();
  }

  async loadRecipes() {
    const userId = getUserId();
    this.recipes = [];

    try {
      const response = await ApiService.getRecipes();
      if (response && response.recipes) {
        if (response.recipes.length > 0) {
          this.recipes = response.recipes.map((recipe) => ({
            id: recipe._id || recipe.id,
            name: recipe.name,
            description: recipe.description || "",
            calories: recipe.calories || 0,
            category: recipe.category || "dinner",
            tags: recipe.tags || [],
            time: recipe.time || "N/A",
            image: recipe.image,
            ingredients: recipe.ingredients || [],
            steps: recipe.steps || [],
            servings: recipe.servings || 4,
          }));
        }
      }
    } catch (error) {
      if (error.message && !error.message.includes("Unauthorized")) {
        console.error("Error loading recipes: ", error);
      }
    }

    this.filteredRecipes = [...this.recipes];
    this.currentPage = 1;
  }

  setupEventListeners() {
    const searchInput = document.getElementById("recipe-search");
    if (searchInput) {
      searchInput.addEventListener("input", () => this.handleSearch());
    }

    const caloriesMinInput = document.getElementById("calories-min");
    const caloriesMaxInput = document.getElementById("calories-max");
    if (caloriesMinInput) {
      caloriesMinInput.addEventListener("input", () => this.applyFilters());
    }
    if (caloriesMaxInput) {
      caloriesMaxInput.addEventListener("input", () => this.applyFilters());
    }

    const surpriseMeBtn = document.getElementById("surprise-me-btn");
    if (surpriseMeBtn) {
      surpriseMeBtn.addEventListener("click", () => this.surpriseMe());
    }

    this.setupMegaMenu();
    this.setupIngredientsMegaMenu();
    this.setupOccasionsMegaMenu();
    this.setupCuisinesMegaMenu();

    const resetFiltersBtn = document.getElementById("reset-filters");
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", () => this.resetFilters());
    }

    const loadMoreBtn = document.getElementById("load-more");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => this.loadMore());
    }

    document
      .querySelectorAll(".nav-dropdown-item[data-category]")
      .forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          this.selectCategory(item.dataset.category);
        });
      });

    document
      .querySelectorAll(".nav-dropdown-item[data-occasion]")
      .forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          this.selectOccasion(item.dataset.occasion);
        });
      });

    document
      .querySelectorAll(".nav-dropdown-item[data-cuisine]")
      .forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          this.selectCuisine(item.dataset.cuisine);
        });
      });

    document.addEventListener("recipeSaved", (e) =>
      this.updateRecipeCardState(e.detail.recipeId, "saved", true)
    );
    document.addEventListener("recipeUnsaved", (e) =>
      this.updateRecipeCardState(e.detail.recipeId, "saved", false)
    );
    document.addEventListener("recipeLiked", (e) =>
      this.updateRecipeCardState(e.detail.recipeId, "liked", true)
    );
    document.addEventListener("recipeUnliked", (e) =>
      this.updateRecipeCardState(e.detail.recipeId, "liked", false)
    );

    document.addEventListener("userSignedIn", () => {
      this.renderRecipes();
    });

    document.addEventListener("userSignedOut", () => {
      this.renderRecipes();
    });

    document.addEventListener("click", (e) => {
      const shareBtn = e.target.closest && e.target.closest(".btn-share");
      const likeBtn = e.target.closest && e.target.closest(".btn-like");
      const saveBtn = e.target.closest && e.target.closest(".btn-save");
      const recipeCard = e.target.closest && e.target.closest(".recipe-card");

      if (shareBtn) {
        e.stopPropagation();
        e.preventDefault();
        this.shareRecipe(shareBtn);
        return;
      }
      if (likeBtn) {
        e.stopPropagation();
        e.preventDefault();
        this.toggleLike(likeBtn);
        return;
      }
      if (saveBtn) {
        e.stopPropagation();
        e.preventDefault();
        this.saveRecipe(saveBtn);
        return;
      }
      if (
        recipeCard &&
        !e.target.closest(".recipe-actions") &&
        !e.target.closest(".recipe-save-overlay")
      ) {
        const actionBtn = recipeCard.querySelector(
          ".btn-share, .btn-like, .btn-save"
        );
        const recipeId = actionBtn?.dataset.recipeId;
        if (recipeId) {
          this.viewRecipeById(recipeId);
        }
      }
    });
  }

  handleSearch() {
    const searchTerm = document
      .getElementById("recipe-search")
      .value.toLowerCase();
    this.filteredRecipes = this.recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(searchTerm) ||
        recipe.description.toLowerCase().includes(searchTerm)
    );
    this.currentPage = 1;
    this.updateActiveFilters();
    this.renderRecipes();
  }

  applyFilters() {
    const searchTerm = document
      .getElementById("recipe-search")
      .value.toLowerCase();
    const caloriesMinInput = document.getElementById("calories-min");
    const caloriesMaxInput = document.getElementById("calories-max");
    const caloriesMin =
      caloriesMinInput && caloriesMinInput.value
        ? parseInt(caloriesMinInput.value)
        : 0;
    const caloriesMax =
      caloriesMaxInput && caloriesMaxInput.value
        ? parseInt(caloriesMaxInput.value)
        : Infinity;

    this.filteredRecipes = this.recipes.filter((recipe) => {
      const matchesSearch =
        recipe.name.toLowerCase().includes(searchTerm) ||
        recipe.description.toLowerCase().includes(searchTerm);
      const matchesCalories =
        recipe.calories >= caloriesMin && recipe.calories <= caloriesMax;
      const matchesCategory =
        !this.selectedCategory ||
        (recipe.category &&
          recipe.category.toLowerCase() ===
            this.selectedCategory.toLowerCase());
      const matchesOccasion =
        !this.selectedOccasion ||
        (recipe.occasion &&
          recipe.occasion.toLowerCase() ===
            this.selectedOccasion.toLowerCase());
      const matchesCuisine =
        !this.selectedCuisine ||
        (recipe.cuisine &&
          recipe.cuisine.toLowerCase() === this.selectedCuisine.toLowerCase());

      return (
        matchesSearch &&
        matchesCalories &&
        matchesCategory &&
        matchesOccasion &&
        matchesCuisine
      );
    });

    this.currentPage = 1;
    this.updateActiveFilters();
    this.renderRecipes();
  }

  updateActiveFilters() {
    const activeFiltersContainer = document.getElementById("active-filters");
    if (!activeFiltersContainer) return;

    activeFiltersContainer.innerHTML = "";

    const filters = [];

    if (this.selectedCategory) {
      const categoryName =
        this.selectedCategory.charAt(0).toUpperCase() +
        this.selectedCategory.slice(1);
      filters.push({
        type: "category",
        value: this.selectedCategory,
        label: categoryName,
      });
    }

    if (this.selectedOccasion) {
      const occasionName = this.selectedOccasion
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      filters.push({
        type: "occasion",
        value: this.selectedOccasion,
        label: occasionName,
      });
    }

    if (this.selectedCuisine) {
      const cuisineName = this.selectedCuisine
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      filters.push({
        type: "cuisine",
        value: this.selectedCuisine,
        label: cuisineName,
      });
    }

    const caloriesMinInput = document.getElementById("calories-min");
    const caloriesMaxInput = document.getElementById("calories-max");
    const caloriesMin =
      caloriesMinInput && caloriesMinInput.value
        ? parseInt(caloriesMinInput.value)
        : null;
    const caloriesMax =
      caloriesMaxInput && caloriesMaxInput.value
        ? parseInt(caloriesMaxInput.value)
        : null;

    if (caloriesMin !== null || caloriesMax !== null) {
      let caloriesLabel = "Calories: ";
      if (caloriesMin !== null && caloriesMax !== null) {
        caloriesLabel += `${caloriesMin} - ${caloriesMax}`;
      } else if (caloriesMin !== null) {
        caloriesLabel += `${caloriesMin}+`;
      } else if (caloriesMax !== null) {
        caloriesLabel += `up to ${caloriesMax}`;
      }
      filters.push({
        type: "calories",
        value: `${caloriesMin || ""}-${caloriesMax || ""}`,
        label: caloriesLabel,
      });
    }

    filters.forEach((filter) => {
      const tag = document.createElement("div");
      tag.className = "filter-tag";
      tag.innerHTML = `
                <span>${filter.label}</span>
                <span class="remove-filter" data-filter-type="${filter.type}" data-filter-value="${filter.value}">
                    <i class="fas fa-times"></i>
                </span>
            `;
      activeFiltersContainer.appendChild(tag);
    });

    activeFiltersContainer.querySelectorAll(".remove-filter").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const filterType = btn.dataset.filterType;
        const filterValue = btn.dataset.filterValue;

        switch (filterType) {
          case "category":
            this.selectCategory(filterValue);
            break;
          case "occasion":
            this.selectOccasion(filterValue);
            break;
          case "cuisine":
            this.selectCuisine(filterValue);
            break;
          case "calories":
            if (caloriesMinInput) caloriesMinInput.value = "";
            if (caloriesMaxInput) caloriesMaxInput.value = "";
            this.applyFilters();
            break;
        }
      });
    });
  }

  selectCategory(category) {
    document
      .querySelectorAll(".nav-dropdown-item[data-category]")
      .forEach((item) => {
        item.classList.remove("active");
      });

    const selectedItem = document.querySelector(
      `.nav-dropdown-item[data-category="${category}"]`
    );
    if (selectedItem) {
      selectedItem.classList.add("active");
    }

    this.selectedCategory =
      this.selectedCategory === category ? null : category;
    this.applyFilters();
    this.updateActiveFilters();
  }

  selectOccasion(occasion) {
    document
      .querySelectorAll(".nav-dropdown-item[data-occasion]")
      .forEach((item) => {
        item.classList.remove("active");
      });

    const selectedItem = document.querySelector(
      `.nav-dropdown-item[data-occasion="${occasion}"]`
    );
    if (selectedItem) {
      selectedItem.classList.add("active");
    }

    this.selectedOccasion =
      this.selectedOccasion === occasion ? null : occasion;
    this.applyFilters();
    this.updateActiveFilters();
  }

  selectCuisine(cuisine) {
    document
      .querySelectorAll(".nav-dropdown-item[data-cuisine]")
      .forEach((item) => {
        item.classList.remove("active");
      });

    const selectedItem = document.querySelector(
      `.nav-dropdown-item[data-cuisine="${cuisine}"]`
    );
    if (selectedItem) {
      selectedItem.classList.add("active");
    }

    this.selectedCuisine = this.selectedCuisine === cuisine ? null : cuisine;
    this.applyFilters();
    this.updateActiveFilters();
  }

  resetFilters() {
    document.getElementById("recipe-search").value = "";
    document.getElementById("calories-min").value = "";
    document.getElementById("calories-max").value = "";

    this.selectedCategory = null;
    this.selectedOccasion = null;
    this.selectedCuisine = null;

    document.querySelectorAll(".nav-dropdown-item").forEach((item) => {
      item.classList.remove("active");
    });

    this.filteredRecipes = [...this.recipes];
    this.currentPage = 1;
    this.updateActiveFilters();
    this.renderRecipes();
  }

  loadMore() {
    this.currentPage++;
    this.renderRecipes();
  }

  renderRecipes() {
    const recipeGrid = document.getElementById("recipe-grid");
    const emptyState = document.getElementById("empty-state");
    const loadMoreBtn = document.getElementById("load-more");

    if (!recipeGrid) return;

    recipeGrid.innerHTML = "";

    if (this.filteredRecipes.length === 0) {
      emptyState.style.display = "block";
      loadMoreBtn.style.display = "none";
      return;
    }

    emptyState.style.display = "none";

    const recipesToShow = this.currentPage * this.recipesPerPage;
    const recipesToRender = this.filteredRecipes.slice(0, recipesToShow);

    recipesToRender.forEach((recipe) => {
      const recipeCard = this.createRecipeCard(recipe);
      recipeGrid.appendChild(recipeCard);
    });

    if (recipesToRender.length < this.filteredRecipes.length) {
      loadMoreBtn.style.display = "block";
    } else {
      loadMoreBtn.style.display = "none";
    }
  }

  createRecipeCard(recipe) {
    const card = document.createElement("div");
    card.className = "recipe-card";

    let isLiked = false;
    try {
      const likedKey = getStorageKey(StorageKeys.LIKED_RECIPES);
      const likedIds = JSON.parse(localStorage.getItem(likedKey) || "[]");
      isLiked = likedIds.map(String).includes(String(recipe.id));
    } catch {}

    let isSaved = false;
    try {
      const savedKey = getStorageKey(StorageKeys.SAVED_RECIPES);
      const savedRecipes = JSON.parse(localStorage.getItem(savedKey) || "[]");
      isSaved = savedRecipes.some((r) => String(r.id) === String(recipe.id));
    } catch {}

    const userId = getUserId();
    const description = recipe.description || "";
    const calories = recipe.calories || 0;
    const hasImage =
      recipe.image &&
      (recipe.image.startsWith("data:image/") ||
        recipe.image.startsWith("http"));

    card.innerHTML = `
            <div class="recipe-image">
                ${
                  hasImage
                    ? `<img src="${recipe.image}" alt="${recipe.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                    : ""
                }
            </div>
            <div class="recipe-info">
                <h3 class="recipe-name">${recipe.name}</h3>
                ${
                  description
                    ? `<p class="recipe-description">${description}</p>`
                    : ""
                }
                <div class="recipe-meta">
                    <div class="recipe-meta-right">
                        <div class="recipe-calories">
                            <i class="fas fa-fire"></i>
                            <span>${calories} cal</span>
                        </div>
                        <div class="recipe-time">
                            <i class="far fa-clock"></i>
                            <span>${recipe.time}</span>
                        </div>
                    </div>
                </div>
                <div class="recipe-actions">
                    ${
                      userId !== "guest"
                        ? `
                    <button class="recipe-action-btn btn-like ${
                      isLiked ? "liked" : ""
                    }" 
                            title="${isLiked ? "Liked" : "Like"}" 
                            aria-label="${isLiked ? "Liked" : "Like"}" 
                            data-recipe-id="${recipe.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="recipe-action-btn btn-save ${
                      isSaved ? "saved" : ""
                    }" 
                            title="${isSaved ? "Saved" : "Save"}" 
                            aria-label="${isSaved ? "Saved" : "Save"}" 
                            data-recipe-id="${recipe.id}">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    `
                        : ""
                    }
                    <button class="recipe-action-btn btn-share" 
                            title="Share" 
                            aria-label="Share" 
                            data-recipe-id="${recipe.id}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        `;
    return card;
  }

  shareRecipe(button) {
    const recipeId = button.dataset.recipeId;
    const recipe = this.recipes.find((r) => r.id == recipeId);

    if (!recipe) return;

    const recipeUrl = window.location.href.split("#")[0] + `#recipe-view`;
    const recipeText = `Check out this recipe: ${recipe.name}`;

    if (navigator.share) {
      navigator
        .share({
          title: recipe.name,
          text: recipeText,
          url: recipeUrl,
        })
        .catch((err) => {
          this.copyRecipeLink(recipeUrl);
        });
    } else {
      this.copyRecipeLink(recipeUrl);
    }
  }

  copyRecipeLink(url) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alertManager.success("Recipe link copied to clipboard!");
      })
      .catch(() => {
        alertManager.info(`Recipe link: ${url}`);
      });
  }

  async saveRecipe(button) {
    const userId = getUserId();
    if (userId === "guest") {
      alertManager.info("Please log in to save recipes.");
      return;
    }

    const recipeId = button.dataset.recipeId;
    const recipe = this.recipes.find((r) => r.id == recipeId);

    if (!recipe) return;

    const isSaving = !button.classList.contains("saved");
    button.classList.toggle("saved");
    button.setAttribute("aria-label", isSaving ? "Saved" : "Save");
    button.setAttribute("title", isSaving ? "Saved" : "Save");

    if (userId !== "guest") {
      try {
        let finalRecipeId = recipeId;

        if (isSaving) {
          const response = await ApiService.saveRecipe(recipeId, recipe);
          if (response.savedRecipeId) {
            finalRecipeId = response.savedRecipeId;
            if (response.savedRecipeId !== recipeId) {
              recipe.id = response.savedRecipeId;
              recipe._id = response.savedRecipeId;
              button.dataset.recipeId = response.savedRecipeId;
            }
          }
          alertManager.success(`Saved to My Recipes.`);
        } else {
          await ApiService.unsaveRecipe(finalRecipeId);
          alertManager.success(`Removed from My Recipes.`);
        }

        document.dispatchEvent(
          new CustomEvent(isSaving ? "recipeSaved" : "recipeUnsaved", {
            detail: { recipeId: String(finalRecipeId), recipe: recipe },
          })
        );
      } catch (error) {
        console.error("Error saving recipe: ", error);

        button.classList.toggle("saved");
        button.setAttribute("aria-label", isSaving ? "Save" : "Saved");
        button.setAttribute("title", isSaving ? "Save" : "Saved");
      }
    }
  }

  async toggleLike(button) {
    const userId = getUserId();
    if (userId === "guest") {
      alertManager.info("Please log in to like recipes.");
      return;
    }

    const recipeId = String(button.dataset.recipeId);
    const recipe = this.recipes.find((r) => String(r.id) === String(recipeId));

    if (!recipe) {
      console.error("Recipe not found for ID:", recipeId);
      return;
    }

    const isLiking = !button.classList.contains("liked");
    button.classList.toggle("liked");
    button.setAttribute("aria-pressed", isLiking ? "true" : "false");
    button.setAttribute("title", isLiking ? "Liked" : "Like");

    try {
      let finalRecipeId = recipeId;

      if (isLiking) {
        const response = await ApiService.likeRecipe(recipeId, recipe);
        if (response.likedRecipeId) {
          finalRecipeId = response.likedRecipeId;
          if (response.likedRecipeId !== recipeId) {
            recipe.id = response.likedRecipeId;
            recipe._id = response.likedRecipeId;
            button.dataset.recipeId = response.likedRecipeId;
          }
        }
      } else {
        await ApiService.unlikeRecipe(finalRecipeId);
      }

      document.dispatchEvent(
        new CustomEvent(isLiking ? "recipeLiked" : "recipeUnliked", {
          detail: { recipeId: finalRecipeId, recipe: recipe },
        })
      );
    } catch (error) {
      button.classList.toggle("liked");
      button.setAttribute("aria-pressed", isLiking ? "false" : "true");
      button.setAttribute("title", isLiking ? "Like" : "Liked");

      console.error("Error liking recipe: ", error);
      alertManager.error("Failed to like recipe. Please try again.");
    }
  }

  async viewRecipe(button) {
    const recipeCard = button.closest(".recipe-card");
    const recipeName = recipeCard.querySelector(".recipe-name").textContent;
    const recipe = this.recipes.find((r) => r.name === recipeName);

    if (recipe) {
      try {
        const response = await ApiService.getRecipe(recipe.id);
        if (response && response.recipe) {
          const detailedRecipe = this.createDetailedRecipeFromDB(
            response.recipe
          );
          const event = new CustomEvent("viewRecipe", {
            detail: { recipe: detailedRecipe },
          });
          document.dispatchEvent(event);
        } else {
          const detailedRecipe = this.createDetailedRecipe(recipe);
          const event = new CustomEvent("viewRecipe", {
            detail: { recipe: detailedRecipe },
          });
          document.dispatchEvent(event);
        }
      } catch (error) {
        console.error("Error fetching recipe details:", error);
        const detailedRecipe = this.createDetailedRecipe(recipe);
        const event = new CustomEvent("viewRecipe", {
          detail: { recipe: detailedRecipe },
        });
        document.dispatchEvent(event);
      }
    }
  }

  async viewRecipeById(recipeId) {
    const recipe = this.recipes.find((r) => String(r.id) === String(recipeId));
    if (recipe) {
      try {
        const response = await ApiService.getRecipe(recipeId);
        if (response && response.recipe) {
          const detailedRecipe = this.createDetailedRecipeFromDB(
            response.recipe
          );
          const event = new CustomEvent("viewRecipe", {
            detail: { recipe: detailedRecipe },
          });
          document.dispatchEvent(event);
        } else {
          const detailedRecipe = this.createDetailedRecipe(recipe);
          const event = new CustomEvent("viewRecipe", {
            detail: { recipe: detailedRecipe },
          });
          document.dispatchEvent(event);
        }
      } catch (error) {
        console.error("Error fetching recipe details:", error);
        const detailedRecipe = this.createDetailedRecipe(recipe);
        const event = new CustomEvent("viewRecipe", {
          detail: { recipe: detailedRecipe },
        });
        document.dispatchEvent(event);
      }
    }
  }

  surpriseMe() {
    if (this.filteredRecipes.length === 0) {
      alertManager.info("No recipes available. Try adjusting your filters.");
      return;
    }
    const randomRecipe =
      this.filteredRecipes[
        Math.floor(Math.random() * this.filteredRecipes.length)
      ];
    this.viewRecipeById(randomRecipe.id);
  }

  updateRecipeCardState(recipeId, state, isActive) {
    const cards = document.querySelectorAll(`.recipe-card`);
    if (!cards || cards.length === 0) return;

    cards.forEach((card) => {
      const buttons = card.querySelectorAll(
        `.btn-${
          state === "saved" ? "save" : "like"
        }[data-recipe-id="${recipeId}"]`
      );
      if (!buttons || buttons.length === 0) return;

      buttons.forEach((button) => {
        if (state === "saved") {
          if (isActive) {
            button.classList.add("saved");
            button.setAttribute("title", "Saved");
            button.setAttribute("aria-label", "Saved");
          } else {
            button.classList.remove("saved");
            button.setAttribute("title", "Save");
            button.setAttribute("aria-label", "Save");
          }
        } else if (state === "liked") {
          if (isActive) {
            button.classList.add("liked");
            button.setAttribute("title", "Liked");
            button.setAttribute("aria-label", "Liked");
            button.setAttribute("aria-pressed", "true");
          } else {
            button.classList.remove("liked");
            button.setAttribute("title", "Like");
            button.setAttribute("aria-label", "Like");
            button.setAttribute("aria-pressed", "false");
          }
        }
      });
    });
  }

  setupMegaMenu() {
    const recipesButton = document.querySelector(
      ".recipes-mega-menu-container .nav-btn.dropdown-toggle"
    );
    const megaMenu = document.querySelector(".recipes-mega-menu");
    const megaMenuContainer = document.querySelector(
      ".recipes-mega-menu-container"
    );
    const megaMenuItems = document.querySelectorAll(".mega-menu-item");
    const megaMenuSections = document.querySelectorAll(".mega-menu-section");

    if (recipesButton && megaMenu) {
      recipesButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        megaMenuContainer.classList.toggle("menu-open");
      });
    }

    document.addEventListener("click", (e) => {
      if (megaMenuContainer && !megaMenuContainer.contains(e.target)) {
        megaMenuContainer.classList.remove("menu-open");
      }
    });

    if (megaMenu) {
      megaMenu.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    megaMenuItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        megaMenuItems.forEach((i) => i.classList.remove("active"));

        item.classList.add("active");

        const sectionId = item.getAttribute("data-section");
        if (sectionId) {
          megaMenuSections.forEach((section) =>
            section.classList.remove("active")
          );

          const targetSection = document.getElementById(`${sectionId}-section`);
          if (targetSection) {
            targetSection.classList.add("active");
          }
        }
      });
    });
  }

  setupIngredientsMegaMenu() {
    const ingredientsButton = document.querySelector(
      ".ingredients-mega-menu-container .nav-btn.dropdown-toggle"
    );
    const megaMenu = document.querySelector(".ingredients-mega-menu");
    const megaMenuContainer = document.querySelector(
      ".ingredients-mega-menu-container"
    );
    const megaMenuItems = document.querySelectorAll(
      ".ingredients-mega-menu .mega-menu-item"
    );
    const megaMenuSections = document.querySelectorAll(
      ".ingredients-mega-menu .mega-menu-section"
    );

    if (ingredientsButton && megaMenu) {
      ingredientsButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        megaMenuContainer.classList.toggle("menu-open");
      });
    }

    document.addEventListener("click", (e) => {
      if (megaMenuContainer && !megaMenuContainer.contains(e.target)) {
        megaMenuContainer.classList.remove("menu-open");
      }
    });

    if (megaMenu) {
      megaMenu.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    megaMenuItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        megaMenuItems.forEach((i) => i.classList.remove("active"));

        item.classList.add("active");

        const sectionId = item.getAttribute("data-section");
        if (sectionId) {
          megaMenuSections.forEach((section) =>
            section.classList.remove("active")
          );

          const targetSection = document.getElementById(`${sectionId}-section`);
          if (targetSection) {
            targetSection.classList.add("active");
          }
        }
      });
    });
  }

  setupOccasionsMegaMenu() {
    const occasionsButton = document.querySelector(
      ".occasions-mega-menu-container .nav-btn.dropdown-toggle"
    );
    const megaMenu = document.querySelector(".occasions-mega-menu");
    const megaMenuContainer = document.querySelector(
      ".occasions-mega-menu-container"
    );

    if (occasionsButton && megaMenu) {
      occasionsButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        megaMenuContainer.classList.toggle("menu-open");
      });
    }

    document.addEventListener("click", (e) => {
      if (megaMenuContainer && !megaMenuContainer.contains(e.target)) {
        megaMenuContainer.classList.remove("menu-open");
      }
    });

    if (megaMenu) {
      megaMenu.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    const occasionLinks = document.querySelectorAll(
      ".occasions-mega-menu .mega-menu-link[data-occasion]"
    );
    occasionLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const occasion = link.getAttribute("data-occasion");
        this.selectOccasion(occasion);
        megaMenuContainer.classList.remove("menu-open");
      });
    });
  }

  setupCuisinesMegaMenu() {
    const cuisinesButton = document.querySelector(
      ".cuisines-mega-menu-container .nav-btn.dropdown-toggle"
    );
    const megaMenu = document.querySelector(".cuisines-mega-menu");
    const megaMenuContainer = document.querySelector(
      ".cuisines-mega-menu-container"
    );

    if (cuisinesButton && megaMenu) {
      cuisinesButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        megaMenuContainer.classList.toggle("menu-open");
      });
    }

    document.addEventListener("click", (e) => {
      if (megaMenuContainer && !megaMenuContainer.contains(e.target)) {
        megaMenuContainer.classList.remove("menu-open");
      }
    });

    if (megaMenu) {
      megaMenu.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    const cuisineLinks = document.querySelectorAll(
      ".cuisines-mega-menu .mega-menu-link[data-cuisine]"
    );
    cuisineLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cuisine = link.getAttribute("data-cuisine");
        this.selectCuisine(cuisine);
        megaMenuContainer.classList.remove("menu-open");
      });
    });
  }

  createDetailedRecipeFromDB(recipe) {
    const prepTimeNum = recipe.prepTime ? parseInt(recipe.prepTime) : null;
    const cookTimeNum = recipe.cookTime ? parseInt(recipe.cookTime) : null;

    const prepTime = prepTimeNum ? `${prepTimeNum} min` : recipe.time || "N/A";
    const cookTime = cookTimeNum ? `${cookTimeNum} min` : recipe.time || "N/A";
    const totalTime =
      prepTimeNum !== null && cookTimeNum !== null
        ? `${prepTimeNum + cookTimeNum} min`
        : recipe.time || "N/A";

    const servings = recipe.servings || 4;

    const nutrition = {
      calories: recipe.calories || 0,
      protein: recipe.protein ? `${recipe.protein}g` : "N/A",
      carbs: recipe.carbs ? `${recipe.carbs}g` : "N/A",
      fat: recipe.fat ? `${recipe.fat}g` : "N/A",
      fiber: recipe.fiber ? `${recipe.fiber}g` : "N/A",
      sugar: recipe.sugar ? `${recipe.sugar}g` : "N/A",
      sodium: recipe.sodium ? `${recipe.sodium}mg` : "N/A",
    };

    return {
      id: recipe._id || recipe.id,
      name: recipe.name || "(FOOD TITLE)",
      description: recipe.description || "(FOOD DESCRIPTION)",
      author: "FitFuel User",
      lastUpdated: recipe.updatedAt
        ? new Date(recipe.updatedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : recipe.createdAt
        ? new Date(recipe.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "December 2024",
      prepTime: prepTime,
      cookTime: cookTime,
      totalTime: totalTime,
      servings: servings.toString(),
      serves: servings.toString(),
      ingredients: recipe.ingredients || [],
      directions: recipe.steps || [],
      notes: recipe.notes || "",
      nutrition: nutrition,
      image: recipe.image || null,
    };
  }

  createDetailedRecipe(recipe) {
    const detailedRecipes = {
      "Chicken Burrito Bowl": {
        name: "Chicken Burrito Bowl",
        description:
          "A healthy and delicious burrito bowl with seasoned chicken, rice, and fresh vegetables",
        author: "Chef Maria",
        lastUpdated: "December 15, 2024",
        prepTime: "15 min",
        cookTime: "25 min",
        totalTime: "40 min",
        servings: "4",
        serves: "4",
        rating: 4.7,
        ingredients: [
          "2 lbs boneless chicken breast, diced",
          "1 cup brown rice",
          "1 can (15 oz) black beans, drained and rinsed",
          "1 cup corn kernels",
          "1 red bell pepper, diced",
          "1 avocado, sliced",
          "1/4 cup cilantro, chopped",
          "2 tbsp olive oil",
          "1 tbsp taco seasoning",
          "1 tsp salt",
          "1/2 tsp black pepper",
        ],
        directions: [
          "Cook brown rice according to package instructions",
          "Season chicken with taco seasoning, salt, and pepper",
          "Heat olive oil in a large skillet over medium-high heat",
          "Cook chicken for 6-8 minutes until golden and cooked through",
          "Warm black beans and corn in a separate pan",
          "Dice the red bell pepper and slice the avocado",
          "Assemble bowls with rice, chicken, beans, corn, bell pepper, and avocado",
          "Garnish with fresh cilantro and serve immediately",
        ],
        notes:
          "This recipe is perfect for meal prep! Store components separately and assemble when ready to eat. The chicken can be made ahead and reheated.",
        nutrition: {
          calories: 520,
          protein: "35g",
          carbs: "45g",
          fat: "18g",
          fiber: "8g",
          sugar: "6g",
          sodium: "680mg",
        },
      },
      "Veggie Omelet": {
        name: "Veggie Omelet",
        description: "Fluffy omelet packed with fresh vegetables and herbs",
        author: "Chef Sarah",
        lastUpdated: "December 10, 2024",
        prepTime: "10 min",
        cookTime: "8 min",
        totalTime: "18 min",
        servings: "2",
        serves: "2",
        rating: 4.5,
        ingredients: [
          "4 large eggs",
          "1/4 cup diced bell peppers",
          "1/4 cup diced onions",
          "1/4 cup diced tomatoes",
          "1/4 cup spinach, chopped",
          "2 tbsp fresh herbs (parsley, chives)",
          "2 tbsp olive oil",
          "1/2 tsp salt",
          "1/4 tsp black pepper",
          "1/4 cup shredded cheese (optional)",
        ],
        directions: [
          "Heat olive oil in a non-stick skillet over medium heat",
          "Add diced vegetables and sauté for 3-4 minutes until tender",
          "Beat eggs in a bowl with salt and pepper",
          "Pour eggs over vegetables in the skillet",
          "Cook for 2-3 minutes until edges start to set",
          "Add cheese and herbs if using",
          "Fold omelet in half and cook for another minute",
          "Serve immediately with fresh herbs on top",
        ],
        notes:
          "For best results, use a non-stick pan and don't over-stir the eggs. Let them set naturally for a fluffy texture.",
        nutrition: {
          calories: 320,
          protein: "22g",
          carbs: "8g",
          fat: "24g",
          fiber: "2g",
          sugar: "4g",
          sodium: "420mg",
        },
      },
    };

    return (
      detailedRecipes[recipe.name] || {
        ...recipe,
        author: "FitFuel Community",
        lastUpdated: "December 2024",
        prepTime: "10 min",
        cookTime: "15 min",
        totalTime: "25 min",
        servings: "2",
        serves: "2",
        rating: 4.0,
        ingredients: recipe.ingredients || ["Recipe ingredients not available"],
        directions: recipe.steps || ["Recipe directions not available"],
        notes: "This is a sample recipe from our collection.",
        nutrition: {
          calories: recipe.calories,
          protein: "N/A",
          carbs: "N/A",
          fat: "N/A",
          fiber: "N/A",
          sugar: "N/A",
          sodium: "N/A",
        },
        image: recipe.image || null,
      }
    );
  }

  addRecipe(newRecipe) {
    this.recipes.unshift(newRecipe);

    this.filteredRecipes = [...this.recipes];

    this.renderRecipes();
  }
}
