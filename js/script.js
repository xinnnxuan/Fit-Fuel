window.addEventListener(
  "error",
  (e) => {
    if (
      e.message &&
      e.message.includes("appendChild") &&
      e.filename &&
      (e.filename.includes("index.js") ||
        e.filename.includes("featureScript.js"))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
  },
  true
);

const originalError = console.error;
console.error = function (...args) {
  const message = args.join(" ");
  if (
    message.includes("appendChild") &&
    (message.includes("index.js") || message.includes("featureScript.js"))
  ) {
    return;
  }
  originalError.apply(console, args);
};

window.addEventListener("unhandledrejection", (e) => {
  if (
    e.reason &&
    e.reason.message &&
    e.reason.message.includes("appendChild") &&
    e.reason.stack &&
    (e.reason.stack.includes("index.js") ||
      e.reason.stack.includes("featureScript.js"))
  ) {
    e.preventDefault();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initializeManagers();
  setupGlobalNavigation();
  checkAuthStatus();
  setupGlobalEventListeners();
  applyThemeColorsOnLoad();
  handleHashNavigation();

  if (!window.currentUserId) {
    window.currentUserId = "guest";
  }
});

// Handle hash-based navigation from external pages (e.g., WPD5 splash page)
function handleHashNavigation() {
  // Check for hash in URL
  const hash = window.location.hash;
  const urlParams = new URLSearchParams(window.location.search);
  
  // Wait for managers to initialize
  setTimeout(() => {
    if (hash) {
      const section = hash.substring(1); // Remove the #
      
      if (window.navigationManager) {
        switch (section) {
          case "home":
            window.navigationManager.showHome();
            break;
          case "dashboard":
            window.navigationManager.showDashboard();
            break;
          case "recipes":
            window.navigationManager.showRecipes();
            break;
          case "goals":
            window.navigationManager.showGoals();
            break;
          case "activity":
            window.navigationManager.showActivity();
            break;
          case "profile":
            window.navigationManager.showProfile();
            break;
          case "settings":
            window.navigationManager.showSettings();
            break;
        }
      }
    } else if (urlParams.get("auth")) {
      // If no hash but auth parameter exists, show home first
      if (window.navigationManager) {
        window.navigationManager.showHome();
      }
    }
    
    // Check for auth parameter to open login modal
    if (urlParams.get("auth") === "login" || urlParams.get("auth") === "register") {
      setTimeout(() => {
        if (window.navigationManager) {
          window.navigationManager.showSignInModal();
          if (urlParams.get("auth") === "register") {
            window.navigationManager.switchTab("signup");
          }
        }
      }, 100);
    }
  }, 100);
}

function applyThemeColorsOnLoad() {
  const savedSettings = localStorage.getItem("fitfuel-settings");
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      const root = document.documentElement;
      if (settings.themePrimaryColor) {
        root.style.setProperty(
          "--theme-primary-color",
          settings.themePrimaryColor
        );
      }
      if (settings.themeSecondaryColor) {
        root.style.setProperty(
          "--theme-secondary-color",
          settings.themeSecondaryColor
        );
      }
      if (settings.themeAccentColor) {
        root.style.setProperty(
          "--theme-accent-color",
          settings.themeAccentColor
        );
        }
    } catch (error) {
      console.error("Error applying theme colors on load: ", error);
    }
  }
}

function initializeManagers() {
  if (typeof NavigationManager !== "undefined") {
    window.navigationManager = new NavigationManager();
  }
  if (typeof FormManager !== "undefined") {
    window.formManager = new FormManager();
  }
  if (typeof ModalManager !== "undefined") {
    window.modalManager = new ModalManager();
  }
  if (typeof GoalsManager !== "undefined") {
    window.goalsManager = new GoalsManager();
  }
  if (typeof AlertManager !== "undefined") {
    window.alertManager = new AlertManager();
  }
  if (typeof FeedManager !== "undefined") {
    window.feedManager = new FeedManager();
    window.feedManager.init();
  }
  if (typeof ActivityFormManager !== "undefined") {
    window.activityFormManager = new ActivityFormManager();
  }
  if (typeof RecipesManager !== "undefined") {
    window.recipesManager = new RecipesManager();
  }
  if (typeof ManualRecipeManager !== "undefined") {
    window.manualRecipeManager = new ManualRecipeManager();
  }
  if (typeof RecipeViewManager !== "undefined") {
    window.recipeViewManager = new RecipeViewManager();
  }
  if (typeof ProfileManager !== "undefined") {
    window.profileManager = new ProfileManager();
    window.profileManager.init();
  }
}

function setupGlobalEventListeners() {
  document.addEventListener("viewRecipe", (e) => {
    if (window.recipeViewManager) {
      window.recipeViewManager.showRecipe(e.detail.recipe);
    }
  });
}

function showFollowerOptions(button) {
  const existingMenu = document.querySelector(".follower-options-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  const optionsMenu = document.createElement("div");
  optionsMenu.className = "follower-options-menu";
  optionsMenu.style.position = "absolute";
  optionsMenu.style.display = "block";

  optionsMenu.innerHTML = `
    <div class="follower-option" onclick="removeFollower(this)">Remove Follower< /div> <div class="follower-option" onclick="showBlockConfirmation(this)">
    Block Athlete <span class="warning-icon"> !< /span> </div>
    `;

  button.style.position = "relative";
  button.appendChild(optionsMenu);

  setTimeout(() => {
    document.addEventListener("click", function closeMenu(e) {
      if (!optionsMenu.contains(e.target) && e.target !== button) {
        optionsMenu.remove();
        button.style.position = "";
        document.removeEventListener("click", closeMenu);
      }
    });
  }, 0);
}

function showSuggestionsOptions(button) {
  const existingMenu = document.querySelector(".follower-options-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  const optionsMenu = document.createElement("div");
  optionsMenu.className = "follower-options-menu";
  optionsMenu.style.position = "absolute";
  optionsMenu.style.display = "block";

  optionsMenu.innerHTML = `
    <div class="follower-option" onclick="showBlockConfirmation(this)">
    Block Athlete <span class="warning-icon"> !< /span> </div>
    `;

  button.style.position = "relative";
  button.appendChild(optionsMenu);

  setTimeout(() => {
    document.addEventListener("click", function closeMenu(e) {
      if (!optionsMenu.contains(e.target) && e.target !== button) {
        optionsMenu.remove();
        button.style.position = "";
        document.removeEventListener("click", closeMenu);
      }
    });
  }, 0);
}

function removeFollower(element) {
  const followerItem = element.closest(".following-item");
  const followerName =
    followerItem.querySelector(".following-name").textContent;

  alert(
    `${followerName} has been removed from your followers. They will no longer follow you.`
  );
  followerItem.remove();
}

function showBlockConfirmation(element) {
  const existingDialog = document.querySelector(".block-confirmation-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  const dialog = document.createElement("div");
  dialog.className = "block-confirmation-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay"> <div class="dialog-content"> <h3>Blocking an Athlete will: < /h3> <ul class="blocking-effects"> <li>Remove you from each other's activity feeds, club feeds, and lists of followers.< /li> <li>Prevent them from following you and seeing your complete profile.< /li> <li>Prevent them from visiting any of your complete activities via leaderboards or segment explore.< /li> <li>Prevent them from viewing any of your complete activities.< /li> </ul> <div class="dialog-actions"> <button class="block-btn" onclick="confirmBlockAthlete(this)">Block Athlete< /button> <button class="cancel-btn" onclick="cancelBlock(this)">Cancel< /button> </div> </div> </div>
    `;

  document.body.appendChild(dialog);

  const followerItem = element.closest(".following-item");
  dialog.setAttribute("data-follower-item", followerItem.outerHTML);
}

function confirmBlockAthlete(element) {
  const dialog = element.closest(".block-confirmation-dialog");
  const followerItemHtml = dialog.getAttribute("data-follower-item");

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = followerItemHtml;
  const followerName = tempDiv.querySelector(".following-name").textContent;

  const followingItems = document.querySelectorAll(".following-item");
  followingItems.forEach((item) => {
    const nameElement = item.querySelector(".following-name");
    if (nameElement && nameElement.textContent === followerName) {
      item.remove();
    }
  });

  alert(
    `${followerName} has been blocked. They will no longer be able to follow you, see your profile, or view your activities.`
  );

  dialog.remove();
}

function cancelBlock(element) {
  const dialog = element.closest(".block-confirmation-dialog");
  dialog.remove();
}

function handleFollowAction(button, action) {
  const followingItem = button.closest(".following-item");
  const userName = followingItem.querySelector(".following-name").textContent;

  switch (action) {
    case "follow":
      button.className = "following-btn";
      button.onclick = () => handleFollowAction(button, "unfollow");
      alert(`You are now following ${userName}!`);
      break;

    case "unfollow":
      button.className = "follow-btn";
      button.textContent = "Follow";
      button.onclick = () => handleFollowAction(button, "follow");
      alert(`You have unfollowed ${userName}.`);
      break;

    case "request":
      alert(
        `Follow request sent to ${userName}. They will be notified and can approve your request.`
      );
      break;

    default:
      console.error("Unknown follow action: ", action);
  }
}

function setupGlobalNavigation() {
    const activityLinks = document.querySelectorAll('a[href="#activity"]');
  activityLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
            e.preventDefault();
            if (window.navigationManager) {
                window.navigationManager.showActivity();
      } else {
        console.error("NavigationManager not initialized");
            }
        });
    });

  const goalsLinks = document.querySelectorAll('a[href="#goals"]');
  goalsLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
            e.preventDefault();
            if (window.navigationManager) {
        window.navigationManager.showGoals();
      } else {
        console.error("NavigationManager not initialized");
            }
        });
    });

  const recipesLinks = document.querySelectorAll('a[href="#recipes"]');
  recipesLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.navigationManager) {
        window.navigationManager.showRecipes();
      } else {
        console.error("NavigationManager not initialized");
      }
            });
        });

  const recipesLinkGuest = document.getElementById("recipes-link-guest");
  if (recipesLinkGuest) {
    recipesLinkGuest.addEventListener("click", (e) => {
                e.preventDefault();
      if (window.navigationManager) {
        window.navigationManager.showRecipes();
      }
    });
  }

  const dashboardLinks = document.querySelectorAll('a[href="#dashboard"]');
  dashboardLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
                e.preventDefault();
      if (window.navigationManager) {
        window.navigationManager.showDashboard();
      } else {
        console.error("NavigationManager not initialized");
      }
    });
  });

  document.addEventListener("click", (e) => {
    const userDropdown = document.getElementById("user-dropdown-menu");
    const userBtn = document.getElementById("user-btn");

    if (
      userDropdown &&
      !userBtn.contains(e.target) &&
      !userDropdown.contains(e.target)
    ) {
      userDropdown.classList.remove("show");
    }
  });
}

function cancelActivity() {
  if (window.activityFormManager) {
    window.activityFormManager.clearImagePreview();
  }

  if (window.feedManager) {
    window.feedManager.showProfile();
  }
}

async function checkAuthStatus() {
  try {
    if (!ApiService.getToken()) {
      window.currentUserId = "guest";
      if (window.navigationManager) {
        window.navigationManager.updateNavigation();
      }
            return;
        }

    const response = await ApiService.getCurrentUser();
    if (response && response.user) {
      window.currentUserId = response.user.id || response.user._id || "guest";
      if (window.navigationManager) {
        window.navigationManager.signIn();
      }
    } else {
      ApiService.setToken(null);
      window.currentUserId = "guest";
      if (window.navigationManager) {
        window.navigationManager.updateNavigation();
      }
    }
  } catch (error) {
    if (
      !error.message ||
      (!error.message.includes("Unauthorized") &&
        !error.message.includes("401"))
    ) {
      console.error("Auth check failed: ", error);
    }
    ApiService.setToken(null);
    window.currentUserId = "guest";
    if (window.navigationManager) {
      window.navigationManager.updateNavigation();
    }
  }
}
