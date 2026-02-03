class NavigationManager {
  constructor() {
    this.isSignedIn = false;
    this.signedInNav = document.getElementById("nav-signedin");
    this.signOutLink = document.getElementById("signout-link");
    this.currentSection = "home";

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    if (this.signOutLink) {
      this.signOutLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.signOut();
      });
    }

    const logoLink = document.querySelector(".logo-link");
    if (logoLink) {
      logoLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeDropdown();
        this.showHome();
      });
    }

    const userBtn = document.getElementById("user-btn");
    const dropdownMenu = document.getElementById("user-dropdown-menu");
    const authLink = document.getElementById("auth-link");
    const profileLink = document.getElementById("profile-link");

    if (userBtn && dropdownMenu) {
      userBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    if (authLink) {
      authLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeDropdown();
        if (this.isSignedIn) {
          this.signOut();
        } else {
          this.showSignInModal();
        }
      });
    }

    if (profileLink) {
      profileLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeDropdown();
        this.showProfile();
      });
    }

    const settingsLink = document.getElementById("settings-link");
    if (settingsLink) {
      settingsLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeDropdown();
        this.showSettings();
      });
    }

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".user-dropdown")) {
        this.closeDropdown();
      }
    });
  }

  toggleDropdown() {
    const dropdownMenu = document.getElementById("user-dropdown-menu");
    if (dropdownMenu) {
      dropdownMenu.classList.toggle("show");
    }
  }

  closeDropdown() {
    const dropdownMenu = document.getElementById("user-dropdown-menu");
    if (dropdownMenu) {
      dropdownMenu.classList.remove("show");
    }
  }

  showSignInModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) {
      modal.style.display = "block";

      this.switchTab("signin");
    }
  }

  signIn() {
    this.isSignedIn = true;
    this.updateNavigation();
    alertManager.success("You're in—welcome to FitFuel!");
    document.dispatchEvent(new CustomEvent("userSignedIn"));
  }

  signOut() {
    ApiService.setToken(null);
    window.currentUserId = "guest";
    this.isSignedIn = false;
    this.updateNavigation();
    alertManager.success("Signed out successfully.");
    document.dispatchEvent(new CustomEvent("userSignedOut"));
  }

  updateNavigation() {
    const guestNav = document.getElementById("nav-guest");

    if (this.isSignedIn) {
      this.signedInNav.style.display = "flex";

      if (guestNav) {
        guestNav.style.display = "none";
      }

      const authText = document.getElementById("auth-text");
      if (authText) {
        authText.textContent = "Log out";
      }

      const profileLink = document.getElementById("profile-link");
      if (profileLink) {
        profileLink.style.display = "block";
      }

      if (window.settingsManager) {
        window.settingsManager.updateSettingsTabsVisibility();
        window.settingsManager.updateDisplayPreferencesVisibility();
      }

      this.showHome();
    } else {
      this.signedInNav.style.display = "none";

      if (guestNav) {
        guestNav.style.display = "flex";
      }

      const authText = document.getElementById("auth-text");
      if (authText) {
        authText.textContent = "Log in";
      }

      const profileLink = document.getElementById("profile-link");
      if (profileLink) {
        profileLink.style.display = "none";
      }

      if (window.settingsManager) {
        window.settingsManager.updateSettingsTabsVisibility();
        window.settingsManager.updateDisplayPreferencesVisibility();
      }

      this.showHome();
    }
  }

  showHome() {
    this.currentSection = "home";
    this.updateActiveNavLink(null);

    document.querySelectorAll("section").forEach((section) => {
      section.style.display = "none";
    });

    const home = document.getElementById("home");
    if (home) {
      home.style.display = "block";
    }

    if (home) {
      home.style.visibility = "visible";
      home.style.opacity = "1";
    }

    document.body.classList.add("home-page");
    document.body.style.overflow = "hidden";
  }

  updateActiveNavLink(section) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    const userIcon = document.getElementById("user-btn");
    if (userIcon) {
      userIcon.classList.remove("active");
    }

    if (section === "dashboard") {
      const dashboardLink = document.querySelector('a[href="#dashboard"]');
      if (dashboardLink) {
        dashboardLink.classList.add("active");
      }
    } else if (section === "recipes") {
      const recipesLink = document.querySelector('a[href="#recipes"]');
      if (recipesLink) {
        recipesLink.classList.add("active");
      }
    } else if (section === "goals") {
      const goalsLink = document.querySelector('a[href="#goals"]');
      if (goalsLink) {
        goalsLink.classList.add("active");
      }
    } else if (section === "activity") {
      const activityLink = document.querySelector('a[href="#activity"]');
      if (activityLink) {
        activityLink.classList.add("active");
      }
    } else if (section === "profile") {
      if (userIcon) {
        userIcon.classList.add("active");
      }
    }
  }

  showProfile() {
    this.currentSection = "profile";
    this.updateActiveNavLink("profile");

    document.querySelectorAll("section").forEach((section) => {
      section.style.display = "none";
    });

    const profile = document.getElementById("profile");
    if (profile) {
      profile.style.display = "block";

      if (window.profileManager) {
        window.profileManager.loadProfileData();
      }
    }

    document.body.classList.remove("home-page");
    document.body.style.overflow = "";
  }

  showSettings() {
    this.currentSection = "settings";
    this.updateActiveNavLink("profile");

    document.querySelectorAll("section").forEach((section) => {
      section.style.display = "none";
    });

    const settings = document.getElementById("settings");
    if (settings) {
      settings.style.display = "block";

      if (window.settingsManager) {
        const userId = getUserId();
        const defaultTab = userId === "guest" ? "display" : "profile";
        window.settingsManager.switchTab(defaultTab);
        window.settingsManager.loadSettings();
        window.settingsManager.updateSettingsTabsVisibility();
      }
    }

    document.body.classList.remove("home-page");
    document.body.style.overflow = "";
  }

  showDashboard() {
    this.currentSection = "dashboard";
    this.updateActiveNavLink("dashboard");

    document.querySelectorAll("section").forEach((section) => {
      section.style.display = "none";
    });

    const dashboard = document.getElementById("dashboard");
    if (dashboard) {
      dashboard.style.display = "block";

      if (window.feedManager) {
        window.feedManager.loadFeedData();
      }
    }

    document.body.classList.remove("home-page");
    document.body.style.overflow = "";
  }

  showActivity() {
    this.currentSection = "activity";
    this.updateActiveNavLink("activity");

    document.querySelectorAll("section").forEach((section) => {
      section.style.display = "none";
    });

    const activity = document.getElementById("activity");
    if (activity) {
      activity.style.display = "block";
    }

    document.body.classList.remove("home-page");
    document.body.style.overflow = "";
  }

  showGoals() {
    this.currentSection = "goals";
    this.updateActiveNavLink("goals");

    document.querySelectorAll("section").forEach((section) => {
      section.style.display = "none";
    });

    const goals = document.getElementById("goals");
    if (goals) {
      goals.style.display = "block";
    }

    document.body.classList.remove("home-page");
    document.body.style.overflow = "";
  }

  async showRecipes() {
    this.currentSection = "recipes";
    this.updateActiveNavLink("recipes");

    document.querySelectorAll("section").forEach((section) => {
      section.style.display = "none";
    });

    const recipes = document.getElementById("recipes");
    if (recipes) {
      recipes.style.display = "block";
    }

    if (window.recipesManager) {
      await window.recipesManager.loadRecipes();
      window.recipesManager.renderRecipes();
    }

    document.body.classList.remove("home-page");
    document.body.style.overflow = "";
  }

  switchTab(tabName) {
    document
      .querySelectorAll(".tab-button")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((content) => content.classList.remove("active"));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
    document.getElementById(`${tabName}-tab`).classList.add("active");
  }
}
