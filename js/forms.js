class FormManager {
  constructor() {
    this.initializeForms();
  }

  initializeForms() {
    const signinForm = document.getElementById("signin-form");
    if (signinForm) {
      signinForm.addEventListener("submit", (e) => this.handleSignIn(e));
    }

    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
      signupForm.addEventListener("submit", (e) => this.handleSignup(e));
    }

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const tabName = button.getAttribute("data-tab");
        navigationManager.switchTab(tabName);
      });
    });

    const switchToSignupLink = document.getElementById("switch-to-signup");
    if (switchToSignupLink) {
      switchToSignupLink.addEventListener("click", (e) => {
        e.preventDefault();
        navigationManager.switchTab("signup");
      });
    }

    const googleSignInBtn = document.getElementById("google-signin");
    const appleSignInBtn = document.getElementById("apple-signin");

    if (googleSignInBtn) {
      googleSignInBtn.addEventListener("click", (e) =>
        this.handleSocialLogin(e, "google", "signin")
      );
    }
    if (appleSignInBtn) {
      appleSignInBtn.addEventListener("click", (e) =>
        this.handleSocialLogin(e, "apple", "signin")
      );
    }
  }

  async handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById("signin-email").value;
    const password = document.getElementById("signin-password").value;

    if (!this.isValidEmail(email)) {
      alertManager.error("Please enter a valid email.");
      return;
    }

    if (password.length < 8) {
      alertManager.error("Password must be at least 8 characters.");
      return;
    }

    try {
      const response = await ApiService.login({ email, password });

      if (response.user) {
        window.currentUserId = response.user.id || response.user._id;
        navigationManager.signIn();
        this.closeModal("auth-modal");
        alertManager.success(response.message || "Login successful!");

        if (window.recipeViewManager) {
          setTimeout(async () => {
            await window.recipeViewManager.updateActionButtonsVisibility();
          }, 500);
        }
      } else {
        window.currentUserId = "guest";
        alertManager.error("Login failed. Please try again.");
      }
    } catch (error) {
      alertManager.error(error.message || "Login failed. Please try again.");
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm").value;

    if (!this.isValidEmail(email)) {
      alertManager.error("Please enter a valid email.");
      return;
    }

    if (password !== confirmPassword) {
      alertManager.error("Passwords don't match.");
      return;
    }

    if (password.length < 8) {
      alertManager.error("Password must be at least 8 characters.");
      return;
    }

    if (!this.isValidPassword(password)) {
      alertManager.error(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number."
      );
      return;
    }

    try {
      const response = await ApiService.register({ name, email, password });

      if (response.user) {
        window.currentUserId = response.user.id || response.user._id;
        navigationManager.signIn();
        this.closeModal("auth-modal");
        alertManager.success(
          response.message || "Account created successfully!"
        );

        if (window.recipeViewManager) {
          await window.recipeViewManager.updateActionButtonsVisibility();
        }
      } else {
        window.currentUserId = "guest";
        alertManager.error("Registration failed. Please try again.");
      }
    } catch (error) {
      alertManager.error(
        error.message || "Registration failed. Please try again."
      );
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    return passwordRegex.test(password);
  }

  handleSocialLogin(e, provider, action) {
    e.preventDefault();

    const providerName = provider === "google" ? "Google" : "Apple";

    const button = e.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"> </i> Connecting...';
    button.disabled = true;

    setTimeout(async () => {
      button.innerHTML = originalText;
      button.disabled = false;

      try {
        const userResponse = await ApiService.getCurrentUser();
        if (userResponse.user) {
          window.currentUserId =
            userResponse.user.id || userResponse.user._id || "guest";
        }
      } catch (error) {
        console.error("Error getting current user: ", error);
      }

      if (window.recipeViewManager) {
        setTimeout(() => {
          window.recipeViewManager.updateActionButtonsVisibility();
        }, 200);
      }

      navigationManager.signIn();
      this.closeModal("auth-modal");
      alertManager.success(`Successfully signed in with ${providerName}!`);
    }, 1500);
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "none";

      if (modalId === "auth-modal") {
        document.getElementById("signin-form").reset();
        document.getElementById("signup-form").reset();
      }
    }
  }
}

class ModalManager {
  constructor() {
    this.initializeModals();
  }

  initializeModals() {
    const closeButtons = document.querySelectorAll(".close");
    closeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        if (modal) {
          modal.style.display = "none";
        }
      });
    });

    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
      }
    });
  }
}

class GoalsManager {
  constructor() {
    this.currentSurveyStep = 1;
    this.surveyActivityLevel = null;
    this.initializeGoalsForm();
    this.initializeSidebarNavigation();
    this.initializeSurveyForm();
  }

  initializeSidebarNavigation() {
    const navButtons = document.querySelectorAll("#goals .activity-nav-btn");
    navButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = btn.dataset.tab;
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  switchTab(tabName) {
    if (!tabName) return;

    const navButtons = document.querySelectorAll("#goals .activity-nav-btn");
    navButtons.forEach((btn) => {
      btn.classList.remove("active");
      btn.style.background = "";
      btn.style.color = "";
      const icon = btn.querySelector("i");
      if (icon) {
        icon.style.color = "";
      }
    });

    const activeButton = document.querySelector(
      `#goals .activity-nav-btn[data-tab="${tabName}"]`
    );
    if (activeButton) {
      activeButton.classList.add("active");
      const root = getComputedStyle(document.documentElement);
      const primaryColor =
        root.getPropertyValue("--theme-primary-color").trim() || "#000000";
      const secondaryColor =
        root.getPropertyValue("--theme-secondary-color").trim() || "#ffffff";

      activeButton.style.cssText += `background: ${primaryColor} !important; color: ${secondaryColor} !important;`;

      const icon = activeButton.querySelector("i");
      if (icon) {
        icon.style.cssText += `color: ${secondaryColor} !important;`;
      }
    }

    const tabs = document.querySelectorAll("#goals .goals-tab");
    tabs.forEach((tab) => {
      tab.classList.remove("active");
    });

    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
      targetTab.classList.add("active");
    }
  }

  initializeSurveyForm() {
    const surveyForm = document.getElementById("survey-form");
    if (surveyForm) {
      surveyForm.addEventListener("submit", (e) => this.handleSurveySubmit(e));
    }

    const manualForm = document.getElementById("manual-goals-form");
    if (manualForm) {
      manualForm.addEventListener("submit", (e) => this.handleManualSubmit(e));
    }

    const heightUnit = document.getElementById("survey-height-unit");
    const heightFeetInches = document.getElementById(
      "survey-height-feet-inches"
    );
    const heightValue = document.getElementById("survey-height-value");
    if (heightUnit && heightFeetInches && heightValue) {
      heightUnit.addEventListener("change", () => {
        if (heightUnit.value === "ft-in") {
          heightFeetInches.style.display = "block";
          heightValue.style.display = "none";
        } else {
          heightFeetInches.style.display = "none";
          heightValue.style.display = "block";
        }
      });
    }

    const activityLevelRadios = document.querySelectorAll(
      'input[name="activity-level"]'
    );
    activityLevelRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        this.surveyActivityLevel = radio.value;
        this.updateGoalOptions(radio.value);
      });
    });
  }

  calculateBMR(weight, height, age, gender) {
    if (!weight || !height || !age || !gender) {
      return null;
    }

    if (gender === "male") {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else if (gender === "female") {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 78;
    }
  }

  getActivityMultiplier(activityLevel) {
    const multipliers = {
      sedentary: 1.2,
      "moderate-active": 1.55,
      "high-active": 1.9,
    };
    return multipliers[activityLevel] || 1.2;
  }

  calculateCalorieTarget(BMR, activityLevel, goalRange) {
    const multiplier = this.getActivityMultiplier(activityLevel);
    const TDEE = BMR * multiplier;

    const [min, max] = goalRange.split(",").map(Number);
    const adjustment = (min + max) / 2;

    return Math.round(TDEE + adjustment);
  }

  updateGoalOptions(activityLevel) {
    const container = document.getElementById("goal-options-container");
    if (!container) return;

    const goalOptions = {
      sedentary: [
        {
          value: "lose-weight",
          label: "Lose Weight",
          desc: "Create a calorie deficit to reduce body fat",
          range: "-300,-500",
        },
        {
          value: "maintain-weight",
          label: "Maintain Weight",
          desc: "Match calorie intake with daily energy expenditure",
          range: "0,0",
        },
        {
          value: "gain-weight",
          label: "Gain Weight",
          desc: "Slight surplus to support gradual weight gain",
          range: "300,400",
        },
        {
          value: "lean-muscle-gain",
          label: "Gain Muscle",
          desc: "Higher protein intake with moderate surplus",
          range: "250,350",
        },
      ],
      "moderate-active": [
        {
          value: "fat-loss-exercise",
          label: "Fat Loss",
          desc: "Combine calorie deficit with exercise routine",
          range: "-400,-600",
        },
        {
          value: "lean-muscle-gain",
          label: "Lean Muscle Gain",
          desc: "Small surplus with higher protein intake",
          range: "250,350",
        },
        {
          value: "endurance-support",
          label: "Endurance Support",
          desc: "Increase carb ratio for running/cycling training",
          range: "0,0",
        },
        {
          value: "active-lifestyle-maintenance",
          label: "Maintain",
          desc: "Track calories burned and balance with nutrition",
          range: "0,0",
        },
        {
          value: "recomposition",
          label: "Recomposition",
          desc: "Maintain calories but shift macros to lose fat and gain muscle",
          range: "0,0",
        },
      ],
      "high-active": [
        {
          value: "performance-optimization",
          label: "Performance Optimization",
          desc: "Align calorie intake with training cycles",
          range: "0,0",
        },
        {
          value: "strength-training-phase",
          label: "Strength Training",
          desc: "High protein + calorie surplus for muscle growth",
          range: "500,800",
        },
        {
          value: "cutting-competition-prep",
          label: "Cutting",
          desc: "Calorie deficit with high protein to preserve lean mass",
          range: "-500,-700",
        },
        {
          value: "endurance-event-prep",
          label: "Endurance",
          desc: "Carb loading and hydration-focused nutrition",
          range: "300,500",
        },
        {
          value: "recovery-maintenance",
          label: "Recovery and Maintenance",
          desc: "Slight surplus with emphasis on micronutrients",
          range: "0,200",
        },
      ],
    };

    const options = goalOptions[activityLevel] || [];
    container.innerHTML = options
      .map(
        (option) => `
            <label class="goal-card">
                <input type="radio" name="goal-type" value="${option.value}" data-target-range="${option.range}" required>
                <div class="goal-card-content">
                    <span class="goal-card-label">${option.label}</span>
                    <span class="goal-card-desc">${option.desc}</span>
                </div>
            </label>
        `
      )
      .join("");

    const goalCards = container.querySelectorAll(".goal-card");
    goalCards.forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.addEventListener("change", () => {
          this.updateRadioStyling();
        });
      }
    });
  }

  initializeGoalsForm() {
    const goalsForm = document.getElementById("goals-form");
    if (goalsForm) {
      goalsForm.addEventListener("submit", (e) => this.handleGoalsSubmit(e));

      const heightUnit = document.getElementById("height-unit");
      const heightFeetInches = document.getElementById("height-feet-inches");
      const heightValue = document.getElementById("height-value");
      if (heightUnit && heightFeetInches && heightValue) {
        heightUnit.addEventListener("change", () => {
          if (heightUnit.value === "ft-in") {
            heightFeetInches.style.display = "block";
            heightValue.style.display = "none";
          } else {
            heightFeetInches.style.display = "none";
            heightValue.style.display = "block";
          }
        });
      }

      const radioButtons = goalsForm.querySelectorAll(
        'input[type="radio"][name="goal-type"]'
      );
      radioButtons.forEach((radio) => {
        radio.addEventListener("change", () => {
          this.updateRadioStyling();
          this.updateCalorieTargetFromGoalType(radio);
        });
      });

      this.loadSavedGoals();
    }
  }

  updateCalorieTargetFromGoalType(radioButton) {
    const targetRange = radioButton.dataset.targetRange;
    const carbsRange = radioButton.dataset.carbsRange;
    const calorieInput = document.getElementById("calorie-target");
    const calorieSlider = document.getElementById("calorie-slider");
    const carbSlider = document.getElementById("carb-ratio");

    if (!targetRange || targetRange === "0, 0") {
      return;
    }

    const [min, max] = targetRange.split(", ").map(Number);

    if (isNaN(min) || isNaN(max)) {
      return;
    }

    const baseCalories = 2000;

    const targetMin = baseCalories + min;
    const targetMax = baseCalories + max;
    const targetAvg = Math.round((targetMin + targetMax) / 2);

    if (isNaN(targetAvg)) {
      return;
    }

    if (calorieInput) {
      calorieInput.value = targetAvg;
    }
    if (calorieSlider) {
      calorieSlider.value = targetAvg;
    }

    if (carbsRange && carbSlider) {
      const [carbMin, carbMax] = carbsRange.split(", ").map(Number);
      if (!isNaN(carbMin) && !isNaN(carbMax)) {
        const carbAvg = Math.round((carbMin + carbMax) / 2);
        if (!isNaN(carbAvg)) {
          carbSlider.value = carbAvg;
          this.updateMacroRatios();
        }
      }
    }
  }

  updateRadioStyling() {
    const goalCards = document.querySelectorAll(".goal-card");
    goalCards.forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio && radio.checked) {
        card.classList.add("checked");
      } else {
        card.classList.remove("checked");
      }
    });
  }

  async handleGoalsSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const goalType = formData.get("goal-type");
    const calorieTarget = parseInt(formData.get("calorie-target"));

    const heightUnit = formData.get("height-unit");
    let height = null;
    if (heightUnit === "cm") {
      const heightValue = parseFloat(formData.get("height-value"));
      if (heightValue && heightValue > 0) {
        height = heightValue;
      }
    } else if (heightUnit === "ft-in") {
      const feet = parseFloat(formData.get("height-feet")) || 0;
      const inches = parseFloat(formData.get("height-inches")) || 0;
      if (feet > 0 || inches > 0) {
        const totalInches = feet * 12 + inches;
        height = totalInches * 2.54;
      }
    }

    const weightUnit = formData.get("weight-unit");
    let weight = null;
    if (weightUnit === "kg") {
      const weightValue = parseFloat(formData.get("weight-value"));
      if (weightValue && weightValue > 0) {
        weight = weightValue;
      }
    } else if (weightUnit === "lbs") {
      const weightValue = parseFloat(formData.get("weight-value"));
      if (weightValue && weightValue > 0) {
        weight = weightValue * 0.453592;
      }
    }

    if (!height || height <= 0) {
      alertManager.error("Please enter your height.");
      return;
    }

    if (!weight || weight <= 0) {
      alertManager.error("Please enter your weight.");
      return;
    }

    if (!goalType) {
      alertManager.error("Please select a goal type.");
      return;
    }

    if (!calorieTarget || calorieTarget < 1000 || calorieTarget > 5000) {
      alertManager.error("Enter a target between 1, 000 and 5, 000 kcal.");
      return;
    }

    const capitalizedGoalType =
      goalType.charAt(0).toUpperCase() + goalType.slice(1);

    try {
      const selectedGoalType = document.querySelector(
        `input[name="goal-type"]:checked`
      );
      const category = selectedGoalType?.dataset.category || "general";

      const goalData = {
        type: goalType,
        category: category,
        target: calorieTarget,
        activityLevel: formData.get("activity-level") || undefined,
        goalDuration: formData.get("goal-duration")
          ? parseInt(formData.get("goal-duration"))
          : undefined,
        gender: formData.get("gender") || undefined,
        age: formData.get("age") ? parseInt(formData.get("age")) : undefined,
        height: height,
        weight: weight,
        dietType:
          formData.getAll("diet-type").length > 0
            ? formData.getAll("diet-type")
            : undefined,
        allergies: formData.getAll("allergies") || [],
        macros: {
          protein:
            parseInt(document.getElementById("protein-ratio")?.value) || 30,
          carbs: parseInt(document.getElementById("carb-ratio")?.value) || 40,
          fat: parseInt(document.getElementById("fat-ratio")?.value) || 30,
        },
        mealFrequency: formData.get("meal-frequency")
          ? parseInt(formData.get("meal-frequency"))
          : undefined,
        timeHorizon: formData.get("time-horizon") || undefined,
        motivationTagline: formData.get("motivation-tagline") || undefined,
        workoutSync: formData.get("workout-sync") === "on",
        weekendMode: formData.get("weekend-mode") === "on",
        weekdayCalories: formData.get("weekday-calories")
          ? parseInt(formData.get("weekday-calories"))
          : undefined,
        weekendCalories: formData.get("weekend-calories")
          ? parseInt(formData.get("weekend-calories"))
          : undefined,
        autoAdjust: formData.get("auto-adjust") === "on",
      };

      await ApiService.saveGoal(goalData);
      alertManager.success(
        `Goal saved: ${capitalizedGoalType} · ${calorieTarget} kcal/day.`
      );
    } catch (error) {
      console.error("Error saving goal: ", error);

      if (window.currentUserId === "guest") {
        const goalData = {
          type: goalType,
          target: calorieTarget,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("fitfuel-goal", JSON.stringify(goalData));
        alertManager.success(
          `Goal saved locally: ${capitalizedGoalType} · ${calorieTarget} kcal/day.`
        );
      } else {
        alertManager.error("Failed to save goal. Please try again.");
      }
    }
  }

  async loadSavedGoals() {
    const userId = getUserId();
    if (userId === "guest") {
      return;
    }
    try {
      const response = await ApiService.getGoal();
      if (response.goal) {
        const goal = response.goal;
        const goalTypeInput = document.querySelector(
          `input[name="goal-type"][value="${goal.type}"]`
        );
        if (goalTypeInput) {
          goalTypeInput.checked = true;
          this.updateRadioStyling();
        }

        const calorieInput = document.getElementById("calorie-target");
        if (calorieInput && goal.target) {
          calorieInput.value = goal.target;
          const slider = document.getElementById("calorie-slider");
          if (slider) slider.value = goal.target;
        }
        if (goal.activityLevel) {
          const activitySelect = document.getElementById("activity-level");
          if (activitySelect) activitySelect.value = goal.activityLevel;
        }
        if (goal.height) {
          const heightValue = document.getElementById("height-value");
          const heightUnit = document.getElementById("height-unit");
          if (heightValue && heightUnit) {
            heightValue.value = Math.round(goal.height);
            heightUnit.value = "cm";
          }
        }
        if (goal.weight) {
          const weightValue = document.getElementById("weight-value");
          const weightUnit = document.getElementById("weight-unit");
          if (weightValue && weightUnit) {
            weightValue.value = Math.round(goal.weight * 10) / 10;
            weightUnit.value = "kg";
          }
        }
        if (goal.timeHorizon) {
          const timeHorizonSelect = document.getElementById("time-horizon");
          if (timeHorizonSelect) timeHorizonSelect.value = goal.timeHorizon;
        }
        if (goal.motivationTagline) {
          const motivationInput = document.getElementById("motivation-tagline");
          if (motivationInput) motivationInput.value = goal.motivationTagline;
        }
      }
    } catch (error) {
      const saved = localStorage.getItem("fitfuel-goal");
      if (saved) {
        try {
          const goalData = JSON.parse(saved);
          const goalTypeInput = document.querySelector(
            `input[name="goal-type"][value="${goalData.type}"]`
          );
          if (goalTypeInput) {
            goalTypeInput.checked = true;
            this.updateRadioStyling();
          }
          const calorieInput = document.getElementById("calorie-target");
          if (calorieInput && goalData.target) {
            calorieInput.value = goalData.target;
          }
        } catch (e) {
          console.error("Error parsing saved goal: ", e);
        }
      }
    }
  }

  async handleSurveySubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const age = parseInt(formData.get("age"));
    if (!age || age < 1 || age > 120) {
      alertManager.error("Please enter a valid age.");
      return;
    }

    const gender = formData.get("gender");
    if (!gender) {
      alertManager.error("Please select your biological gender.");
      return;
    }

    const heightUnit = formData.get("survey-height-unit");
    let height = null;
    if (heightUnit === "cm") {
      const heightValue = parseFloat(formData.get("survey-height-value"));
      if (heightValue && heightValue > 0) {
        height = heightValue;
      }
    } else if (heightUnit === "ft-in") {
      const feet = parseFloat(formData.get("survey-height-feet")) || 0;
      const inches = parseFloat(formData.get("survey-height-inches")) || 0;
      if (feet > 0 || inches > 0) {
        const totalInches = feet * 12 + inches;
        height = totalInches * 2.54;
      }
    }

    const weightUnit = formData.get("survey-weight-unit");
    let weight = null;
    if (weightUnit === "kg") {
      const weightValue = parseFloat(formData.get("survey-weight-value"));
      if (weightValue && weightValue > 0) {
        weight = weightValue;
      }
    } else if (weightUnit === "lbs") {
      const weightValue = parseFloat(formData.get("survey-weight-value"));
      if (weightValue && weightValue > 0) {
        weight = weightValue * 0.453592;
      }
    }

    if (!height || height <= 0) {
      alertManager.error("Please enter your height.");
      return;
    }

    if (!weight || weight <= 0) {
      alertManager.error("Please enter your weight.");
      return;
    }

    const activityLevel = formData.get("activity-level");
    if (!activityLevel) {
      alertManager.error("Please select your activity level.");
      return;
    }

    const goalType = formData.get("goal-type");
    if (!goalType) {
      alertManager.error("Please select a goal.");
      return;
    }

    const selectedGoal = document.querySelector(
      `input[name="goal-type"]:checked`
    );
    const targetRange = selectedGoal?.dataset.targetRange || "0,0";

    const BMR = this.calculateBMR(weight, height, age, gender);
    if (!BMR || BMR <= 0) {
      alertManager.error(
        "Unable to calculate calorie target. Please check your inputs."
      );
      return;
    }

    const calorieTarget = this.calculateCalorieTarget(
      BMR,
      activityLevel,
      targetRange
    );

    const goalData = {
      type: goalType,
      category:
        activityLevel === "sedentary"
          ? "general"
          : activityLevel === "moderate-active"
          ? "active"
          : "athlete",
      target: calorieTarget,
      activityLevel:
        activityLevel === "sedentary"
          ? "sedentary"
          : activityLevel === "moderate-active"
          ? "active"
          : "very-active",
      age: age,
      gender: gender,
      height: height,
      weight: weight,
      dietType:
        formData.getAll("diet-type").length > 0
          ? formData.getAll("diet-type")
          : undefined,
      allergies: formData.getAll("allergies") || [],
    };

    try {
      await ApiService.saveGoal(goalData);
      alertManager.success("Goal saved successfully!");
      this.switchTab("reflection");
    } catch (error) {
      console.error("Error saving goal: ", error);
      alertManager.error("Failed to save goal. Please try again.");
    }
  }

  async handleManualSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const calorieTarget = parseInt(formData.get("calorie-target"));

    if (!calorieTarget || calorieTarget < 1000 || calorieTarget > 5000) {
      alertManager.error("Enter a target between 1,000 and 5,000 kcal.");
      return;
    }

    const goalData = {
      type: "manual",
      target: calorieTarget,
      dietType:
        formData.getAll("diet-type").length > 0
          ? formData.getAll("diet-type")
          : undefined,
      allergies: formData.getAll("allergies") || [],
    };

    try {
      await ApiService.saveGoal(goalData);
      alertManager.success("Goal saved successfully!");
    } catch (error) {
      console.error("Error saving goal: ", error);
      alertManager.error("Failed to save goal. Please try again.");
    }
  }
}

window.goToSurveyStep = function (step) {
  const steps = document.querySelectorAll(".survey-step");
  steps.forEach((s) => s.classList.remove("active"));

  const targetStep = document.getElementById(`survey-step-${step}`);
  if (targetStep) {
    targetStep.classList.add("active");
    if (window.goalsManager) {
      window.goalsManager.currentSurveyStep = step;
    }
  }
};

window.saveWeeklyReflection = function () {
  const reflection = document.getElementById("weekly-reflection");
  if (!reflection) return;

  const reflectionText = reflection.value;
  if (reflectionText.trim()) {
    localStorage.setItem(
      "fitfuel-weekly-reflection",
      JSON.stringify({
        text: reflectionText,
        date: new Date().toISOString(),
      })
    );
    if (window.alertManager) {
      window.alertManager.success("Reflection saved!");
    } else {
      alert("Reflection saved!");
    }
  } else {
    if (window.alertManager) {
      window.alertManager.error("Please enter a reflection.");
    } else {
      alert("Please enter a reflection.");
    }
  }
};
