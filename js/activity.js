class ActivityFormManager {
  constructor() {
    this.uploadedImages = [];
    this.initializeForm();
  }

  initializeForm() {
    const activityForm = document.getElementById("activity-form");
    if (activityForm) {
      activityForm.addEventListener("submit", (e) =>
        this.handleActivitySubmit(e)
      );
    }

    this.initializeSidebarNavigation();

    const dateInput = document.getElementById("date");
    if (dateInput) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.value = today;
    }

    const timeInput = document.getElementById("time");
    if (timeInput) {
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5);
      timeInput.value = timeString;
    }

    this.updateTitlePlaceholder();

    const sportSelect = document.getElementById("sport");
    if (sportSelect) {
      sportSelect.addEventListener("change", () => {
        this.updateTitlePlaceholder();
      });
    }

    const imageUpload = document.getElementById("activity-image-upload");
    if (imageUpload) {
      imageUpload.addEventListener("change", (e) => this.handleImageUpload(e));
    }
  }

  updateTitlePlaceholder() {
    const titleInput = document.getElementById("title");
    if (!titleInput) return;

    const sportSelect = document.getElementById("sport");
    const selectedSport = sportSelect ? sportSelect.value : "ride";

    const sportNames = {
      virtual_ride: "Virtual Ride",
      ride: "Ride",
      run: "Run",
      swim: "Swim",
      walk: "Walk",
      hike: "Hike",
      trail_run: "Trail Run",
      mountain_bike_ride: "Mountain Bike Ride",
      gravel_ride: "Gravel Ride",
      e_bike_ride: "E-Bike Ride",
      e_mountain_bike_ride: "E-Mountain Bike Ride",
      alpine_ski: "Alpine Ski",
      badminton: "Badminton",
      backcountry_ski: "Backcountry Ski",
      canoe: "Canoe",
      crossfit: "Crossfit",
      elliptical: "Elliptical",
      golf: "Golf",
      ice_skate: "Ice Skate",
      inline_skate: "Inline Skate",
      handcycle: "Handcycle",
      hiit: "HIIT",
      kayaking: "Kayaking",
      kitesurf: "Kitesurf",
      nordic_ski: "Nordic Ski",
      pickleball: "Pickleball",
      pilates: "Pilates",
      racquetball: "Racquetball",
      rock_climb: "Rock Climb",
      roller_ski: "Roller Ski",
      rowing: "Rowing",
      sail: "Sail",
      skateboard: "Skateboard",
      snowboard: "Snowboard",
      snowshoe: "Snowshoe",
      soccer: "Football (Soccer)",
      squash: "Squash",
      stand_up_paddling: "Stand Up Paddling",
      stair_stepper: "Stair-Stepper",
      surfing: "Surfing",
      table_tennis: "Table Tennis",
      tennis: "Tennis",
      velomobile: "Velomobile",
      virtual_run: "Virtual Run",
      virtual_rowing: "Virtual Rowing",
      weight_training: "Weight Training",
      windsurf: "Windsurf",
      wheelchair: "Wheelchair",
      workout: "Workout",
      yoga: "Yoga",
      other: "Other",
    };

    const sportName = sportNames[selectedSport] || "Ride";

    const now = new Date();
    const hours = now.getHours();

    let timePrefix = "";

    if (hours >= 0 && hours < 12) {
      timePrefix = "Morning ";
    } else if (hours >= 12 && hours < 17) {
      timePrefix = "Afternoon ";
    } else if (hours >= 17 && hours < 24) {
      timePrefix = "Night ";
    }

    titleInput.placeholder = timePrefix + sportName;
  }

  initializeSidebarNavigation() {
    const navButtons = document.querySelectorAll(".activity-nav-btn");
    navButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const section = button.getAttribute("data-section");
        this.switchActivitySection(section);
      });
    });
  }

  switchActivitySection(sectionName) {
    document.querySelectorAll(".activity-nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    const activeButton = document.querySelector(
      `[data-section="${sectionName}"]`
    );
    if (activeButton) {
      activeButton.classList.add("active");
    }

    document.querySelectorAll(".activity-section").forEach((section) => {
      section.classList.remove("active");
    });

    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add("active");
    }
  }

  async handleActivitySubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const imageFiles = document.getElementById("activity-image-upload")?.files;
    let imageBase64Array = [];

    if (imageFiles && imageFiles.length > 0) {
      imageBase64Array = await Promise.all(
        Array.from(imageFiles).map((file) => this.convertImageToBase64(file))
      );
    }

    const activityData = {
      distance: parseFloat(formData.get("distance")) || 0,
      distanceUnit: formData.get("distanceUnit"),
      hours: parseInt(formData.get("hours")) || 0,
      minutes: parseInt(formData.get("minutes")) || 0,
      seconds: parseInt(formData.get("seconds")) || 0,
      elevation: parseFloat(formData.get("elevation")) || 0,
      elevationUnit: formData.get("elevationUnit"),
      sport: formData.get("sport"),
      date: formData.get("date"),
      time: formData.get("time"),
      title: formData.get("title"),
      description: formData.get("description"),
      activityType: formData.get("activityType"),
      tags: formData.getAll("tags"),
      exertion: parseInt(formData.get("exertion")),
      privacy: formData.get("privacy"),
      hiddenDetails: formData.getAll("hiddenDetails"),
      privateNotes: formData.get("privateNotes"),
      images: imageBase64Array,
    };

    const totalMinutes =
      activityData.hours * 60 +
      activityData.minutes +
      activityData.seconds / 60;

    const caloriesBurned = this.calculateCalories(
      activityData.sport,
      totalMinutes,
      activityData.distance
    );

    const userId = getUserId();
    if (userId === "guest") {
      alertManager.info("Please log in to save activities.");
      return;
    }

    const intensityMap = {
      1: "low",
      2: "low",
      3: "moderate",
      4: "moderate",
      5: "high",
    };

    const sportTypeMap = {
      ride: "cardio",
      run: "cardio",
      walk: "cardio",
      swim: "cardio",
      weight_training: "strength",
      yoga: "flexibility",
      other: "other",
    };

    const activityPayload = {
      type: sportTypeMap[activityData.sport] || "other",
      title: activityData.title || activityData.sport || "Activity",
      description: activityData.description || "",
      duration: totalMinutes,
      intensity: intensityMap[activityData.exertion] || "moderate",
      calories: Math.round(caloriesBurned),
      date: activityData.date || new Date().toISOString().split("T")[0],
      metrics: {
        distance: activityData.distance || 0,
      },
      images: activityData.images || [],
    };

    try {
      const response = await ApiService.createActivity(activityPayload);

      if (window.feedManager) {
        const newActivity = {
          id: response.activity?._id || Date.now(),
          user: { name: "You", avatar: "Y" },
          timestamp: new Date().toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          type: "workout",
          title: activityPayload.title,
          description: activityPayload.description,
          metrics: activityPayload.metrics,
          images: activityPayload.images || [],
          isUserUpload: true,
        };

        window.feedManager.feedPosts.unshift(newActivity);
      }

      if (window.profileManager) {
        window.profileManager.addActivity(caloriesBurned);
        window.profileManager.updateTotalCounters();
      }

      alertManager.success(
        `Activity logged successfully! You burned approximately ${Math.round(
          caloriesBurned
        )} calories.`
      );

      e.target.reset();
      this.clearImagePreview();

      if (window.profileManager) {
        window.profileManager.showProfile();
      }
    } catch (error) {
      console.error("Error creating activity:", error);
      alertManager.error("Failed to save activity. Please try again.");
    }
  }

  handleImageUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) {
      this.clearImagePreview();
      return;
    }

    const previewContainer = document.getElementById("activity-images-preview");
    if (!previewContainer) return;

    previewContainer.innerHTML = "";
    previewContainer.style.display = "grid";

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageWrapper = document.createElement("div");
        imageWrapper.style.position = "relative";
        imageWrapper.style.width = "150px";
        imageWrapper.style.height = "150px";

        const img = document.createElement("img");
        img.src = event.target.result;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "8px";
        img.style.border = "1px solid #e0e0e0";

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.innerHTML = "×";
        removeBtn.style.cssText = `
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    font-size: 18px;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
        removeBtn.onclick = () => {
          this.removeImageFromPreview(index, file);
        };

        imageWrapper.appendChild(img);
        imageWrapper.appendChild(removeBtn);
        previewContainer.appendChild(imageWrapper);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImageFromPreview(index, file) {
    const fileInput = document.getElementById("activity-image-upload");
    if (!fileInput) return;

    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);
    files.forEach((f, i) => {
      if (i !== index) {
        dt.items.add(f);
      }
    });
    fileInput.files = dt.files;

    const event = new Event("change", { bubbles: true });
    fileInput.dispatchEvent(event);
  }

  clearImagePreview() {
    const previewContainer = document.getElementById("activity-images-preview");
    if (previewContainer) {
      previewContainer.innerHTML = "";
      previewContainer.style.display = "none";
    }
    const fileInput = document.getElementById("activity-image-upload");
    if (fileInput) {
      fileInput.value = "";
    }
    this.uploadedImages = [];
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

  calculateCalories(sport, durationMinutes, distance) {
    const baseRates = {
      ride: 8,
      run: 12,
      walk: 4,
      swim: 10,
      weight_training: 6,
      yoga: 3,
      other: 5,
    };

    const baseRate = baseRates[sport] || 5;
    return Math.round(baseRate * durationMinutes);
  }
}
