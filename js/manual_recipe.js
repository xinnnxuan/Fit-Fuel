class ManualRecipeManager {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("click", (e) => {
      if (e.target.id === "cancel-manual-recipe") {
        const form = document.getElementById("manual-recipe-form");
        if (form) {
          form.reset();
          this.removeRecipeImage();
          const ingredientsContainer = document.getElementById(
            "ingredients-container"
          );
          const directionsContainer = document.getElementById(
            "directions-container"
          );
          if (
            ingredientsContainer &&
            ingredientsContainer.children.length > 1
          ) {
            while (ingredientsContainer.children.length > 1) {
              ingredientsContainer.removeChild(ingredientsContainer.lastChild);
            }
          }
          if (directionsContainer && directionsContainer.children.length > 1) {
            while (directionsContainer.children.length > 1) {
              directionsContainer.removeChild(directionsContainer.lastChild);
            }
          }
        }
      }
    });

    const setupButtonListeners = () => {
      const manualAddBtn = document.getElementById("manual-add-recipe");
      if (manualAddBtn) {
        manualAddBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (window.navigationManager) {
            window.navigationManager.showActivity();
            setTimeout(() => {
              if (window.activityFormManager) {
                window.activityFormManager.switchActivitySection(
                  "manual-recipe"
                );
              }
            }, 100);
          }
        });
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupButtonListeners);
    } else {
      setupButtonListeners();
    }

    document.addEventListener("click", (e) => {
      let target = e.target;
      let foundManual = false;

      while (target && target !== document.body) {
        if (target.id === "manual-add-recipe") {
          foundManual = true;
          break;
        }
        target = target.parentElement;
      }

      if (foundManual) {
        e.preventDefault();
        e.stopPropagation();
        if (window.navigationManager) {
          window.navigationManager.showActivity();
          setTimeout(() => {
            if (window.activityFormManager) {
              window.activityFormManager.switchActivitySection("manual-recipe");
            }
          }, 100);
        }
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.id === "add-ingredient") {
        this.addIngredientInput();
      } else if (e.target.classList.contains("remove-ingredient")) {
        this.removeIngredientInput(e.target);
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.id === "add-direction") {
        this.addDirectionInput();
      } else if (e.target.classList.contains("remove-direction")) {
        this.removeDirectionInput(e.target);
      }
    });

    document.addEventListener("submit", (e) => {
      if (e.target.id === "manual-recipe-form") {
        e.preventDefault();
        this.handleFormSubmission(e.target);
      }
    });

    const imageUpload = document.getElementById("recipe-image-upload");
    if (imageUpload) {
      imageUpload.addEventListener("change", (e) => this.handleImageUpload(e));
    }

    document.addEventListener("click", (e) => {
      if (e.target.id === "remove-recipe-image") {
        this.removeRecipeImage();
      }
    });
  }

  addIngredientInput() {
    const container = document.getElementById("ingredients-container");
    if (container) {
      const ingredientGroup = document.createElement("div");
      ingredientGroup.className = "ingredient-input-group";
      ingredientGroup.innerHTML = `
            <input type="text" class="ingredient-input" placeholder="e.g., 2 cups flour" required> <button type="button" class="remove-ingredient">&times;</button>
            `;
      container.appendChild(ingredientGroup);
      this.updateRemoveButtons();
    }
  }

  removeIngredientInput(button) {
    const container = document.getElementById("ingredients-container");
    if (container && container.children.length > 1) {
      button.parentElement.remove();
      this.updateRemoveButtons();
    }
  }

  addDirectionInput() {
    const container = document.getElementById("directions-container");
    if (container) {
      const directionGroup = document.createElement("div");
      directionGroup.className = "direction-input-group";
      directionGroup.innerHTML = `
            <textarea class="direction-input" placeholder="Enter step..." required></textarea> <button type="button" class="remove-direction">&times;</button>
            `;
      container.appendChild(directionGroup);
      this.updateRemoveButtons();
    }
  }

  removeDirectionInput(button) {
    const container = document.getElementById("directions-container");
    if (container && container.children.length > 1) {
      button.parentElement.remove();
      this.updateRemoveButtons();
    }
  }

  updateRemoveButtons() {
    const ingredientGroups = document.querySelectorAll(
      ".ingredient-input-group"
    );
    const directionGroups = document.querySelectorAll(".direction-input-group");

    ingredientGroups.forEach((group, index) => {
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

    directionGroups.forEach((group, index) => {
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

  async handleFormSubmission(form) {
    const formData = new FormData(form);
    const imageFile = document.getElementById("recipe-image-upload")?.files[0];
    let imageBase64 = null;

    if (imageFile) {
      imageBase64 = await this.convertImageToBase64(imageFile);
    }

    const categories = formData.getAll("category");

    const recipeData = {
      name: formData.get("recipeName"),
      description: formData.get("description"),
      category: categories.length > 0 ? categories[0] : null,
      prepTime: formData.get("prepTime"),
      cookTime: formData.get("cookTime"),
      servings: formData.get("servings"),
      calories: formData.get("calories"),
      difficulty: formData.get("difficulty"),
      notes: formData.get("notes"),
      ingredients: this.getIngredients(),
      steps: this.getDirections(),
      image: imageBase64 || null,
      tags: categories,
    };

    if (!this.validateRecipe(recipeData)) {
      return;
    }

    await this.addRecipeToList(recipeData);

    this.showSuccessMessage(`Recipe "${recipeData.name}" added successfully!`);

    if (form) {
      form.reset();
      this.removeRecipeImage();
      const ingredientsContainer = document.getElementById(
        "ingredients-container"
      );
      const directionsContainer = document.getElementById(
        "directions-container"
      );
      if (ingredientsContainer && ingredientsContainer.children.length > 1) {
        while (ingredientsContainer.children.length > 1) {
          ingredientsContainer.removeChild(ingredientsContainer.lastChild);
        }
      }
      if (directionsContainer && directionsContainer.children.length > 1) {
        while (directionsContainer.children.length > 1) {
          directionsContainer.removeChild(directionsContainer.lastChild);
        }
      }
    }
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

  handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = document.getElementById("recipe-image-preview");
        const previewImg = document.getElementById("recipe-image-preview-img");
        if (preview && previewImg) {
          previewImg.src = event.target.result;
          preview.style.display = "block";
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeRecipeImage() {
    const imageUpload = document.getElementById("recipe-image-upload");
    const preview = document.getElementById("recipe-image-preview");
    if (imageUpload) {
      imageUpload.value = "";
    }
    if (preview) {
      preview.style.display = "none";
    }
  }

  getIngredients() {
    const ingredients = [];
    const ingredientInputs = document.querySelectorAll(".ingredient-input");
    ingredientInputs.forEach((input) => {
      if (input.value.trim()) {
        ingredients.push(input.value.trim());
      }
    });
    return ingredients;
  }

  getDirections() {
    const directions = [];
    const directionInputs = document.querySelectorAll(".direction-input");
    directionInputs.forEach((input) => {
      if (input.value.trim()) {
        directions.push(input.value.trim());
      }
    });
    return directions;
  }

  validateRecipe(recipeData) {
    if (
      !recipeData.name ||
      !recipeData.description ||
      !recipeData.categories ||
      recipeData.categories.length === 0
    ) {
      alert(
        "Please fill in all required fields, including at least one category."
      );
      return false;
    }

    if (recipeData.ingredients.length === 0) {
      alert("Please add at least one ingredient.");
      return false;
    }

    if (recipeData.steps.length === 0) {
      alert("Please add at least one direction step.");
      return false;
    }

    return true;
  }

  async addRecipeToList(recipeData) {
    const userId = getUserId();
    const id = Date.now();

    const recipeForDatabase = {
      name: recipeData.name,
      description: recipeData.description,
      category: recipeData.category,
      calories: parseInt(recipeData.calories) || 0,
      time: `${
        parseInt(recipeData.prepTime) + parseInt(recipeData.cookTime)
      } min`,
      image: recipeData.image || null,
      ingredients: recipeData.ingredients,
      steps: recipeData.steps,
      servings: parseInt(recipeData.servings) || 4,
      tags: recipeData.difficulty ? [recipeData.difficulty] : [],
    };

    if (userId !== "guest") {
      try {
        const response = await ApiService.createRecipe(recipeForDatabase);
        if (response.recipe) {
          if (window.recipesManager) {
            window.recipesManager.recipes.push(response.recipe);
            window.recipesManager.filteredRecipes = [
              ...window.recipesManager.recipes,
            ];
          }
        }
      } catch (error) {
        console.error("Error saving recipe to database: ", error);
      }
    }

    const newRecipe = {
      id: id,
      name: recipeData.name,
      description: recipeData.description,
      category: recipeData.category,
      calories: parseInt(recipeData.calories) || 0,
      time: `${recipeData.prepTime} min`,
      image: recipeData.image || "default-recipe.jpg",
      tags: [recipeData.difficulty],
      author: "You",
      lastUpdated: new Date().toLocaleDateString(),
      prepTime: `${recipeData.prepTime} min`,
      cookTime: `${recipeData.cookTime} min`,
      totalTime: `${
        parseInt(recipeData.prepTime) + parseInt(recipeData.cookTime)
      } min`,
      servings: recipeData.servings,
      serves: recipeData.servings,
      rating: 0,
      ingredients: recipeData.ingredients,
      directions: recipeData.steps,
      notes: recipeData.notes || "",
      nutrition: {
        calories: parseInt(recipeData.calories) || 0,
        protein: "0g",
        carbs: "0g",
        fat: "0g",
        fiber: "0g",
        sugar: "0g",
        sodium: "0mg",
      },
    };

    if (window.recipesManager) {
      window.recipesManager.addRecipe(newRecipe);
    }

    if (window.feedManager) {
      const newRecipePost = {
        id: id,
        user: { name: "You", avatar: "Y" },
        timestamp: new Date(),
        type: "recipe",
        title: recipeData.name,
        description: recipeData.description || "",
        metrics: {
          calories: `${parseInt(recipeData.calories) || 0} kcal`,
          carbs: "0g",
          protein: "0g",
          time: `${
            parseInt(recipeData.prepTime) + parseInt(recipeData.cookTime)
          } min`,
        },
        images: recipeData.image ? [recipeData.image] : [],
        isUserUpload: true,
      };

      window.feedManager.feedPosts.unshift(newRecipePost);
      window.feedManager.renderFeed();
    }

    if (window.profileManager) {
      window.profileManager.updateTotalCounters();
    }
  }

  showSuccessMessage(message) {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
}
