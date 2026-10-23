const navigationButtons = document.querySelectorAll(".nav-button");
const profileMenu = document.querySelector(".profile-menu");
const profileButton = document.querySelector(".profile-mark");
const profileDropdown = document.querySelector(".profile-dropdown");
const subscriptionOverlay = document.querySelector(".subscription-overlay");
const subscriptionDialog = subscriptionOverlay?.querySelector(".subscription-dialog");
const subscriptionCloseButton = subscriptionOverlay?.querySelector(".subscription-close");
const subscriptionFeedback = subscriptionOverlay?.querySelector(".subscription-feedback");
const pageTransitionDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180;
let subscriptionCloseTimer;

navigationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navigationButtons.forEach((item) => {
      item.classList.remove("is-active");
      item.removeAttribute("aria-current");
    });

    button.classList.add("is-active");
    button.setAttribute("aria-current", "page");

    const activeView = button.dataset.view;

    if (activeView) {
      const viewElements = {
        home: document.querySelector(".welcome"),
        "sleep-records": document.querySelector(".records-view"),
        tips: document.querySelector(".tips-view"),
      };

      Object.entries(viewElements).forEach(([view, element]) => {
        element.hidden = view !== activeView;
      });

      document.title =
        activeView === "home"
          ? "LIsleep."
          : `${activeView === "tips" ? "Tips" : "Sleep Records"} | LIsleep.`;
    }
  });
});

if (profileMenu && profileButton && profileDropdown) {
  let closeMenuTimer;

  function closeProfileMenu({ returnFocus = false } = {}) {
    window.clearTimeout(closeMenuTimer);

    if (profileDropdown.hidden) {
      return;
    }

    profileButton.setAttribute("aria-expanded", "false");
    profileButton.setAttribute("aria-label", "Open profile menu");
    profileDropdown.classList.remove("is-open");
    profileDropdown.classList.add("is-closing");

    closeMenuTimer = window.setTimeout(() => {
      profileDropdown.hidden = true;
      profileDropdown.classList.remove("is-closing");
    }, 230);

    if (returnFocus) {
      profileButton.focus();
    }
  }

  function openSubscriptionDialog() {
    window.clearTimeout(subscriptionCloseTimer);
    subscriptionOverlay.hidden = false;
    subscriptionOverlay.inert = false;
    subscriptionOverlay.removeAttribute("aria-hidden");
    subscriptionOverlay.classList.remove("is-closing");
    subscriptionFeedback.textContent = "";
    window.requestAnimationFrame(() => {
      subscriptionOverlay.classList.add("is-open");
      subscriptionCloseButton.focus();
    });
  }

  function closeSubscriptionDialog() {
    if (subscriptionOverlay.hidden || subscriptionOverlay.classList.contains("is-closing")) {
      return;
    }

    subscriptionOverlay.classList.remove("is-open");
    subscriptionOverlay.classList.add("is-closing");
    subscriptionOverlay.inert = true;
    subscriptionOverlay.setAttribute("aria-hidden", "true");
    window.clearTimeout(subscriptionCloseTimer);
    subscriptionCloseTimer = window.setTimeout(() => {
      subscriptionOverlay.hidden = true;
      subscriptionOverlay.classList.remove("is-closing");
    }, 300);
    profileButton.focus();
  }

  profileButton.addEventListener("click", () => {
    if (!profileDropdown.hidden) {
      closeProfileMenu();
      return;
    }

    window.clearTimeout(closeMenuTimer);
    profileDropdown.hidden = false;
    profileDropdown.classList.remove("is-closing");
    profileButton.setAttribute("aria-expanded", "true");
    profileButton.setAttribute("aria-label", "Close profile menu");
    window.requestAnimationFrame(() => {
      profileDropdown.classList.add("is-open");
    });
  });

  profileDropdown.querySelectorAll(".profile-option").forEach((option) => {
    option.addEventListener("click", () => {
      option.classList.add("is-selected");

      if (option.dataset.action === "account") {
        closeProfileMenu();
        document.querySelector(".home-screen").classList.add("is-leaving");
        window.setTimeout(() => window.location.assign("account.html"), pageTransitionDelay);
        return;
      }

      if (option.dataset.action === "subscription") {
        closeProfileMenu();
        openSubscriptionDialog();
        return;
      }

      window.setTimeout(() => option.classList.remove("is-selected"), 230);
      closeProfileMenu({ returnFocus: true });
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (!profileMenu.contains(event.target)) {
      closeProfileMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && subscriptionOverlay.hidden && !profileDropdown.hidden) {
      closeProfileMenu({ returnFocus: true });
    }
  });

  subscriptionCloseButton.addEventListener("click", closeSubscriptionDialog);

  subscriptionOverlay.addEventListener("pointerdown", (event) => {
    if (event.target === subscriptionOverlay) {
      closeSubscriptionDialog();
    }
  });

  subscriptionOverlay.querySelector('[data-plan-action="purchase"]').addEventListener("click", () => {
    subscriptionFeedback.textContent = "Checkout isn't connected yet, so no purchase has been made.";
  });

  subscriptionOverlay.querySelector('[data-plan-action="owned"]').addEventListener("click", () => {
    subscriptionFeedback.textContent = "Focus-Pro is already your active subscription.";
  });

  document.addEventListener("keydown", (event) => {
    if (subscriptionOverlay.hidden || subscriptionOverlay.inert) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSubscriptionDialog();
      return;
    }

    if (event.key === "Tab") {
      const focusableElements = [...subscriptionDialog.querySelectorAll(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )].filter((element) => !element.hidden);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  });
}

const accountScreen = document.querySelector(".account-screen");
const backButton = document.querySelector(".back-button");

if (accountScreen && backButton) {
  backButton.addEventListener("click", () => {
    accountScreen.classList.add("is-leaving");

    window.setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.assign("index.html");
      }
    }, pageTransitionDelay);
  });
}

const recordsView = document.querySelector(".records-view");

if (recordsView) {
  const sleepGrid = document.querySelector("#sleep-dot-grid");
  const sleepDateInput = document.querySelector("#sleep-date");
  const sleepHoursInput = document.querySelector("#sleep-hours");
  const sleepMinutesInput = document.querySelector("#sleep-minutes");
  const sleepEntryForm = document.querySelector(".sleep-entry-form");
  const recordsStatus = document.querySelector(".records-status");
  const storageKey = "lisleep.sleepLogs.v1";
  const draftStorageKey = "lisleep.sleepDraft.v1";
  const selectedDateStorageKey = "lisleep.selectedSleepDate.v1";
  const today = new Date();
  const year = today.getFullYear();
  const firstDay = new Date(year, 0, 1);
  const todayKey = toDateKey(today);
  const dateOptions = { year: "numeric", month: "long", day: "numeric" };
  let selectedDate;
  let sleepLogs = {};
  let storageReady = true;
  let storageWarning = "";

  function toDateKey(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function formatDate(dateKey) {
    const [dateYear, month, day] = dateKey.split("-").map(Number);
    return new Intl.DateTimeFormat(undefined, dateOptions).format(
      new Date(dateYear, month - 1, day),
    );
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`;
    }

    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }

    return `${hours} ${hours === 1 ? "hour" : "hours"} ${remainingMinutes} ${
      remainingMinutes === 1 ? "minute" : "minutes"
    }`;
  }

  function colorForDuration(minutes) {
    if (minutes === 0) {
      return "zero";
    }

    if (minutes < 180) {
      return "short";
    }

    if (minutes < 300) {
      return "orange";
    }

    if (minutes < 420) {
      return "yellow";
    }

    if (minutes < 510) {
      return "light-green";
    }

    return "dark-green";
  }

  function isValidSleepLogData(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.entries(value).every(
        ([date, minutes]) =>
          /^\d{4}-\d{2}-\d{2}$/.test(date) &&
          Number.isInteger(minutes) &&
          minutes >= 0 &&
          minutes <= 1440,
      )
    );
  }

  function isValidDateKey(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [dateYear, month, day] = value.split("-").map(Number);
    const date = new Date(dateYear, month - 1, day);

    return (
      toDateKey(date) === value &&
      value >= toDateKey(firstDay) &&
      value <= todayKey
    );
  }

  function isValidSleepDraft(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      isValidDateKey(value.date) &&
      Number.isInteger(value.hours) &&
      value.hours >= 0 &&
      value.hours <= 24 &&
      Number.isInteger(value.minutes) &&
      value.minutes >= 0 &&
      value.minutes <= 59 &&
      (value.hours !== 24 || value.minutes === 0)
    );
  }

  function describeDay(dateKey, minutes) {
    if (minutes === undefined) {
      return `${formatDate(dateKey)}: no sleep logged`;
    }

    return `${formatDate(dateKey)}: ${formatDuration(minutes)} slept`;
  }

  function validateDuration() {
    const hours = Number(sleepHoursInput.value);
    const minutes = Number(sleepMinutesInput.value);

    sleepHoursInput.setCustomValidity(
      hours === 24 && minutes !== 0 ? "For 24 hours, minutes must be zero." : "",
    );
  }

  function renderSleepDays() {
    const fragment = document.createDocumentFragment();
    const daysElapsed = Date.UTC(year, today.getMonth(), today.getDate()) - Date.UTC(year, 0, 1);
    const numberOfDays = Math.floor(daysElapsed / 86400000) + 1;

    for (let dayIndex = 0; dayIndex < numberOfDays; dayIndex += 1) {
      const date = new Date(year, 0, dayIndex + 1);
      const dateKey = toDateKey(date);
      const loggedMinutes = sleepLogs[dateKey];
      const dayButton = document.createElement("button");
      dayButton.className = "sleep-day";
      dayButton.type = "button";
      dayButton.dataset.date = dateKey;
      dayButton.setAttribute("aria-label", describeDay(dateKey, loggedMinutes));
      dayButton.title = describeDay(dateKey, loggedMinutes);
      dayButton.setAttribute("aria-pressed", String(dateKey === selectedDate));
      dayButton.tabIndex = dateKey === selectedDate ? 0 : -1;

      if (loggedMinutes !== undefined) {
        dayButton.dataset.sleepColor = colorForDuration(loggedMinutes);
        dayButton.dataset.minutesSlept = String(loggedMinutes);
      }

      if (dateKey === selectedDate) {
        dayButton.classList.add("is-selected");
      }

      dayButton.addEventListener("click", () => {
        selectDate(dateKey);
        focusSleepEntry();
      });
      dayButton.addEventListener("keydown", (event) => {
        const dayButtons = [...sleepGrid.querySelectorAll(".sleep-day")];
        const currentIndex = dayButtons.indexOf(dayButton);
        const columnCount = getComputedStyle(sleepGrid).gridTemplateColumns.split(" ").length;
        const movement = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: -columnCount,
          ArrowDown: columnCount,
        }[event.key];
        const nextIndex =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? dayButtons.length - 1
              : currentIndex + movement;

        if (
          (movement !== undefined || event.key === "Home" || event.key === "End") &&
          nextIndex >= 0 &&
          nextIndex < dayButtons.length
        ) {
          event.preventDefault();
          selectDate(dayButtons[nextIndex].dataset.date);
          dayButtons[nextIndex].focus();
        }
      });
      fragment.append(dayButton);
    }

    sleepGrid.replaceChildren(fragment);
    document.querySelector("#records-year").textContent = String(year);
  }

  function selectDate(dateKey, persist = true) {
    selectedDate = dateKey;
    sleepDateInput.value = dateKey;
    const loggedMinutes = sleepLogs[dateKey];
    sleepHoursInput.value =
      loggedMinutes === undefined ? "0" : String(Math.floor(loggedMinutes / 60));
    sleepMinutesInput.value = loggedMinutes === undefined ? "0" : String(loggedMinutes % 60);
    validateDuration();
    recordsStatus.textContent = storageWarning;
    if (persist) {
      saveSelectionAndDraft();
    }

    sleepGrid.querySelectorAll(".sleep-day").forEach((dayButton) => {
      const isSelected = dayButton.dataset.date === dateKey;
      dayButton.classList.toggle("is-selected", isSelected);
      dayButton.setAttribute("aria-pressed", String(isSelected));
      dayButton.tabIndex = isSelected ? 0 : -1;
    });
  }

  function focusSleepEntry() {
    document.querySelector(".sleep-entry-card").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "nearest",
    });
    sleepHoursInput.focus({ preventScroll: true });
  }

  function saveSelectionAndDraft() {
    if (!storageReady || !isValidDateKey(sleepDateInput.value)) {
      return;
    }

    const draft = {
      date: sleepDateInput.value,
      hours: Number(sleepHoursInput.value),
      minutes: Number(sleepMinutesInput.value),
    };

    try {
      window.localStorage.setItem(selectedDateStorageKey, draft.date);

      if (isValidSleepDraft(draft)) {
        window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      }
    } catch (error) {
      console.error("Unable to save the current sleep entry on this device.", error);
      storageWarning =
        "Your current entry could not be saved on this device. Confirmed sleep logs remain saved.";
      recordsStatus.textContent = storageWarning;
    }
  }

  let existingLogs;
  try {
    existingLogs = window.localStorage.getItem(storageKey);
  } catch (error) {
    console.error("Unable to read saved sleep logs.", error);
    storageReady = false;
    storageWarning = "Browser storage is unavailable. Sleep logs cannot be loaded or saved.";
    recordsStatus.textContent = storageWarning;
    sleepEntryForm.querySelector('[type="submit"]').disabled = true;
  }

  if (storageReady && existingLogs !== null) {
    let parsedLogs;

    try {
      parsedLogs = JSON.parse(existingLogs);
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }

      console.error("Saved sleep logs contain invalid JSON.", error);
      storageReady = false;
      storageWarning = "Saved sleep logs could not be read. Existing data has not been changed.";
      recordsStatus.textContent = storageWarning;
      sleepEntryForm.querySelector('[type="submit"]').disabled = true;
    }

    if (storageReady && isValidSleepLogData(parsedLogs)) {
      sleepLogs = parsedLogs;
    } else if (storageReady) {
      storageReady = false;
      storageWarning = "Saved sleep logs could not be read. Existing data has not been changed.";
      recordsStatus.textContent = storageWarning;
      sleepEntryForm.querySelector('[type="submit"]').disabled = true;
    }
  }

  sleepDateInput.min = toDateKey(firstDay);
  sleepDateInput.max = todayKey;
  sleepGrid.setAttribute("aria-describedby", "year-grid-description");
  document.querySelector("#year-grid-description").textContent =
    `Choose a day to add or update a sleep log · through ${new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(today)}.`;
  renderSleepDays();
  let storedSelectedDate = todayKey;
  let storedDraft;

  if (storageReady) {
    try {
      const savedDate = window.localStorage.getItem(selectedDateStorageKey);
      const savedDraft = window.localStorage.getItem(draftStorageKey);

      if (isValidDateKey(savedDate)) {
        storedSelectedDate = savedDate;
      }

      if (savedDraft !== null) {
        const parsedDraft = JSON.parse(savedDraft);

        if (isValidSleepDraft(parsedDraft)) {
          storedDraft = parsedDraft;
        } else {
          storageWarning =
            "Your last unfinished entry could not be restored. Confirmed sleep logs are still available.";
          recordsStatus.textContent = storageWarning;
        }
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error("Saved sleep entry draft contains invalid JSON.", error);
      } else {
        console.error("Unable to restore the current sleep entry from this device.", error);
      }
      storageWarning =
        "Your last unfinished entry could not be restored. Confirmed sleep logs are still available.";
      recordsStatus.textContent = storageWarning;
    }
  }

  selectDate(storedSelectedDate, false);

  if (storedDraft && storedDraft.date === storedSelectedDate) {
    sleepHoursInput.value = String(storedDraft.hours);
    sleepMinutesInput.value = String(storedDraft.minutes);
    validateDuration();
  }
  saveSelectionAndDraft();

  sleepDateInput.addEventListener("change", () => {
    const dateKey = sleepDateInput.value;

    if (isValidDateKey(dateKey)) {
      selectDate(dateKey);
    }
  });

  sleepHoursInput.addEventListener("input", () => {
    validateDuration();
    saveSelectionAndDraft();
  });
  sleepMinutesInput.addEventListener("input", () => {
    validateDuration();
    saveSelectionAndDraft();
  });

  sleepEntryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    recordsStatus.textContent = "";
    validateDuration();

    const hours = Number(sleepHoursInput.value);
    const minutes = Number(sleepMinutesInput.value);

    if (!sleepEntryForm.reportValidity() || !storageReady) {
      return;
    }

    const confirmedLog = {
      date: sleepDateInput.value,
      minutesSlept: hours * 60 + minutes,
    };
    selectedDate = confirmedLog.date;
    const nextLogs = { ...sleepLogs, [confirmedLog.date]: confirmedLog.minutesSlept };

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextLogs));
    } catch (error) {
      console.error("Unable to save the sleep log.", error);
      storageWarning = "Sleep log could not be saved. Please check your browser storage and try again.";
      recordsStatus.textContent = storageWarning;
      return;
    }

    sleepLogs = nextLogs;
    const confirmedDate = confirmedLog.date;
    renderSleepDays();
    sleepGrid.querySelector(`[data-date="${confirmedDate}"]`)?.classList.add("is-changed");
    saveSelectionAndDraft();
    recordsStatus.textContent =
      `${formatDate(confirmedDate)} — ${formatDuration(confirmedLog.minutesSlept)} confirmed and saved.`;
  });
}

const tipsView = document.querySelector(".tips-view");

if (tipsView) {
  tipsView.hidden = true;
}