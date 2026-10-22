(() => {
  "use strict";

  const STORAGE_KEY = "reset.simple.v1";
  const RECOVERY_KEY = `${STORAGE_KEY}.recovery-backup`;
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const $ = (selector) => document.querySelector(selector);
  const els = {
    todayLabel: $("#today-label"),
    dateFull: $("#date-full"),
    progressPercent: $("#progress-percent"),
    progressCount: $("#progress-count"),
    progressBar: $("#progress-bar"),
    progressFill: $("#progress-fill"),
    todayTotal: $("#today-total"),
    weekTotal: $("#week-total"),
    habitCount: $("#habit-count"),
    habitList: $("#habit-list"),
    emptyState: $("#empty-state"),
    form: $("#habit-form"),
    name: $("#habit-name"),
    category: $("#habit-category"),
    weekdayOptions: $("#weekday-options"),
    formError: $("#form-error"),
    weekCaption: $("#week-caption"),
    weekStrip: $("#week-strip"),
    message: $("#app-message"),
    deleteDialog: $("#delete-dialog"),
    confirmDelete: $("#confirm-delete"),
  };

  let state = loadState();
  let pendingDeleteId = null;

  function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseLocalDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function shiftDate(value, amount) {
    const date = parseLocalDate(value);
    date.setDate(date.getDate() + amount);
    return localDate(date);
  }

  function loadState() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: 1, habits: [], checkIns: {} };
      const parsed = JSON.parse(raw);
      if (
        parsed?.version !== 1 ||
        !Array.isArray(parsed.habits) ||
        !parsed.checkIns ||
        typeof parsed.checkIns !== "object" ||
        Array.isArray(parsed.checkIns)
      ) {
        throw new Error("Stored data has an unsupported format.");
      }
      const habits = parsed.habits.filter(
        (habit) =>
          habit &&
          typeof habit.id === "string" &&
          typeof habit.name === "string" &&
          Array.isArray(habit.days) &&
          habit.days.every(
            (day) => Number.isInteger(day) && day >= 0 && day <= 6,
          ),
      );
      const checkIns = {};
      for (const [date, records] of Object.entries(parsed.checkIns)) {
        if (
          /^\d{4}-\d{2}-\d{2}$/.test(date) &&
          records &&
          typeof records === "object" &&
          !Array.isArray(records)
        )
          checkIns[date] = records;
      }
      return { version: 1, habits, checkIns };
    } catch (error) {
      console.warn("RESET could not load saved data:", error);
      // Preserve unreadable data before a later save can replace the main key.
      if (typeof raw === "string") {
        try {
          localStorage.setItem(RECOVERY_KEY, raw);
        } catch (backupError) {
          console.warn("RESET could not back up unreadable data:", backupError);
        }
      }
      return { version: 1, habits: [], checkIns: {}, loadError: true };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          habits: state.habits,
          checkIns: state.checkIns,
        }),
      );
      return true;
    } catch (error) {
      console.error("RESET could not save data:", error);
      announce(
        "Could not save changes. Check browser storage space and permissions.",
      );
      return false;
    }
  }

  function announce(message) {
    els.message.textContent = "";
    window.setTimeout(() => {
      els.message.textContent = message;
    }, 20);
  }

  function escapeHTML(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  function isScheduled(habit, date) {
    return habit.days.includes(parseLocalDate(date).getDay());
  }

  function isDone(habit, date) {
    return state.checkIns[date]?.[habit.id] === true;
  }

  function scheduledHabits(date) {
    return state.habits.filter((habit) => isScheduled(habit, date));
  }

  function completionForDate(date) {
    const habits = scheduledHabits(date);
    const completed = habits.filter((habit) => isDone(habit, date)).length;
    return { total: habits.length, completed };
  }

  function updateSummary(today) {
    const result = completionForDate(today);
    const percent = result.total
      ? Math.round((result.completed / result.total) * 100)
      : 0;
    els.progressPercent.textContent = `${percent}%`;
    els.progressCount.textContent = `${result.completed} of ${result.total} done`;
    els.progressFill.style.width = `${percent}%`;
    els.progressBar.setAttribute("aria-valuenow", String(percent));
    els.todayTotal.textContent = String(result.total);
    els.habitCount.textContent = `${state.habits.length} ${state.habits.length === 1 ? "habit" : "habits"}`;
    let weeklyCompleted = 0;
    const mondayOffset = (parseLocalDate(today).getDay() + 6) % 7;
    const monday = shiftDate(today, -mondayOffset);
    for (let offset = 0; offset < 7; offset += 1) {
      const date = shiftDate(monday, offset);
      if (date > today) continue;
      weeklyCompleted += completionForDate(date).completed;
    }
    els.weekTotal.textContent = String(weeklyCompleted);
  }

  function renderHabits(today) {
    const habits = scheduledHabits(today);
    els.habitList.innerHTML = habits
      .map((habit) => {
        const done = isDone(habit, today);
        const dayText =
          habit.days.length === 7
            ? "Every day"
            : habit.days.length === 5 &&
                [1, 2, 3, 4, 5].every((day) => habit.days.includes(day))
              ? "Weekdays"
              : habit.days.map((day) => DAYS[day]).join(", ");
        return `<article class="habit-item${done ? " is-done" : ""}">
        <button class="habit-check" type="button" data-action="toggle" data-id="${escapeHTML(habit.id)}" aria-pressed="${done}" aria-label="${done ? "Mark incomplete" : "Mark complete"}: ${escapeHTML(habit.name)}">${done ? "✓" : ""}</button>
        <div class="habit-details"><div class="habit-name">${escapeHTML(habit.name)}</div><div class="habit-meta"><span class="category-tag">${escapeHTML(habit.category || "Personal")}</span><span class="habit-schedule">${escapeHTML(dayText)}</span></div></div>
        <div class="habit-actions"><button class="icon-button" type="button" data-action="delete" data-id="${escapeHTML(habit.id)}" aria-label="Delete ${escapeHTML(habit.name)}" title="Delete habit">×</button></div>
      </article>`;
      })
      .join("");
    const noHabitsExist = state.habits.length === 0;
    const emptyHeading = els.emptyState.querySelector("h3");
    const emptyCopy = els.emptyState.querySelector("p");
    const emptyButton = $("#empty-add-button");
    if (noHabitsExist) {
      emptyHeading.textContent = "Your fresh start begins here";
      emptyCopy.textContent = "Add your first habit and make today count.";
      emptyButton.textContent = "＋ Add your first habit";
    } else {
      emptyHeading.textContent = "No habits scheduled today";
      emptyCopy.textContent =
        "Your other habits are scheduled for different days. You can add another one anytime.";
      emptyButton.textContent = "＋ Add a habit";
    }
    els.emptyState.classList.toggle("visible", habits.length === 0);
    els.habitList.hidden = habits.length === 0;
  }

  function renderWeek(today) {
    const date = parseLocalDate(today);
    const mondayOffset = (date.getDay() + 6) % 7;
    const monday = shiftDate(today, -mondayOffset);
    const sunday = shiftDate(monday, 6);
    els.weekCaption.textContent = `${parseLocalDate(monday).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${parseLocalDate(sunday).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    els.weekStrip.innerHTML = Array.from({ length: 7 }, (_, index) => {
      const dateString = shiftDate(monday, index);
      const dayDate = parseLocalDate(dateString);
      const result = completionForDate(dateString);
      const isToday = dateString === today;
      const future = dateString > today;
      return `<div class="week-day${isToday ? " today" : ""}${future ? " future" : ""}"><span class="day-name">${DAYS[dayDate.getDay()]}</span><span class="day-number">${dayDate.getDate()}</span><span class="day-count">${future ? "—" : `<strong>${result.completed}</strong> / ${result.total}`}</span></div>`;
    }).join("");
  }

  function render() {
    const now = new Date();
    const today = localDate(now);
    els.todayLabel.textContent =
      now.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase() +
      " · YOUR DAILY RESET";
    els.dateFull.textContent = now.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    updateSummary(today);
    renderHabits(today);
    renderWeek(today);
    if (state.loadError) {
      els.formError.textContent =
        "Saved data could not be read. RESET saved a recovery copy if browser storage allowed it. Exporting that recovery copy is not available in this version, so avoid clearing browser data.";
    }
  }

  function createId() {
    return typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `habit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = els.name.value.trim();
    const days = [...els.weekdayOptions.querySelectorAll("input:checked")].map(
      (input) => Number(input.value),
    );
    if (!name) {
      els.formError.textContent = "Enter a name for your habit.";
      els.name.focus();
      return;
    }
    if (!days.length) {
      els.formError.textContent = "Choose at least one day.";
      return;
    }
    if (
      state.habits.some(
        (habit) => habit.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      els.formError.textContent = "A habit with this name already exists.";
      els.name.focus();
      return;
    }
    state.habits.push({
      id: createId(),
      name,
      category: els.category.value,
      days: days.sort((a, b) => a - b),
      createdAt: localDate(),
    });
    if (!saveState()) {
      state.habits.pop();
      return;
    }
    els.form.reset();
    els.weekdayOptions.querySelectorAll("input").forEach((input) => {
      input.checked = ["1", "2", "3", "4", "5"].includes(input.value);
    });
    els.formError.textContent = "";
    render();
    announce(`Habit added: ${name}`);
    els.name.focus();
  });

  els.name.addEventListener("input", () => {
    els.formError.textContent = "";
  });
  $("#empty-add-button").addEventListener("click", () => els.name.focus());

  els.habitList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const habit = state.habits.find((item) => item.id === button.dataset.id);
    if (!habit) return;
    if (button.dataset.action === "toggle") {
      const today = localDate();
      if (!state.checkIns[today]) state.checkIns[today] = {};
      const previous = state.checkIns[today][habit.id] === true;
      if (previous) delete state.checkIns[today][habit.id];
      else state.checkIns[today][habit.id] = true;
      if (!Object.keys(state.checkIns[today]).length)
        delete state.checkIns[today];
      if (!saveState()) {
        if (previous) {
          if (!state.checkIns[today]) state.checkIns[today] = {};
          state.checkIns[today][habit.id] = true;
        } else delete state.checkIns[today][habit.id];
        return;
      }
      render();
      announce(
        `${habit.name}: ${previous ? "marked incomplete" : "completed"}`,
      );
    } else if (button.dataset.action === "delete") {
      pendingDeleteId = habit.id;
      if (typeof els.deleteDialog.showModal === "function")
        els.deleteDialog.showModal();
      else if (
        window.confirm(`Delete "${habit.name}" and its check-in history?`)
      )
        deleteHabit(pendingDeleteId);
    }
  });

  function deleteHabit(id) {
    const habit = state.habits.find((item) => item.id === id);
    if (!habit) return;
    const oldHabits = state.habits;
    const oldCheckIns = state.checkIns;
    state.habits = state.habits.filter((item) => item.id !== id);
    state.checkIns = Object.fromEntries(
      Object.entries(state.checkIns)
        .map(([date, records]) => {
          const next = { ...records };
          delete next[id];
          return [date, next];
        })
        .filter(([, records]) => Object.keys(records).length),
    );
    if (!saveState()) {
      state.habits = oldHabits;
      state.checkIns = oldCheckIns;
      return;
    }
    render();
    announce(`Deleted habit: ${habit.name}`);
  }

  els.confirmDelete.addEventListener("click", (event) => {
    event.preventDefault();
    const id = pendingDeleteId;
    pendingDeleteId = null;
    els.deleteDialog.close();
    if (id) deleteHabit(id);
  });

  $("#export-button").addEventListener("click", () => {
    const data = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: 1,
        habits: state.habits,
        checkIns: state.checkIns,
      },
      null,
      2,
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reset-backup-${localDate()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    announce("Your RESET data export has been prepared.");
  });

  render();
})();
