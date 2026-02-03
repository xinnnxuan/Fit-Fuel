class SettingsManager {
  constructor() {
    const userId = getUserId();
    this.currentTab = userId === "guest" ? "display" : "profile";
    this.initializeSettings();
  }

  setupSidebarNavigation() {
    const navItems = document.querySelectorAll(".settings-nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  switchTab(tabName) {
    const userId = getUserId();
    const isGuest = userId === "guest";

    if (isGuest && (tabName === "profile" || tabName === "privacy")) {
      tabName = "display";
    }

    this.currentTab = tabName;

    const navItems = document.querySelectorAll(".settings-nav-item");
    navItems.forEach((item) => {
      if (item.dataset.tab === tabName) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    const tabContents = document.querySelectorAll(".settings-tab-content");
    tabContents.forEach((content) => {
      if (content.id === `${tabName}-tab`) {
        content.classList.add("active");
      } else {
        content.classList.remove("active");
      }
    });

    if (tabName === "display") {
      this.updateDisplayPreferencesVisibility();
    }

    this.updateSettingsTabsVisibility();
  }

  initializeSettings() {
    this.setupSidebarNavigation();

    this.switchTab(this.currentTab);

    this.loadSettings();

    const saveProfileBtn = document.getElementById("save-profile-btn");
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", () =>
        this.saveSettings("profile")
      );
    }

    const saveDisplayBtn = document.getElementById("save-display-btn");
    if (saveDisplayBtn) {
      saveDisplayBtn.addEventListener("click", () =>
        this.saveSettings("display")
      );
    }

    const savePrivacyBtn = document.getElementById("save-privacy-btn");
    if (savePrivacyBtn) {
      savePrivacyBtn.addEventListener("click", () =>
        this.saveSettings("privacy")
      );
    }

    const cancelProfileBtn = document.getElementById("cancel-profile-btn");
    if (cancelProfileBtn) {
      cancelProfileBtn.addEventListener("click", () =>
        this.cancelSettings("profile")
      );
    }

    const editPhotoBtn = document.getElementById("edit-photo-btn");
    const photoInput = document.getElementById("photo-input");

    if (editPhotoBtn && photoInput) {
      editPhotoBtn.addEventListener("click", () => photoInput.click());
      photoInput.addEventListener("change", (e) => this.handlePhotoUpload(e));
    }

    const startTrialBtn = document.getElementById("start-trial-btn");
    if (startTrialBtn) {
      startTrialBtn.addEventListener("click", () => {
        alertManager.info("Free trial feature coming soon!");
      });
    }

    const learnMoreLink = document.getElementById("learn-more-feed");
    if (learnMoreLink) {
      learnMoreLink.addEventListener("click", (e) => {
        e.preventDefault();
        alertManager.info(
          "Dash order determines how activities appear in your dashboard. Personalized uses your preferences and activity history to show relevant content first."
        );
      });
    }

    const exportDataBtn = document.getElementById("export-data-btn");
    if (exportDataBtn) {
      exportDataBtn.addEventListener("click", () => this.exportData());
    }

    const deleteAccountBtn = document.getElementById("delete-account-btn");
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener("click", () =>
        this.showDeleteAccountConfirmation()
      );
    }

    this.setupThemeColorHandlers();
    this.applyThemeColors();
    this.updateDisplayPreferencesVisibility();
    this.updateSettingsTabsVisibility();
    this.setupPrivacyRadioHandlers();
  }

  setupPrivacyRadioHandlers() {
    const privacyRadioGroups = [
      {
        name: "profile-visibility",
        descriptions: {
          everyone:
            "Anyone on FitFuel can search for and view your complete profile page and activity summaries, as well as follow you. Anyone on the web can search for and view certain profile information.",
          followers:
            "Only your followers can view your complete profile page and activity summaries.",
          "only-you": "Your profile page is private. Only you can view it.",
        },
      },
      {
        name: "activity-visibility",
        descriptions: {
          everyone:
            "Anyone on FitFuel can view your activities. Your activities will be visible on segment and challenge leaderboards, and other FitFuel features.",
          followers:
            "Only your followers can view your activities. Your activities will not appear on public leaderboards.",
          "only-you": "Your activities are private. Only you can view them.",
        },
      },
      {
        name: "group-activity-visibility",
        descriptions: {
          everyone: "Your recipes will be visible to anyone on FitFuel.",
          followers: "Your recipes will be visible only to your followers.",
          "only-you": "Your recipes are private. Only you can view them.",
        },
      },
      {
        name: "flyby-visibility",
        descriptions: {
          everyone:
            "Your activities will be visible on Flybys to anyone on FitFuel or the web.",
          "no-one":
            "Your activities will not be visible on Flybys to you or to anyone else.",
        },
      },
      {
        name: "local-legends-visibility",
        descriptions: {
          everyone:
            "Only activities marked as 'Everyone' will be counted towards Local Legends. If you are the Local Legend your name and achievement will be visible to everyone. If you're not the Local Legend, your effort count and histogram placement are only visible to you.",
          followers:
            "Only your followers can see your Local Legends participation.",
          "only-you":
            "Your Local Legends participation is private. Only you can view it.",
        },
      },
      {
        name: "mentions-visibility",
        descriptions: {
          everyone: "There are no restrictions on who can mention you.",
          followers: "Only your followers can mention you.",
          "only-you": "No one can mention you.",
        },
      },
    ];

    privacyRadioGroups.forEach((group) => {
      const radios = document.querySelectorAll(`input[name="${group.name}"]`);
      radios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
          const selectedValue = e.target.value;
          const description = group.descriptions[selectedValue];
          if (description) {
            const box = e.target.closest(".who-can-see-box");
            const descElement = box?.querySelector(".who-can-see-description");
            if (descElement) {
              descElement.textContent = description;
            }
          }
        });
      });
    });
  }

  updateDisplayPreferencesVisibility() {
    const userId = getUserId();
    const isGuest = userId === "guest";
    const guestOnlyHiddenItems =
      document.querySelectorAll(".guest-only-hidden");

    guestOnlyHiddenItems.forEach((item) => {
      if (isGuest) {
        item.style.display = "none";
      } else {
        item.style.display = "";
      }
    });
  }

  updateSettingsTabsVisibility() {
    const userId = getUserId();
    const isGuest = userId === "guest";
    const guestOnlyHiddenTabs = document.querySelectorAll(
      ".settings-nav-item.guest-only-hidden"
    );
    const profileTab = document.getElementById("profile-tab");
    const privacyTab = document.getElementById("privacy-tab");

    guestOnlyHiddenTabs.forEach((tab) => {
      if (isGuest) {
        tab.style.display = "none";
      } else {
        tab.style.display = "";
      }
    });

    if (isGuest) {
      if (profileTab) profileTab.style.display = "none";
      if (privacyTab) privacyTab.style.display = "none";

      const displayTab = document.getElementById("display-tab");
      const displayNavItem = document.querySelector(
        '.settings-nav-item[data-tab="display"]'
      );

      if (displayTab && !displayTab.classList.contains("active")) {
        document
          .querySelectorAll(".settings-tab-content")
          .forEach((content) => {
            content.classList.remove("active");
          });
        document.querySelectorAll(".settings-nav-item").forEach((item) => {
          item.classList.remove("active");
        });
        displayTab.classList.add("active");
        if (displayNavItem) displayNavItem.classList.add("active");
        this.currentTab = "display";
      }
    } else {
      if (profileTab) profileTab.style.display = "";
      if (privacyTab) privacyTab.style.display = "";
    }
  }

  setupThemeColorHandlers() {
    const primaryColorPicker = document.getElementById("primary-color");
    const primaryColorHex = document.getElementById("primary-color-hex");
    const secondaryColorPicker = document.getElementById("secondary-color");
    const secondaryColorHex = document.getElementById("secondary-color-hex");
    const accentColorPicker = document.getElementById("accent-color");
    const accentColorHex = document.getElementById("accent-color-hex");

    if (primaryColorPicker && primaryColorHex) {
      primaryColorPicker.addEventListener("input", (e) => {
        const color = e.target.value;
        primaryColorHex.value = color;
        this.applyThemeColor("primary", color);
      });

      primaryColorHex.addEventListener("input", (e) => {
        const color = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(color)) {
          primaryColorPicker.value = color;
          this.applyThemeColor("primary", color);
        }
      });
    }

    if (secondaryColorPicker && secondaryColorHex) {
      secondaryColorPicker.addEventListener("input", (e) => {
        const color = e.target.value;
        secondaryColorHex.value = color;
        this.applyThemeColor("secondary", color);
      });

      secondaryColorHex.addEventListener("input", (e) => {
        const color = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(color)) {
          secondaryColorPicker.value = color;
          this.applyThemeColor("secondary", color);
        }
      });
    }

    if (accentColorPicker && accentColorHex) {
      accentColorPicker.addEventListener("input", (e) => {
        const color = e.target.value;
        accentColorHex.value = color;
        this.applyThemeColor("accent", color);
      });

      accentColorHex.addEventListener("input", (e) => {
        const color = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(color)) {
          accentColorPicker.value = color;
          this.applyThemeColor("accent", color);
        }
      });
    }
  }

  applyThemeColor(type, color) {
    const root = document.documentElement;
    root.style.setProperty(`--theme-${type}-color`, color);
  }

  applyThemeColors() {
    const savedSettings = localStorage.getItem("fitfuel-settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.themePrimaryColor) {
          this.applyThemeColor("primary", settings.themePrimaryColor);
          const primaryColorPicker = document.getElementById("primary-color");
          const primaryColorHex = document.getElementById("primary-color-hex");
          if (primaryColorPicker)
            primaryColorPicker.value = settings.themePrimaryColor;
          if (primaryColorHex)
            primaryColorHex.value = settings.themePrimaryColor;
        }
        if (settings.themeSecondaryColor) {
          this.applyThemeColor("secondary", settings.themeSecondaryColor);
          const secondaryColorPicker =
            document.getElementById("secondary-color");
          const secondaryColorHex = document.getElementById(
            "secondary-color-hex"
          );
          if (secondaryColorPicker)
            secondaryColorPicker.value = settings.themeSecondaryColor;
          if (secondaryColorHex)
            secondaryColorHex.value = settings.themeSecondaryColor;
        }
        if (settings.themeAccentColor) {
          this.applyThemeColor("accent", settings.themeAccentColor);
          const accentColorPicker = document.getElementById("accent-color");
          const accentColorHex = document.getElementById("accent-color-hex");
          if (accentColorPicker)
            accentColorPicker.value = settings.themeAccentColor;
          if (accentColorHex) accentColorHex.value = settings.themeAccentColor;
        }
      } catch (error) {
        console.error("Error applying theme colors: ", error);
      }
    }
  }

  async loadSettings() {
    const userId = getUserId();

    if (userId !== "guest") {
      try {
        const response = await ApiService.getCurrentUser();
        if (response.user) {
          const user = response.user;

          const profileNameInput = document.getElementById("profile-name");
          if (profileNameInput) profileNameInput.value = user.name || "";

          const emailInput = document.getElementById("email-address");
          if (emailInput) emailInput.value = user.email || "";

          const sidebarEmail = document.getElementById("sidebar-email");
          if (sidebarEmail)
            sidebarEmail.textContent = user.email || "paaanda919@gmail.com";

          const locationInput = document.getElementById("profile-location");
          if (locationInput) locationInput.value = user.location || "";

          this.updatePhotoInitials(user.name || "XX");
        }

        const preferencesResponse = await ApiService.getPreferences();
        if (preferencesResponse.preferences) {
          const prefs = preferencesResponse.preferences;

          if (prefs.profileData) {
            const profileData = prefs.profileData;
            const profileNameInput = document.getElementById("profile-name");
            if (profileNameInput && profileData.name)
              profileNameInput.value = profileData.name;

            const profileBirthdayInput =
              document.getElementById("profile-birthday");
            if (profileBirthdayInput && profileData.birthday)
              profileBirthdayInput.value = profileData.birthday;

            const profileGenderSelect =
              document.getElementById("profile-gender");
            if (profileGenderSelect && profileData.gender)
              profileGenderSelect.value = profileData.gender;

            const profileLocationInput =
              document.getElementById("profile-location");
            if (profileLocationInput && profileData.location)
              profileLocationInput.value = profileData.location;

            const profileClubInput = document.getElementById("profile-club");
            if (profileClubInput && profileData.club)
              profileClubInput.value = profileData.club;

            const profileVanityUrlInput =
              document.getElementById("profile-vanity-url");
            if (profileVanityUrlInput && profileData.vanityUrl)
              profileVanityUrlInput.value = profileData.vanityUrl;

            const profileBioTextarea = document.getElementById("profile-bio");
            if (profileBioTextarea && profileData.bio)
              profileBioTextarea.value = profileData.bio;

            if (profileData.photoUrl) {
              this.setProfilePhoto(profileData.photoUrl);
            } else if (profileData.name) {
              this.updatePhotoInitials(profileData.name);
            }
          }

          if (prefs.displaySettings) {
            const displaySettings = prefs.displaySettings;

            const unitsMeasurements =
              document.getElementById("units-measurements");
            if (unitsMeasurements && displaySettings.unitsMeasurements) {
              unitsMeasurements.value = displaySettings.unitsMeasurements;
            }

            const temperature = document.getElementById("temperature");
            if (temperature && displaySettings.temperature) {
              temperature.value = displaySettings.temperature;
            }

            const leaderboardView = document.getElementById("leaderboard-view");
            if (leaderboardView && displaySettings.leaderboardView) {
              leaderboardView.value = displaySettings.leaderboardView;
            }

            const highlightImage = document.getElementById("highlight-image");
            if (highlightImage && displaySettings.highlightImage) {
              highlightImage.value = displaySettings.highlightImage;
            }

            const feedOrdering = document.getElementById("feed-ordering");
            if (feedOrdering && displaySettings.feedOrdering) {
              feedOrdering.value = displaySettings.feedOrdering;
            }

            const recommendationPeriodDefault = document.getElementById(
              "recommendation-period-default"
            );
            if (
              recommendationPeriodDefault &&
              displaySettings.recommendationPeriodDefault
            ) {
              recommendationPeriodDefault.value =
                displaySettings.recommendationPeriodDefault;
            }

            const primaryColorPicker = document.getElementById("primary-color");
            const primaryColorHex =
              document.getElementById("primary-color-hex");
            if (displaySettings.themePrimaryColor) {
              if (primaryColorPicker)
                primaryColorPicker.value = displaySettings.themePrimaryColor;
              if (primaryColorHex)
                primaryColorHex.value = displaySettings.themePrimaryColor;
            }

            const secondaryColorPicker =
              document.getElementById("secondary-color");
            const secondaryColorHex = document.getElementById(
              "secondary-color-hex"
            );
            if (displaySettings.themeSecondaryColor) {
              if (secondaryColorPicker)
                secondaryColorPicker.value =
                  displaySettings.themeSecondaryColor;
              if (secondaryColorHex)
                secondaryColorHex.value = displaySettings.themeSecondaryColor;
            }

            const accentColorPicker = document.getElementById("accent-color");
            const accentColorHex = document.getElementById("accent-color-hex");
            if (displaySettings.themeAccentColor) {
              if (accentColorPicker)
                accentColorPicker.value = displaySettings.themeAccentColor;
              if (accentColorHex)
                accentColorHex.value = displaySettings.themeAccentColor;
            }

            this.applyThemeColors();
          }

          if (prefs.profileVisibility) {
            const profileVisibilityRadio = document.querySelector(
              `input[name="profile-visibility"][value="${prefs.profileVisibility}"]`
            );
            if (profileVisibilityRadio) profileVisibilityRadio.checked = true;
          }
          if (prefs.activityVisibility) {
            const activityVisibilityRadio = document.querySelector(
              `input[name="activity-visibility"][value="${prefs.activityVisibility}"]`
            );
            if (activityVisibilityRadio) activityVisibilityRadio.checked = true;
          }
          if (prefs.recipeVisibility) {
            const recipeVisibilityRadio = document.querySelector(
              `input[name="group-activity-visibility"][value="${prefs.recipeVisibility}"]`
            );
            if (recipeVisibilityRadio) recipeVisibilityRadio.checked = true;
          }
          if (prefs.mentionsVisibility) {
            const mentionsVisibilityRadio = document.querySelector(
              `input[name="mentions-visibility"][value="${prefs.mentionsVisibility}"]`
            );
            if (mentionsVisibilityRadio) mentionsVisibilityRadio.checked = true;
          }
        }
      } catch (error) {
        console.error("Error loading user settings: ", error);
      }
    }

    const savedProfile = localStorage.getItem("fitfuel-profile");
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);

        const profileNameInput = document.getElementById("profile-name");
        if (profileNameInput && profile.name)
          profileNameInput.value = profile.name;

        const profileBirthdayInput =
          document.getElementById("profile-birthday");
        if (profileBirthdayInput && profile.birthday)
          profileBirthdayInput.value = profile.birthday;

        const profileGenderSelect = document.getElementById("profile-gender");
        if (profileGenderSelect && profile.gender)
          profileGenderSelect.value = profile.gender;

        const profileLocationInput =
          document.getElementById("profile-location");
        if (profileLocationInput && profile.location)
          profileLocationInput.value = profile.location;

        const profileClubInput = document.getElementById("profile-club");
        if (profileClubInput && profile.club)
          profileClubInput.value = profile.club;

        const profileVanityUrlInput =
          document.getElementById("profile-vanity-url");
        if (profileVanityUrlInput && profile.vanityUrl)
          profileVanityUrlInput.value = profile.vanityUrl;

        const profileBioTextarea = document.getElementById("profile-bio");
        if (profileBioTextarea && profile.bio)
          profileBioTextarea.value = profile.bio;

        if (profile.photoUrl) {
          this.setProfilePhoto(profile.photoUrl);
        } else if (profile.name) {
          this.updatePhotoInitials(profile.name);
        }
      } catch (error) {
        console.error("Error parsing saved profile: ", error);
      }
    }

    const savedSettings = localStorage.getItem("fitfuel-settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);

        const profileVisibility = document.getElementById("profile-visibility");
        if (profileVisibility && settings.profileVisibility) {
          profileVisibility.value = settings.profileVisibility;
        }

        const activityVisibility = document.getElementById(
          "activity-visibility"
        );
        if (activityVisibility && settings.activityVisibility) {
          activityVisibility.value = settings.activityVisibility;
        }

        const unitsMeasurements = document.getElementById("units-measurements");
        if (unitsMeasurements && settings.unitsMeasurements) {
          unitsMeasurements.value = settings.unitsMeasurements;
        }

        const temperature = document.getElementById("temperature");
        if (temperature && settings.temperature) {
          temperature.value = settings.temperature;
        }

        const leaderboardView = document.getElementById("leaderboard-view");
        if (leaderboardView && settings.leaderboardView) {
          leaderboardView.value = settings.leaderboardView;
        }

        const highlightImage = document.getElementById("highlight-image");
        if (highlightImage && settings.highlightImage) {
          highlightImage.value = settings.highlightImage;
        }

        const feedOrdering = document.getElementById("feed-ordering");
        if (feedOrdering && settings.feedOrdering) {
          feedOrdering.value = settings.feedOrdering;
        }

        const recommendationPeriodDefault = document.getElementById(
          "recommendation-period-default"
        );
        if (
          recommendationPeriodDefault &&
          settings.recommendationPeriodDefault
        ) {
          recommendationPeriodDefault.value =
            settings.recommendationPeriodDefault;
        }

        const primaryColorPicker = document.getElementById("primary-color");
        const primaryColorHex = document.getElementById("primary-color-hex");
        if (settings.themePrimaryColor) {
          if (primaryColorPicker)
            primaryColorPicker.value = settings.themePrimaryColor;
          if (primaryColorHex)
            primaryColorHex.value = settings.themePrimaryColor;
        }

        const secondaryColorPicker = document.getElementById("secondary-color");
        const secondaryColorHex = document.getElementById(
          "secondary-color-hex"
        );
        if (settings.themeSecondaryColor) {
          if (secondaryColorPicker)
            secondaryColorPicker.value = settings.themeSecondaryColor;
          if (secondaryColorHex)
            secondaryColorHex.value = settings.themeSecondaryColor;
        }

        const accentColorPicker = document.getElementById("accent-color");
        const accentColorHex = document.getElementById("accent-color-hex");
        if (settings.themeAccentColor) {
          if (accentColorPicker)
            accentColorPicker.value = settings.themeAccentColor;
          if (accentColorHex) accentColorHex.value = settings.themeAccentColor;
        }

        const profileVisibilityRadio = document.querySelector(
          `input[name="profile-visibility"][value="${settings.profileVisibility}"]`
        );
        if (profileVisibilityRadio) profileVisibilityRadio.checked = true;

        const activityVisibilityRadio = document.querySelector(
          `input[name="activity-visibility"][value="${settings.activityVisibility}"]`
        );
        if (activityVisibilityRadio) activityVisibilityRadio.checked = true;

        const recipeVisibilityRadio = document.querySelector(
          `input[name="group-activity-visibility"][value="${settings.recipeVisibility}"]`
        );
        if (recipeVisibilityRadio) recipeVisibilityRadio.checked = true;

        const flybyVisibilityRadio = document.querySelector(
          `input[name="flyby-visibility"][value="${settings.flybyVisibility}"]`
        );
        if (flybyVisibilityRadio) flybyVisibilityRadio.checked = true;

        const localLegendsVisibilityRadio = document.querySelector(
          `input[name="local-legends-visibility"][value="${settings.localLegendsVisibility}"]`
        );
        if (localLegendsVisibilityRadio)
          localLegendsVisibilityRadio.checked = true;

        const mentionsVisibilityRadio = document.querySelector(
          `input[name="mentions-visibility"][value="${settings.mentionsVisibility}"]`
        );
        if (mentionsVisibilityRadio) mentionsVisibilityRadio.checked = true;

        const hideAllMapsToggle = document.getElementById("hide-all-maps");
        if (hideAllMapsToggle !== null)
          hideAllMapsToggle.checked = settings.hideAllMaps || false;

        const contributeDataCheckbox =
          document.getElementById("contribute-data");
        if (contributeDataCheckbox !== null)
          contributeDataCheckbox.checked = settings.contributeData !== false;

        const sharePhotosCheckbox = document.getElementById("share-photos");
        if (sharePhotosCheckbox !== null)
          sharePhotosCheckbox.checked = settings.sharePhotos !== false;

        const editPastActivitiesCheckboxes = document.querySelectorAll(
          'input[name="edit-past-activities"]'
        );
        if (
          settings.editPastActivities &&
          Array.isArray(settings.editPastActivities)
        ) {
          editPastActivitiesCheckboxes.forEach((checkbox) => {
            checkbox.checked = settings.editPastActivities.includes(
              checkbox.value
            );
          });
        }
      } catch (error) {
        console.error("Error parsing saved settings: ", error);
      }
    }

    const editPastActivitiesCheckboxes = document.querySelectorAll(
      'input[name="edit-past-activities"]'
    );
    const editPastActivitiesNextBtn = document.getElementById(
      "edit-past-activities-next"
    );
    if (editPastActivitiesCheckboxes.length > 0 && editPastActivitiesNextBtn) {
      editPastActivitiesCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          const anyChecked = Array.from(editPastActivitiesCheckboxes).some(
            (cb) => cb.checked
          );
          editPastActivitiesNextBtn.disabled = !anyChecked;
        });
      });
    }
  }

  updatePhotoInitials(name) {
    const photoInitials = document.getElementById("photo-initials");
    if (photoInitials && name) {
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      photoInitials.textContent = initials || "XX";
    }
  }

  handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        this.setProfilePhoto(event.target.result);

        const savedProfile = localStorage.getItem("fitfuel-profile");
        if (savedProfile) {
          try {
            const profile = JSON.parse(savedProfile);
            profile.photoUrl = event.target.result;
            localStorage.setItem("fitfuel-profile", JSON.stringify(profile));
          } catch (error) {
            console.error("Error saving photo URL: ", error);
          }
        }
        alertManager.success("Profile photo updated!");
      };
      reader.readAsDataURL(file);
    }
  }

  setProfilePhoto(photoUrl) {
    const photoPlaceholder = document.getElementById("profile-photo");
    if (photoPlaceholder) {
      photoPlaceholder.style.backgroundImage = `url(${photoUrl})`;
      photoPlaceholder.style.backgroundSize = "cover";
      photoPlaceholder.style.backgroundPosition = "center";
      const initials = photoPlaceholder.querySelector(".photo-initials");
      if (initials) initials.style.display = "none";
    }
  }

  async saveSettings(tab = null) {
    const activeTab = tab || this.currentTab;
    const userId = getUserId();

    if (activeTab === "profile") {
      const profileData = {
        name: document.getElementById("profile-name")?.value || "",
        birthday: document.getElementById("profile-birthday")?.value || "",
        gender: document.getElementById("profile-gender")?.value || "",
        location: document.getElementById("profile-location")?.value || "",
        club: document.getElementById("profile-club")?.value || "",
        vanityUrl: document.getElementById("profile-vanity-url")?.value || "",
        bio: document.getElementById("profile-bio")?.value || "",
      };

      if (profileData.name) {
        this.updatePhotoInitials(profileData.name);
      }

      const photoPlaceholder = document.getElementById("profile-photo");
      if (photoPlaceholder && photoPlaceholder.style.backgroundImage) {
        const bgImage = photoPlaceholder.style.backgroundImage;
        if (bgImage && bgImage !== "none") {
          profileData.photoUrl = bgImage
            .replace('url("', "")
            .replace('")', "")
            .replace("url(", "")
            .replace(")", "");
        }
      }

      localStorage.setItem("fitfuel-profile", JSON.stringify(profileData));

      if (userId !== "guest") {
        try {
          await ApiService.updateProfileSettings(profileData);
        } catch (error) {
          console.error("Error saving profile settings to backend:", error);
        }
      }

      alertManager.success("Profile updated successfully!");
      return;
    }

    if (activeTab === "display") {
      const displaySettings = {
        unitsMeasurements:
          document.getElementById("units-measurements")?.value || "metric",
        temperature: document.getElementById("temperature")?.value || "celsius",
        leaderboardView:
          document.getElementById("leaderboard-view")?.value || "all",
        highlightImage:
          document.getElementById("highlight-image")?.value || "photo",
        feedOrdering:
          document.getElementById("feed-ordering")?.value || "personalized",
        recommendationPeriodDefault:
          document.getElementById("recommendation-period-default")?.value ||
          "7",
        themePrimaryColor:
          document.getElementById("primary-color")?.value || "#000000",
        themeSecondaryColor:
          document.getElementById("secondary-color")?.value || "#ffffff",
        themeAccentColor:
          document.getElementById("accent-color")?.value || "#666666",
      };

      const existingSettings = JSON.parse(
        localStorage.getItem("fitfuel-settings") || "{}"
      );
      const updatedSettings = { ...existingSettings, ...displaySettings };
      localStorage.setItem("fitfuel-settings", JSON.stringify(updatedSettings));

      if (userId !== "guest") {
        try {
          await ApiService.updateDisplaySettings(displaySettings);
        } catch (error) {
          console.error("Error saving display settings to backend:", error);
        }
      }

      this.applyThemeColors();

      alertManager.success("Display preferences saved successfully!");
      return;
    }

    if (activeTab === "privacy") {
      const userId = getUserId();
      const privacySettings = {
        profileVisibility:
          document.querySelector('input[name="profile-visibility"]:checked')
            ?.value || "everyone",
        activityVisibility:
          document.querySelector('input[name="activity-visibility"]:checked')
            ?.value || "everyone",
        recipeVisibility:
          document.querySelector(
            'input[name="group-activity-visibility"]:checked'
          )?.value || "everyone",
        flybyVisibility:
          document.querySelector('input[name="flyby-visibility"]:checked')
            ?.value || "no-one",
        localLegendsVisibility:
          document.querySelector(
            'input[name="local-legends-visibility"]:checked'
          )?.value || "everyone",
        mentionsVisibility:
          document.querySelector('input[name="mentions-visibility"]:checked')
            ?.value || "everyone",
        hideAllMaps: document.getElementById("hide-all-maps")?.checked || false,
        contributeData:
          document.getElementById("contribute-data")?.checked || false,
        sharePhotos: document.getElementById("share-photos")?.checked || false,
        editPastActivities: Array.from(
          document.querySelectorAll(
            'input[name="edit-past-activities"]:checked'
          )
        ).map((cb) => cb.value),
      };

      const existingSettings = JSON.parse(
        localStorage.getItem("fitfuel-settings") || "{}"
      );
      const updatedSettings = { ...existingSettings, ...privacySettings };
      localStorage.setItem("fitfuel-settings", JSON.stringify(updatedSettings));

      if (userId !== "guest") {
        try {
          await ApiService.updatePrivacySettings({
            profileVisibility: privacySettings.profileVisibility,
            activityVisibility: privacySettings.activityVisibility,
            recipeVisibility: privacySettings.recipeVisibility,
            mentionsVisibility: privacySettings.mentionsVisibility,
          });
        } catch (error) {
          console.error("Error saving privacy settings to backend:", error);
        }
      }

      alertManager.success("Privacy settings saved successfully!");
      return;
    }

    alertManager.success("Settings saved successfully!");

    if (userId !== "guest") {
      try {
        localStorage.setItem("fitfuel-settings", JSON.stringify(settings));
        alertManager.success("Settings saved successfully!");
      } catch (error) {
        console.error("Error saving settings: ", error);
        alertManager.error("Failed to save settings. Please try again.");
      }
    } else {
      localStorage.setItem("fitfuel-settings", JSON.stringify(settings));
      alertManager.success("Settings saved successfully!");
    }
  }

  cancelSettings(tab = null) {
    this.loadSettings();
    alertManager.info("Changes discarded.");
  }

  showChangePasswordModal() {
    alertManager.info("Change password feature coming soon!");
  }

  exportData() {
    const userId = getUserId();

    const userData = {
      userId: userId,
      settings: JSON.parse(localStorage.getItem("fitfuel-settings") || "{}"),
      goal: JSON.parse(localStorage.getItem("fitfuel-goal") || "{}"),
      savedPosts: JSON.parse(
        localStorage.getItem(getStorageKey(StorageKeys.SAVED_POSTS)) || "[]"
      ),
      likedPosts: JSON.parse(
        localStorage.getItem(getStorageKey(StorageKeys.LIKED_POSTS)) || "[]"
      ),
      savedRecipes: JSON.parse(
        localStorage.getItem(getStorageKey(StorageKeys.SAVED_RECIPES)) || "[]"
      ),
      likedRecipes: JSON.parse(
        localStorage.getItem(getStorageKey(StorageKeys.LIKED_RECIPES)) || "[]"
      ),
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fitfuel-data-${userId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alertManager.success("Data exported successfully!");
  }

  showDeleteAccountConfirmation() {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
      )
    ) {
      this.deleteAccount();
    }
  }

  async deleteAccount() {
    const userId = getUserId();

    if (userId !== "guest") {
      try {
        localStorage.clear();
        alertManager.success(
          "Account deleted successfully. Redirecting to home..."
        );

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error deleting account: ", error);
        alertManager.error("Failed to delete account. Please try again.");
      }
    } else {
      localStorage.clear();
      alertManager.success("Account data cleared. Redirecting to home...");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.settingsManager = new SettingsManager();
  });
} else {
  window.settingsManager = new SettingsManager();
}
