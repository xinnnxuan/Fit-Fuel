class RecipeViewManager {
  constructor() {
    this.currentRecipe = null;
    this.originalIngredients = [];
    this.wakeLock = null;
    this.isCookModeActive = false;
    this.isMetricUnits = false;
    this.initializeEventListeners();
  }

  _clearAuthAndUpdateUI() {
    ApiService.setToken(null);
    window.currentUserId = "guest";
    if (window.navigationManager) {
      window.navigationManager.updateNavigation();
    }
  }

  async _ensureAuthenticated() {
    const token = ApiService.getToken();
    if (!token) {
      return false;
    }

    let userId = getUserId();
    if (userId === "guest" || !userId) {
      try {
        const userResponse = await ApiService.getCurrentUser();
        if (userResponse && userResponse.user) {
          userId = userResponse.user.id || userResponse.user._id;
          window.currentUserId = userId;
          return true;
        } else {
          this._clearAuthAndUpdateUI();
          return false;
        }
      } catch (error) {
        this._clearAuthAndUpdateUI();
        return false;
      }
    }
    return true;
  }

  _getRecipeId() {
    let recipeId = this.currentRecipe?.id;
    if (!recipeId && window.recipesManager && this.currentRecipe) {
      const recipe = window.recipesManager.recipes.find(
        (r) => r.name === this.currentRecipe.name
      );
      if (recipe) recipeId = recipe.id;
    }
    return recipeId;
  }

  initializeEventListeners() {
    document.addEventListener("viewRecipe", (event) => {
      this.showRecipe(event.detail.recipe);
    });

    let signInTimeout;
    document.addEventListener("userSignedIn", async () => {
      clearTimeout(signInTimeout);
      signInTimeout = setTimeout(async () => {
        await this.updateActionButtonsVisibility();
      }, 300);
    });

    let signOutTimeout;
    document.addEventListener("userSignedOut", async () => {
      clearTimeout(signOutTimeout);
      signOutTimeout = setTimeout(async () => {
        await this.updateActionButtonsVisibility();
      }, 200);
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".toggle-switch")) {
        this.toggleCookMode();
      } else if (e.target.classList.contains("unit-btn")) {
        this.selectUnit(e.target);
      } else if (e.target.classList.contains("yield-btn")) {
        this.selectYieldMultiplier(e.target);
      } else if (e.target.closest(".action-icon")) {
        const actionIcon = e.target.closest(".action-icon");
        this.handleActionIconClick(actionIcon, e);
      }
    });

    document.addEventListener("recipeSaved", (e) => {
      if (
        this.currentRecipe &&
        String(this.currentRecipe.id) === String(e.detail.recipeId)
      ) {
        const saveBtn = document.getElementById("recipe-view-save-btn");
        if (saveBtn && !saveBtn.classList.contains("saved")) {
          saveBtn.classList.add("saved");
          saveBtn.setAttribute("title", "Saved");
        }
      }
    });

    document.addEventListener("recipeUnsaved", (e) => {
      if (
        this.currentRecipe &&
        String(this.currentRecipe.id) === String(e.detail.recipeId)
      ) {
        const saveBtn = document.getElementById("recipe-view-save-btn");
        if (saveBtn && saveBtn.classList.contains("saved")) {
          saveBtn.classList.remove("saved");
          saveBtn.setAttribute("title", "Save");
        }
      }
    });

    document.addEventListener("recipeLiked", (e) => {
      if (
        this.currentRecipe &&
        String(this.currentRecipe.id) === String(e.detail.recipeId)
      ) {
        const likeBtn = document.getElementById("recipe-view-like-btn");
        if (likeBtn && !likeBtn.classList.contains("liked")) {
          likeBtn.classList.add("liked");
          likeBtn.setAttribute("title", "Liked");
        }
      }
    });

    document.addEventListener("recipeUnliked", (e) => {
      if (
        this.currentRecipe &&
        String(this.currentRecipe.id) === String(e.detail.recipeId)
      ) {
        const likeBtn = document.getElementById("recipe-view-like-btn");
        if (likeBtn && likeBtn.classList.contains("liked")) {
          likeBtn.classList.remove("liked");
          likeBtn.setAttribute("title", "Like");
        }
      }
    });
  }

  showRecipe(recipe) {
    this.currentRecipe = recipe;
    this.populateRecipeData(recipe);
    this.showRecipeView();
    this.updateSaveLikeState();
    setTimeout(async () => {
      await this.updateActionButtonsVisibility();
    }, 300);
  }

  async updateActionButtonsVisibility() {
    if (this._updatingButtons) return;
    this._updatingButtons = true;

    let userId = getUserId();
    let hasToken = ApiService.getToken();

    const saveBtn = document.getElementById("recipe-view-save-btn");
    const likeBtn = document.getElementById("recipe-view-like-btn");

    if (!saveBtn || !likeBtn) {
      this._updatingButtons = false;
      return;
    }

    if (!hasToken) {
      hasToken = localStorage.getItem("fitfuel_token");
    }

    hasToken = !!hasToken;

    if ((!userId || userId === "guest") && hasToken) {
      try {
        const response = await ApiService.getCurrentUser();
        if (response && response.user) {
          userId = response.user.id || response.user._id;
          window.currentUserId = userId;
        } else {
          userId = "guest";
          window.currentUserId = "guest";
          ApiService.setToken(null);
        }
      } catch (error) {
        userId = "guest";
        window.currentUserId = "guest";
        ApiService.setToken(null);
      }
    }

    this._updatingButtons = false;

    const actionSidebar = document.querySelector(".action-sidebar");

    const printBtn = actionSidebar
      ? Array.from(actionSidebar.children).find((btn) =>
          btn.querySelector("i.fa-print")
        )
      : null;

    if (actionSidebar) {
      const desiredOrder = [likeBtn, saveBtn, printBtn].filter((btn) => btn);

      desiredOrder.forEach((btn, index) => {
        if (btn && btn.parentNode === actionSidebar) {
          const currentChildren = Array.from(actionSidebar.children);
          const currentIndex = currentChildren.indexOf(btn);
          const targetIndex = index;

          if (currentIndex !== targetIndex) {
            if (targetIndex === 0) {
              actionSidebar.insertBefore(btn, actionSidebar.firstChild);
            } else {
              const previousBtn = desiredOrder[targetIndex - 1];
              if (previousBtn && previousBtn.parentNode === actionSidebar) {
                const nextSibling = previousBtn.nextSibling;
                if (nextSibling !== btn) {
                  actionSidebar.insertBefore(btn, nextSibling);
                }
              } else {
                const targetNode = currentChildren[targetIndex];
                if (targetNode && targetNode !== btn) {
                  actionSidebar.insertBefore(btn, targetNode);
                }
              }
            }
          }
        }
      });
    }

    let shareBtn = document.getElementById("recipe-view-share-btn");
    if (!shareBtn && actionSidebar) {
      shareBtn = document.createElement("div");
      shareBtn.className = "action-icon btn-share-recipe";
      shareBtn.id = "recipe-view-share-btn";
      shareBtn.title = "Share";
      shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
      actionSidebar.appendChild(shareBtn);
    }

    if (shareBtn && actionSidebar) {
      if (shareBtn.parentNode === actionSidebar) {
        const lastChild = actionSidebar.lastChild;
        if (shareBtn !== lastChild) {
          actionSidebar.appendChild(shareBtn);
        }
      }
    }

    const isAuthenticated = !!(userId && userId !== "guest" && hasToken);

    if (!isAuthenticated) {
      if (saveBtn) {
        saveBtn.style.setProperty("visibility", "hidden", "important");
        saveBtn.style.setProperty("pointer-events", "none", "important");
        saveBtn.style.setProperty("opacity", "0", "important");
        saveBtn.style.setProperty("display", "none", "important");
      }
      if (likeBtn) {
        likeBtn.style.setProperty("visibility", "hidden", "important");
        likeBtn.style.setProperty("pointer-events", "none", "important");
        likeBtn.style.setProperty("opacity", "0", "important");
        likeBtn.style.setProperty("display", "none", "important");
      }

      if (shareBtn) {
        shareBtn.style.setProperty("display", "flex", "important");
        shareBtn.style.setProperty("visibility", "visible", "important");
        shareBtn.style.setProperty("pointer-events", "auto", "important");
        shareBtn.style.setProperty("opacity", "1", "important");
        shareBtn.removeAttribute("hidden");
      }
    } else {
      if (saveBtn) {
        saveBtn.style.setProperty("display", "flex", "important");
        saveBtn.style.setProperty("visibility", "visible", "important");
        saveBtn.style.setProperty("pointer-events", "auto", "important");
        saveBtn.style.setProperty("opacity", "1", "important");
        saveBtn.removeAttribute("hidden");
      }
      if (likeBtn) {
        likeBtn.style.setProperty("display", "flex", "important");
        likeBtn.style.setProperty("visibility", "visible", "important");
        likeBtn.style.setProperty("pointer-events", "auto", "important");
        likeBtn.style.setProperty("opacity", "1", "important");
        likeBtn.removeAttribute("hidden");
      }

      if (shareBtn) {
        shareBtn.style.setProperty("display", "flex", "important");
        shareBtn.style.setProperty("visibility", "visible", "important");
        shareBtn.style.setProperty("pointer-events", "auto", "important");
        shareBtn.style.setProperty("opacity", "1", "important");
        shareBtn.removeAttribute("hidden");
      }
    }
  }

  populateRecipeData(recipe) {
    console.log("Populating recipe data:", recipe);
    console.log("Recipe image:", recipe.image);

    const recipeTitle = document.getElementById("recipe-title");
    if (recipeTitle) recipeTitle.textContent = recipe.name || "(FOOD TITLE)";

    const recipeDescription = document.getElementById("recipe-description");
    if (recipeDescription)
      recipeDescription.textContent =
        recipe.description || "(FOOD DESCRIPTION)";

    const recipeAuthor = document.getElementById("recipe-author");
    if (recipeAuthor) recipeAuthor.textContent = recipe.author || "(AUTHOR)";

    const recipeDate = document.getElementById("recipe-date");
    if (recipeDate)
      recipeDate.textContent = recipe.lastUpdated || "(MONTH DAY, YEAR)";

    const prepTime = document.getElementById("prep-time");
    if (prepTime) prepTime.textContent = recipe.prepTime || "(VALUE)";

    const cookTime = document.getElementById("cook-time");
    if (cookTime) cookTime.textContent = recipe.cookTime || "(VALUE)";

    const totalTime = document.getElementById("total-time");
    if (totalTime) totalTime.textContent = recipe.totalTime || "(VALUE)";

    const servings = document.getElementById("servings");
    if (servings)
      servings.textContent = recipe.servings || recipe.serves || "(UNIT)";

    const originalServings = document.getElementById("original-servings");
    if (originalServings)
      originalServings.textContent = recipe.servings || recipe.serves || "4";

    const recipeImageContainer = document.querySelector(".recipe-image");
    if (recipeImageContainer) {
      recipeImageContainer.style.display = "block";
      let imageSrc = null;

      console.log("Full recipe object:", recipe);
      console.log("Recipe image property:", recipe.image);
      console.log("Recipe image type:", typeof recipe.image);

      if (recipe.image) {
        if (Array.isArray(recipe.image) && recipe.image.length > 0) {
          imageSrc = recipe.image[0];
          console.log("Image from array:", imageSrc ? "Found" : "Not found");
        } else if (typeof recipe.image === "string") {
          imageSrc = recipe.image;
          console.log("Image from string, length:", imageSrc.length);
        }
      } else {
        console.warn("Recipe.image is falsy:", recipe.image);
      }

      if (imageSrc && typeof imageSrc === "string" && imageSrc.trim()) {
        const originalSrc = imageSrc;

        if (
          !imageSrc.startsWith("data:image/") &&
          !imageSrc.startsWith("http://") &&
          !imageSrc.startsWith("https://")
        ) {
          imageSrc = `data:image/jpeg;base64,${imageSrc}`;
          console.log("Added data URL prefix. New length:", imageSrc.length);
        } else {
          console.log("Image already has proper prefix");
        }

        recipeImageContainer.innerHTML = "";
        recipeImageContainer.style.backgroundColor = "#f5f5f5";
        recipeImageContainer.style.position = "relative";
        recipeImageContainer.style.zIndex = "1";
        recipeImageContainer.style.width = "100%";
        recipeImageContainer.style.maxWidth = "600px";
        recipeImageContainer.style.height = "300px";
        recipeImageContainer.style.minHeight = "300px";
        recipeImageContainer.style.display = "block";
        recipeImageContainer.style.overflow = "hidden";

        const img = document.createElement("img");
        img.src = imageSrc;
        img.alt = recipe.name || "Recipe";
        img.style.cssText =
          "width: 100% !important; height: 100% !important; min-width: 100% !important; min-height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: cover !important; border-radius: 8px !important; display: block !important; position: relative !important; z-index: 10 !important; visibility: visible !important; opacity: 1 !important; background: transparent !important;";

        img.onerror = function (e) {
          console.error("Image failed to load!");
          console.error("Error event:", e);
          console.error("Image src length:", imageSrc.length);
          console.error(
            "Image src first 200 chars:",
            imageSrc.substring(0, 200)
          );
          console.error(
            "Original src first 200 chars:",
            originalSrc.substring(0, 200)
          );
          recipeImageContainer.innerHTML =
            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">No image available</div>';
          recipeImageContainer.style.backgroundColor = "#f5f5f5";
        };

        img.onload = function () {
          console.log("✅ Recipe image loaded successfully!");
          console.log("Image element:", img);
          console.log("Image src:", img.src.substring(0, 100) + "...");
          console.log(
            "Image dimensions:",
            img.naturalWidth,
            "x",
            img.naturalHeight
          );
          console.log("Image computed style:", window.getComputedStyle(img));
          console.log(
            "Container computed style:",
            window.getComputedStyle(recipeImageContainer)
          );
          console.log(
            "Container offsetWidth:",
            recipeImageContainer.offsetWidth
          );
          console.log(
            "Container offsetHeight:",
            recipeImageContainer.offsetHeight
          );
          console.log(
            "Container getBoundingClientRect:",
            recipeImageContainer.getBoundingClientRect()
          );
          recipeImageContainer.style.backgroundColor = "transparent";
        };

        recipeImageContainer.appendChild(img);
        console.log(
          "Image appended to container. Container children:",
          recipeImageContainer.children.length
        );
        console.log(
          "Image element in DOM:",
          document.querySelector(".recipe-image img")
        );

        setTimeout(() => {
          const imgInDOM = recipeImageContainer.querySelector("img");
          if (imgInDOM) {
            console.log("Image found in DOM after append");
            console.log("Image offsetWidth:", imgInDOM.offsetWidth);
            console.log("Image offsetHeight:", imgInDOM.offsetHeight);
            console.log(
              "Image getBoundingClientRect:",
              imgInDOM.getBoundingClientRect()
            );
          } else {
            console.error("Image NOT found in DOM after append!");
          }
        }, 100);
      } else {
        console.warn("❌ Recipe has no valid image");
        console.warn("Recipe keys:", Object.keys(recipe));
        console.warn("Recipe image value:", recipe.image);
        recipeImageContainer.innerHTML =
          '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">No image available</div>';
        recipeImageContainer.style.backgroundColor = "#f5f5f5";
      }
    } else {
      console.error("❌ Recipe image container not found in DOM");
    }

    const ingredientsList = document.getElementById("ingredients-list");
    if (ingredientsList) {
      ingredientsList.innerHTML = "";
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        this.originalIngredients = [...recipe.ingredients];

        recipe.ingredients.forEach((ingredient) => {
          const li = document.createElement("li");
          li.textContent = ingredient;
          ingredientsList.appendChild(li);
        });
      }
    }

    const directionsList = document.getElementById("directions-list");
    if (directionsList) {
      directionsList.innerHTML = "";
      if (recipe.directions && recipe.directions.length > 0) {
        recipe.directions.forEach((step) => {
          const li = document.createElement("li");
          li.textContent = step;
          directionsList.appendChild(li);
        });
      } else if (recipe.steps && recipe.steps.length > 0) {
        recipe.steps.forEach((step) => {
          const li = document.createElement("li");
          li.textContent = step;
          directionsList.appendChild(li);
        });
      }
    }

    const notesText = document.getElementById("notes-text");
    if (notesText) notesText.textContent = recipe.notes || "";

    const nutritionContent = document.getElementById("nutrition-content");
    if (nutritionContent && recipe.nutrition) {
      nutritionContent.innerHTML = this.formatNutritionFacts(recipe.nutrition);
    } else if (nutritionContent) {
      nutritionContent.innerHTML =
        "<p>Nutrition information not available.</p>";
    }

    this.updateUnitDisplay();

    this.updateIngredientsForYield(1);
  }

  formatNutritionFacts(nutrition) {
    let html = '<div class="nutrition-grid">';

    if (nutrition.calories) {
      html += `<div class="nutrition-item"> <strong>Calories: < /strong> ${nutrition.calories}< /div>`;
    }
    if (nutrition.protein) {
      html += `<div class="nutrition-item"> <strong>Protein: < /strong> ${nutrition.protein}g< /div>`;
    }
    if (nutrition.carbs) {
      html += `<div class="nutrition-item"> <strong>Carbs: < /strong> ${nutrition.carbs}g< /div>`;
    }
    if (nutrition.fat) {
      html += `<div class="nutrition-item"> <strong>Fat: < /strong> ${nutrition.fat}g< /div>`;
    }
    if (nutrition.fiber) {
      html += `<div class="nutrition-item"> <strong>Fiber: < /strong> ${nutrition.fiber}g< /div>`;
    }
    if (nutrition.sugar) {
      html += `<div class="nutrition-item"> <strong>Sugar: < /strong> ${nutrition.sugar}g< /div>`;
    }
    if (nutrition.sodium) {
      html += `<div class="nutrition-item"> <strong>Sodium: < /strong> ${nutrition.sodium}mg< /div>`;
    }

    html += "< /div>";
    return html;
  }

  showRecipeView() {
    const sections = document.querySelectorAll("section");
    sections.forEach((section) => {
      section.style.display = "none";
    });

    const recipeViewSection = document.getElementById("recipe-view");
    if (recipeViewSection) {
      recipeViewSection.style.display = "block";
      recipeViewSection.scrollIntoView({ behavior: "smooth" });
      setTimeout(async () => {
        await this.updateActionButtonsVisibility();
      }, 300);
    }
  }

  async toggleCookMode() {
    const toggleIcon = document.querySelector(".toggle-switch i");

    if (this.isCookModeActive) {
      await this.releaseWakeLock();
      this.isCookModeActive = false;
      toggleIcon.className = "fas fa-toggle-off";
    } else {
      const success = await this.requestWakeLock();
      if (success) {
        this.isCookModeActive = true;
        toggleIcon.className = "fas fa-toggle-on";
      } else {
        alert(
          "Cook mode requires screen wake lock permission. Please allow it in your browser settings."
        );
      }
    }
  }

  async requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        this.wakeLock = await navigator.wakeLock.request("screen");

        this.wakeLock.addEventListener("release", () => {
          this.isCookModeActive = false;
          const toggleIcon = document.querySelector(".toggle-switch i");
          if (toggleIcon) {
            toggleIcon.className = "fas fa-toggle-off";
          }
        });

        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error("Error requesting wake lock: ", err);
      return false;
    }
  }

  async releaseWakeLock() {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  selectUnit(clickedButton) {
    document.querySelectorAll(".unit-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    clickedButton.classList.add("active");

    this.isMetricUnits = clickedButton.dataset.unit === "metric";

    this.updateMeasurements();
  }

  updateUnitDisplay() {
    const usButton = document.querySelector('.unit-btn[data-unit="us"]');
    const metricButton = document.querySelector(
      '.unit-btn[data-unit="metric"]'
    );

    if (usButton && metricButton) {
      usButton.classList.toggle("active", !this.isMetricUnits);
      metricButton.classList.toggle("active", this.isMetricUnits);
    }
  }

  updateMeasurements() {
    this.convertTemperatures();

    this.convertIngredientMeasurements();
  }

  convertTemperatures() {
    const tempElements = document.querySelectorAll("[data-temp]");
    tempElements.forEach((element) => {
      const temp = parseFloat(element.dataset.temp);
      if (!isNaN(temp)) {
        if (this.isMetricUnits) {
          const celsius = Math.round(((temp - 32) * 5) / 9);
          element.textContent = `${celsius}°C`;
        } else {
          const fahrenheit = Math.round((temp * 9) / 5 + 32);
          element.textContent = `${fahrenheit}°F`;
        }
      }
    });
  }

  convertIngredientMeasurements() {
    const ingredients = document.querySelectorAll("#ingredients-list li");

    if (!this.isMetricUnits) {
      ingredients.forEach((ingredient, index) => {
        if (this.originalIngredients[index]) {
          ingredient.textContent = this.originalIngredients[index];
        }
      });
    } else {
      ingredients.forEach((ingredient, index) => {
        if (this.originalIngredients[index]) {
          const originalText = this.originalIngredients[index];
          const convertedText = this.convertMeasurement(originalText);
          ingredient.textContent = convertedText;
        }
      });
    }
  }

  convertMeasurement(text) {
    const conversions = {
      cup: { to: "ml", factor: 240, type: "volume" },
      cups: { to: "ml", factor: 240, type: "volume" },
      tablespoon: { to: "ml", factor: 15, type: "volume" },
      tablespoons: { to: "ml", factor: 15, type: "volume" },
      tbsp: { to: "ml", factor: 15, type: "volume" },
      tsp: { to: "ml", factor: 5, type: "volume" },
      teaspoon: { to: "ml", factor: 5, type: "volume" },
      teaspoons: { to: "ml", factor: 5, type: "volume" },
      "fluid ounce": { to: "ml", factor: 30, type: "volume" },
      "fluid ounces": { to: "ml", factor: 30, type: "volume" },
      "fl oz": { to: "ml", factor: 30, type: "volume" },
      pint: { to: "ml", factor: 473, type: "volume" },
      pints: { to: "ml", factor: 473, type: "volume" },
      quart: { to: "ml", factor: 946, type: "volume" },
      quarts: { to: "ml", factor: 946, type: "volume" },
      gallon: { to: "l", factor: 3.8, type: "volume" },
      gallons: { to: "l", factor: 3.8, type: "volume" },

      pound: { to: "g", factor: 454, type: "weight" },
      pounds: { to: "g", factor: 454, type: "weight" },
      lb: { to: "g", factor: 454, type: "weight" },
      lbs: { to: "g", factor: 454, type: "weight" },
      ounce: { to: "g", factor: 28, type: "weight" },
      ounces: { to: "g", factor: 28, type: "weight" },
      oz: { to: "g", factor: 28, type: "weight" },

      "°F": { to: "°C", factor: "temp", type: "temp" },
      "°C": { to: "°F", factor: "temp", type: "temp" },
    };

    const liquidIngredients = [
      "oil",
      "water",
      "milk",
      "broth",
      "sauce",
      "juice",
      "vinegar",
      "wine",
      "beer",
      "cream",
      "buttermilk",
      "stock",
      "syrup",
      "honey",
      "molasses",
      "vanilla",
      "extract",
      "liqueur",
      "sherry",
      "brandy",
      "rum",
      "whiskey",
      "vodka",
    ];

    const solidIngredients = [
      "chicken",
      "beef",
      "pork",
      "fish",
      "salmon",
      "tuna",
      "shrimp",
      "crab",
      "cheese",
      "butter",
      "flour",
      "sugar",
      "salt",
      "pepper",
      "spices",
      "herbs",
      "nuts",
      "seeds",
      "chocolate",
      "cocoa",
      "powder",
      "bread",
      "crumbs",
      "vegetables",
      "onions",
      "peppers",
      "tomatoes",
      "carrots",
      "celery",
      "mushrooms",
      "spinach",
      "lettuce",
      "cabbage",
      "broccoli",
      "cauliflower",
      "potatoes",
      "sweet potatoes",
      "rice",
      "pasta",
      "noodles",
      "quinoa",
      "oats",
      "cereal",
      "granola",
      "crackers",
      "chips",
      "popcorn",
    ];

    const isLiquid = liquidIngredients.some((ingredient) =>
      text.toLowerCase().includes(ingredient)
    );
    const isSolid = solidIngredients.some((ingredient) =>
      text.toLowerCase().includes(ingredient)
    );

    let result = text;

    if (this.isMetricUnits) {
      for (const [unit, conversion] of Object.entries(conversions)) {
        const regex = new RegExp(
          `((?:\\d+\\s+)?\\d+/\\d+|\\d+(?:\\.\\d+)?)\\s*${unit}\\b`,
          "gi"
        );
        result = result.replace(regex, (match, number) => {
          let num;

          if (number.includes("/")) {
            if (number.includes(" ")) {
              const parts = number.trim().split(/\s+/);
              const wholePart = parseFloat(parts[0]) || 0;
              const fractionParts = parts[1].split("/");
              const fraction =
                parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]);
              num = wholePart + fraction;
            } else {
              const fractionParts = number.split("/");
              num = parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]);
            }
          } else {
            num = parseFloat(number);
          }

          if (conversion.factor === "temp") {
            if (unit === "°F") {
              const celsius = Math.round(((num - 32) * 5) / 9);
              return `${celsius}°C`;
            } else {
              const fahrenheit = Math.round((num * 9) / 5 + 32);
              return `${fahrenheit}°F`;
            }
          } else if (isLiquid) {
            let converted;
            if (conversion.type === "volume") {
              if (conversion.to === "l") {
                converted = num * conversion.factor;
                return `${Math.round(converted * 10) / 10}l`;
              } else {
                converted = Math.round(num * conversion.factor);
                if (converted >= 1000) {
                  const liters = Math.round((converted / 1000) * 10) / 10;
                  return `${liters}l`;
                }
                return `${converted}ml`;
              }
            } else if (conversion.type === "weight") {
              converted = Math.round(num * conversion.factor);
              if (converted >= 1000) {
                const liters = Math.round((converted / 1000) * 10) / 10;
                return `${liters}l`;
              }
              return `${converted}ml`;
            }
          } else {
            if (conversion.type === "weight") {
              const converted = Math.round(num * conversion.factor);
              if (converted >= 1000) {
                const kg = Math.round((converted / 1000) * 10) / 10;
                return `${kg}kg`;
              }
              return `${converted}g`;
            } else if (conversion.type === "volume") {
              const density = this.estimateDensity(text, unit);
              let grams;
              if (
                unit === "tsp" ||
                unit === "teaspoon" ||
                unit === "teaspoons"
              ) {
                grams = Math.round(num * 5 * density);
              } else if (
                unit === "tbsp" ||
                unit === "tablespoon" ||
                unit === "tablespoons"
              ) {
                grams = Math.round(num * 15 * density);
              } else if (unit === "cup" || unit === "cups") {
                grams = Math.round(num * density * 240);
              } else {
                grams = Math.round(num * density * 240);
              }
              if (grams < 5 && grams > 0) {
                grams = Math.max(5, Math.round(grams));
              }
              if (grams >= 1000) {
                const kg = Math.round((grams / 1000) * 10) / 10;
                return `${kg}kg`;
              }
              return `${grams}g`;
            }
          }

          return match;
        });
      }
    } else {
      const metricToUS = {
        ml: { to: "cup", factor: 1 / 240, type: "volume" },
        l: { to: "cup", factor: 1000 / 240, type: "volume" },
        g: { to: "oz", factor: 1 / 28, type: "weight" },
        kg: { to: "lb", factor: 1000 / 454, type: "weight" },
        "°C": { to: "°F", factor: "temp", type: "temp" },
      };

      for (const [unit, conversion] of Object.entries(metricToUS)) {
        const regex = new RegExp(`(\\d+(?: \\.\\d+)?)\\s*${unit}\\b`, "gi");
        result = result.replace(regex, (match, number) => {
          const num = parseFloat(number);

          if (conversion.factor === "temp") {
            const fahrenheit = Math.round((num * 9) / 5 + 32);
            return `${fahrenheit}°F`;
          } else if (conversion.type === "volume" && isLiquid) {
            let converted = num * conversion.factor;
            if (unit === "ml") {
              if (converted >= 1) {
                return `${Math.round(converted * 10) / 10} cup${
                  converted > 1 ? "s" : ""
                }`;
              } else if (converted >= 1 / 15) {
                const tbsp = Math.round(num / 15);
                return `${tbsp} tbsp`;
              } else {
                const tsp = Math.round(num / 5);
                return `${tsp} tsp`;
              }
            } else if (unit === "l") {
              if (converted >= 1) {
                return `${Math.round(converted * 10) / 10} cup${
                  converted > 1 ? "s" : ""
                }`;
              } else {
                const flOz = Math.round((num * 1000) / 30);
                return `${flOz} fl oz`;
              }
            } else {
              return `${Math.round(converted * 10) / 10} cup${
                converted > 1 ? "s" : ""
              }`;
            }
          } else if (conversion.type === "weight" && (isSolid || !isLiquid)) {
            let converted = num * conversion.factor;
            if (unit === "g") {
              if (converted >= 16) {
                const lbs = Math.round((converted / 16) * 10) / 10;
                return `${lbs} lb${lbs > 1 ? "s" : ""}`;
              } else {
                return `${Math.round(converted * 10) / 10} oz`;
              }
            } else if (unit === "kg") {
              if (converted >= 1) {
                return `${Math.round(converted * 10) / 10} lb${
                  converted > 1 ? "s" : ""
                }`;
              } else {
                const oz = Math.round(converted * 16);
                return `${oz} oz`;
              }
            } else {
              return `${Math.round(converted * 10) / 10} lb${
                converted > 1 ? "s" : ""
              }`;
            }
          } else if (conversion.type === "volume" && !isLiquid) {
            const cups = Math.round((num / 240) * 10) / 10;
            return `${cups} cup${cups > 1 ? "s" : ""}`;
          }

          return match;
        });
      }
    }

    return result;
  }

  selectYieldMultiplier(button) {
    document.querySelectorAll(".yield-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    const multiplier = parseFloat(button.dataset.multiplier);

    this.updateIngredientsForYield(multiplier);
  }

  updateIngredientsForYield(yieldMultiplier) {
    if (!this.originalIngredients || this.originalIngredients.length === 0)
      return;

    const ingredientsList = document.getElementById("ingredients-list");
    if (!ingredientsList) return;

    const ingredients = ingredientsList.querySelectorAll("li");

    ingredients.forEach((ingredient, index) => {
      if (this.originalIngredients[index]) {
        const originalText = this.originalIngredients[index];

        const scaledText = this.scaleIngredient(originalText, yieldMultiplier);

        let finalText = scaledText;
        if (this.isMetricUnits) {
          finalText = this.convertMeasurement(scaledText);
        }

        ingredient.textContent = finalText;
      }
    });
  }

  scaleIngredient(text, multiplier) {
    return text.replace(/((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)/g, (match) => {
      if (match.includes("/")) {
        let decimal;
        if (match.includes(" ")) {
          const parts = match.trim().split(/\s+/);
          const wholePart = parseFloat(parts[0]) || 0;
          const fractionParts = parts[1].split("/");
          const fraction =
            parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]);
          decimal = wholePart + fraction;
        } else {
          const fractionParts = match.split("/");
          decimal = parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]);
        }
        const scaled = decimal * multiplier;

        if (!this.isMetricUnits) {
          return this.decimalToFraction(scaled);
        } else {
          return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
        }
      } else {
        const number = parseFloat(match);
        const scaled = number * multiplier;

        if (!this.isMetricUnits) {
          return this.decimalToFraction(scaled);
        } else {
          return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
        }
      }
    });
  }

  decimalToFraction(decimal) {
    if (decimal % 1 === 0) {
      return decimal.toString();
    }

    const fractions = [
      { decimal: 0.125, fraction: "1/8" },
      { decimal: 0.25, fraction: "1/4" },
      { decimal: 0.333, fraction: "1/3" },
      { decimal: 0.375, fraction: "3/8" },
      { decimal: 0.5, fraction: "1/2" },
      { decimal: 0.625, fraction: "5/8" },
      { decimal: 0.667, fraction: "2/3" },
      { decimal: 0.75, fraction: "3/4" },
      { decimal: 0.875, fraction: "7/8" },
    ];

    for (const frac of fractions) {
      if (Math.abs(decimal - frac.decimal) < 0.001) {
        return frac.fraction;
      }
    }

    const wholePart = Math.floor(decimal);
    const fractionalPart = decimal - wholePart;

    if (wholePart > 0) {
      for (const frac of fractions) {
        if (Math.abs(fractionalPart - frac.decimal) < 0.001) {
          return `${wholePart} ${frac.fraction}`;
        }
      }
    }

    return decimal.toFixed(2).replace(/\.?0+$/, "");
  }

  estimateDensity(text, unit) {
    const lowerText = text.toLowerCase();

    if (
      this.matchesPattern(lowerText, [
        "spinach",
        "lettuce",
        "arugula",
        "kale",
        "herbs",
        "parsley",
        "cilantro",
        "basil",
        "oregano",
        "thyme",
        "rosemary",
        "spices",
        "pepper",
        "paprika",
        "cumin",
        "coriander",
      ])
    ) {
      return 0.05;
    }

    if (
      this.matchesPattern(lowerText, [
        "flour",
        "powder",
        "cocoa",
        "baking powder",
        "baking soda",
        "cornstarch",
        "sugar",
        "brown sugar",
        "powdered sugar",
      ])
    ) {
      return 0.6;
    }

    if (
      this.matchesPattern(lowerText, [
        "oats",
        "rice",
        "pasta",
        "noodles",
        "quinoa",
        "barley",
        "lentils",
        "beans",
        "chickpeas",
      ])
    ) {
      return 0.4;
    }

    if (
      this.matchesPattern(lowerText, [
        "nuts",
        "almonds",
        "walnuts",
        "pecans",
        "seeds",
        "sunflower",
        "pumpkin",
        "cheese",
        "cheddar",
        "mozzarella",
        "parmesan",
      ])
    ) {
      return 0.5;
    }

    if (
      this.matchesPattern(lowerText, [
        "chicken",
        "beef",
        "pork",
        "fish",
        "salmon",
        "tuna",
        "shrimp",
        "crab",
        "lobster",
        "potatoes",
        "sweet potatoes",
        "carrots",
        "beets",
      ])
    ) {
      return 0.8;
    }

    if (
      this.matchesPattern(lowerText, [
        "salt",
        "rock salt",
        "sea salt",
        "sugar crystals",
        "brown sugar crystals",
      ])
    ) {
      return 1.2;
    }

    if (
      this.matchesPattern(lowerText, [
        "butter",
        "cream cheese",
        "margarine",
        "shortening",
        "lard",
      ])
    ) {
      return 0.9;
    }

    if (
      this.matchesPattern(lowerText, [
        "vegetables",
        "peppers",
        "onions",
        "tomatoes",
        "cucumber",
        "zucchini",
        "eggplant",
        "mushrooms",
        "broccoli",
        "cauliflower",
        "cabbage",
      ])
    ) {
      return 0.6;
    }

    if (unit === "tsp" || unit === "teaspoon" || unit === "teaspoons") {
      return 0.8;
    } else if (
      unit === "tbsp" ||
      unit === "tablespoon" ||
      unit === "tablespoons"
    ) {
      return 0.6;
    } else {
      return 0.5;
    }
  }

  matchesPattern(text, patterns) {
    return patterns.some((pattern) => text.includes(pattern));
  }

  updateSaveLikeState() {
    if (!this.currentRecipe) return;

    const recipeId = this._getRecipeId();
    if (!recipeId) return;

    const userId = getUserId();
    const recipeIdStr = String(recipeId);

    const saveBtn = document.getElementById("recipe-view-save-btn");
    if (saveBtn) {
      try {
        const savedKey = getStorageKey(StorageKeys.SAVED_RECIPES);
        const savedRecipes = JSON.parse(localStorage.getItem(savedKey) || "[]");
        const isSaved = savedRecipes.some((r) => String(r.id) === recipeIdStr);

        if (isSaved) {
          saveBtn.classList.add("saved");
          saveBtn.setAttribute("title", "Saved");
        } else {
          saveBtn.classList.remove("saved");
          saveBtn.setAttribute("title", "Save");
        }
      } catch (e) {
        console.error("Error checking saved state: ", e);
      }
    }

    const likeBtn = document.getElementById("recipe-view-like-btn");
    if (likeBtn) {
      try {
        const likedKey = getStorageKey(StorageKeys.LIKED_RECIPES);
        const likedIds = JSON.parse(localStorage.getItem(likedKey) || "[]").map(
          String
        );
        const isLiked = likedIds.includes(recipeIdStr);

        if (isLiked) {
          likeBtn.classList.add("liked");
          likeBtn.setAttribute("title", "Liked");
        } else {
          likeBtn.classList.remove("liked");
          likeBtn.setAttribute("title", "Like");
        }
      } catch (e) {
        console.error("Error checking liked state: ", e);
      }
    }
  }

  shareRecipe() {
    if (!this.currentRecipe) return;

    const recipeName = this.currentRecipe.name || "Recipe";
    const recipeUrl = window.location.href.split("#")[0] + `#recipe-view`;
    const recipeText = `Check out this recipe: ${recipeName}`;

    if (navigator.share) {
      navigator
        .share({
          title: recipeName,
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

  handleActionIconClick(actionIcon, e) {
    e.stopPropagation();
    e.preventDefault();

    const isSaveBtn =
      actionIcon.closest(".btn-save-recipe") ||
      actionIcon.id === "recipe-view-save-btn";
    const isLikeBtn =
      actionIcon.closest(".btn-like-recipe") ||
      actionIcon.id === "recipe-view-like-btn";
    const isShareBtn =
      actionIcon.closest(".btn-share-recipe") ||
      actionIcon.id === "recipe-view-share-btn";
    const isPrintBtn = actionIcon.querySelector("i.fa-print");

    const actionSidebar = document.querySelector(".action-sidebar");
    if (actionSidebar && !isSaveBtn && !isLikeBtn) {
      const allIcons = actionSidebar.querySelectorAll(".action-icon");
      allIcons.forEach((icon) => {
        const iconIsSave =
          icon.closest(".btn-save-recipe") ||
          icon.id === "recipe-view-save-btn";
        const iconIsLike =
          icon.closest(".btn-like-recipe") ||
          icon.id === "recipe-view-like-btn";
        if (
          !iconIsSave &&
          !iconIsLike &&
          !icon.classList.contains("saved") &&
          !icon.classList.contains("liked")
        ) {
          icon.classList.remove("active");
        }
      });
    }

    if (
      !actionIcon.classList.contains("saved") &&
      !actionIcon.classList.contains("liked")
    ) {
      actionIcon.classList.add("active");
    }

    if (isSaveBtn) {
      this.toggleSave();
    } else if (isLikeBtn) {
      this.toggleLike();
    } else if (isShareBtn) {
      this.shareRecipe();
    } else if (isPrintBtn) {
      window.print();
    }
  }

  async toggleSave() {
    if (!(await this._ensureAuthenticated())) {
      alertManager.info("Please log in to save recipes.");
      return;
    }

    if (!this.currentRecipe) return;

    const recipeId = this._getRecipeId();
    const recipe =
      recipeId && window.recipesManager
        ? window.recipesManager.recipes.find((r) => r.id === recipeId) ||
          this.currentRecipe
        : this.currentRecipe;

    if (!recipeId) {
      alertManager.error("Recipe ID not found. Cannot save recipe.");
      return;
    }

    const saveBtn = document.getElementById("recipe-view-save-btn");
    if (!saveBtn) return;

    const isSaving = !saveBtn.classList.contains("saved");
    saveBtn.classList.toggle("saved");
    saveBtn.setAttribute("title", isSaving ? "Saved" : "Save");

    const recipeIdStr = String(recipeId);

    try {
      let finalRecipeId = recipeIdStr;

      if (isSaving) {
        const response = await ApiService.saveRecipe(recipeIdStr, recipe);
        if (response.savedRecipeId) {
          finalRecipeId = response.savedRecipeId;
          if (response.savedRecipeId !== recipeIdStr) {
            if (this.currentRecipe) {
              this.currentRecipe.id = response.savedRecipeId;
              this.currentRecipe._id = response.savedRecipeId;
            }
          }
        }
        alertManager.success("Saved to My Recipes.");
      } else {
        await ApiService.unsaveRecipe(finalRecipeId);
        alertManager.success("Removed from My Recipes.");
      }

      document.dispatchEvent(
        new CustomEvent(isSaving ? "recipeSaved" : "recipeUnsaved", {
          detail: {
            recipeId: finalRecipeId,
            recipe: this.currentRecipe || recipe,
          },
        })
      );
    } catch (error) {
      saveBtn.classList.toggle("saved");
      saveBtn.setAttribute("title", isSaving ? "Save" : "Saved");

      if (error.message && error.message.includes("Unauthorized")) {
        if (await this._ensureAuthenticated()) {
          try {
            let finalRecipeId = recipeIdStr;

            if (isSaving) {
              const response = await ApiService.saveRecipe(recipeIdStr, recipe);
              if (response.savedRecipeId) {
                finalRecipeId = response.savedRecipeId;
                if (
                  response.savedRecipeId !== recipeIdStr &&
                  this.currentRecipe
                ) {
                  this.currentRecipe.id = response.savedRecipeId;
                  this.currentRecipe._id = response.savedRecipeId;
                }
              }
              alertManager.success("Saved to My Recipes.");
            } else {
              await ApiService.unsaveRecipe(finalRecipeId);
              alertManager.success("Removed from My Recipes.");
            }
            saveBtn.classList.toggle("saved");
            saveBtn.setAttribute("title", isSaving ? "Saved" : "Save");
            document.dispatchEvent(
              new CustomEvent(isSaving ? "recipeSaved" : "recipeUnsaved", {
                detail: {
                  recipeId: finalRecipeId,
                  recipe: this.currentRecipe || recipe,
                },
              })
            );
            return;
          } catch (retryError) {
            if (
              retryError.message &&
              retryError.message.includes("Unauthorized")
            ) {
              this._clearAuthAndUpdateUI();
              alertManager.info("Please log in to continue.");
            } else {
              console.error("Error saving recipe after retry: ", retryError);
              alertManager.error("Failed to save recipe. Please try again.");
            }
          }
        } else {
          alertManager.info("Please log in to continue.");
        }
      } else {
        console.error("Error saving recipe: ", error);
        alertManager.error("Failed to save recipe. Please try again.");
      }
    }
  }

  async toggleLike() {
    if (!(await this._ensureAuthenticated())) {
      alertManager.info("Please log in to like recipes.");
      return;
    }

    if (!this.currentRecipe) return;

    const recipeId = this._getRecipeId();

    if (!recipeId) {
      alertManager.error("Recipe ID not found. Cannot like recipe.");
      return;
    }

    const likeBtn = document.getElementById("recipe-view-like-btn");
    if (!likeBtn) return;

    const isLiking = !likeBtn.classList.contains("liked");
    likeBtn.classList.toggle("liked");
    likeBtn.setAttribute("title", isLiking ? "Liked" : "Like");

    const recipeIdStr = String(recipeId);

    try {
      let finalRecipeId = recipeIdStr;

      if (isLiking) {
        const response = await ApiService.likeRecipe(
          recipeIdStr,
          this.currentRecipe
        );
        if (response.likedRecipeId) {
          finalRecipeId = response.likedRecipeId;
          if (response.likedRecipeId !== recipeIdStr) {
            if (this.currentRecipe) {
              this.currentRecipe.id = response.likedRecipeId;
              this.currentRecipe._id = response.likedRecipeId;
            }
          }
        }
      } else {
        await ApiService.unlikeRecipe(finalRecipeId);
      }

      document.dispatchEvent(
        new CustomEvent(isLiking ? "recipeLiked" : "recipeUnliked", {
          detail: { recipeId: finalRecipeId, recipe: this.currentRecipe },
        })
      );
    } catch (error) {
      likeBtn.classList.toggle("liked");
      likeBtn.setAttribute("title", isLiking ? "Like" : "Liked");

      if (error.message && error.message.includes("Unauthorized")) {
        if (await this._ensureAuthenticated()) {
          try {
            let finalRecipeId = recipeIdStr;

            if (isLiking) {
              const response = await ApiService.likeRecipe(
                recipeIdStr,
                this.currentRecipe
              );
              if (response.likedRecipeId) {
                finalRecipeId = response.likedRecipeId;
                if (
                  response.likedRecipeId !== recipeIdStr &&
                  this.currentRecipe
                ) {
                  this.currentRecipe.id = response.likedRecipeId;
                  this.currentRecipe._id = response.likedRecipeId;
                }
              }
            } else {
              await ApiService.unlikeRecipe(finalRecipeId);
            }
            likeBtn.classList.toggle("liked");
            likeBtn.setAttribute("title", isLiking ? "Liked" : "Like");
            document.dispatchEvent(
              new CustomEvent(isLiking ? "recipeLiked" : "recipeUnliked", {
                detail: { recipeId: finalRecipeId, recipe: this.currentRecipe },
              })
            );
            return;
          } catch (retryError) {
            if (
              retryError.message &&
              retryError.message.includes("Unauthorized")
            ) {
              this._clearAuthAndUpdateUI();
              alertManager.info("Please log in to continue.");
            } else {
              console.error("Error liking recipe after retry: ", retryError);
              alertManager.error("Failed to like recipe. Please try again.");
            }
          }
        } else {
          alertManager.info("Please log in to continue.");
        }
      } else {
        console.error("Error liking recipe: ", error);
        alertManager.error("Failed to like recipe. Please try again.");
      }
    }
  }
}
