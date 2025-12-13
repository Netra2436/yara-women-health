const CYCLE_STORAGE_KEY = "yara_period_history";  // start+cycle
const DAY_STORAGE_KEY = "yara_period_days";       // per-day logs

let viewYear;
let viewMonth; // 0-11
let currentUserId = null; // Firebase anonymous user id

// ---------- storage helpers ----------

function loadCycles() {
  try {
    const raw = localStorage.getItem(CYCLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCycles(history) {
  localStorage.setItem(CYCLE_STORAGE_KEY, JSON.stringify(history));
}

function loadDayLogs() {
  try {
    const raw = localStorage.getItem(DAY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDayLogs(logs) {
  localStorage.setItem(DAY_STORAGE_KEY, JSON.stringify(logs));
}

// ---------- calculations ----------

function getAverageCycle(history) {
  if (!history.length) return null;
  const sum = history.reduce((acc, item) => acc + (item.cycle || 0), 0);
  return Math.round(sum / history.length);
}

function updateSummaryAndCalendar() {
  const history = loadCycles();
  const resultEl = document.getElementById("tracker-result");
  const reportEl = document.getElementById("tracker-report");

  if (!history.length) {
    resultEl.innerText = "Add your first period to start tracking.";
    reportEl.innerText = "";
    renderMonthCalendar([], [], viewYear, viewMonth);
    return;
  }

  history.sort((a, b) => new Date(a.start) - new Date(b.start));
  const first = history[0];
  const last = history[history.length - 1];
  const avgCycle = getAverageCycle(history);

  const lastDate = new Date(last.start);
  const next = new Date(lastDate);
  next.setDate(lastDate.getDate() + (avgCycle || last.cycle));

  resultEl.innerText =
    "Last period: " + lastDate.toDateString() +
    " | Avg cycle: " + (avgCycle || last.cycle) + " days" +
    " | Estimated next: " + next.toDateString();

  const shortest = Math.min(...history.map(h => h.cycle));
  const longest = Math.max(...history.map(h => h.cycle));

  reportEl.innerHTML =
    "Total cycles tracked: <b>" + history.length + "</b><br>" +
    "Tracking since: <b>" + new Date(first.start).toDateString() + "</b><br>" +
    "Shortest cycle: <b>" + shortest + " days</b><br>" +
    "Longest cycle: <b>" + longest + " days</b>";

  const dayLogs = loadDayLogs();
  renderMonthCalendar(history, dayLogs, viewYear, viewMonth, next);
}

// ---------- render one month, clickable days ----------

function renderMonthCalendar(history, dayLogs, year, month, nextDate) {
  const today = new Date();
  if (year == null || month == null) {
    year = today.getFullYear();
    month = today.getMonth();
    viewYear = year;
    viewMonth = month;
  }

  const calDiv = document.getElementById("calendar");
  const titleEl = document.getElementById("month-title");
  calDiv.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  titleEl.textContent = firstDay.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(7, 1fr)";
  grid.style.gap = "4px";
  calDiv.appendChild(grid);

  const weekdayNames = ["S", "M", "T", "W", "T", "F", "S"];
  weekdayNames.forEach((w) => {
    const cell = document.createElement("div");
    cell.textContent = w;
    cell.style.textAlign = "center";
    cell.style.fontWeight = "600";
    cell.style.color = "#82416d";
    grid.appendChild(cell);
  });

  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement("div");
    grid.appendChild(empty);
  }

  const periodDays = new Set();
  history.forEach((item) => {
    const start = new Date(item.start);
    const length = 4;
    for (let i = 0; i < length; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d.getMonth() === month && d.getFullYear() === year) {
        periodDays.add(d.getDate());
      }
    }
  });

  const nextDay =
    nextDate &&
    nextDate.getMonth() === month &&
    nextDate.getFullYear() === year
      ? nextDate.getDate()
      : null;

  const logMap = {};
  dayLogs.forEach((log) => {
    logMap[log.date] = log;
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.textContent = day;
    cell.style.textAlign = "center";
    cell.style.padding = "0.4rem 0";
    cell.style.borderRadius = "8px";
    cell.style.fontSize = "0.85rem";
    cell.style.cursor = "pointer";

    const dateObj = new Date(year, month, day);
    const dateKey = dateObj.toISOString().slice(0, 10);
    const existingLog = logMap[dateKey];

    if (periodDays.has(day)) {
      cell.style.background = "#f8b8cc";
      cell.style.color = "#5b2942";
    } else if (nextDay === day) {
      cell.style.background = "var(--accent)";
      cell.style.color = "#fff";
      cell.style.fontWeight = "600";
    } else {
      cell.style.background = "#fdf0f6";
      cell.style.color = "#4b304a";
    }

    if (existingLog && existingLog.isPeriod) {
      cell.style.border = "2px solid #ad2f64";
    }

    cell.addEventListener("click", () => {
      const latestLogs = loadDayLogs();
      const latest = latestLogs.find(l => l.date === dateKey) || null;
      handleDayClick(dateKey, latest);
    });

    grid.appendChild(cell);
  }
}

// ---------- modal for per-day log ----------

let modalDateKey = null;
let modalEl, modalTitle, modalFlow, modalCramps, modalMood;

function openModal(dateKey, existingLog) {
  modalDateKey = dateKey;
  modalTitle.textContent = "Log for " + dateKey;

  const periodYes =
    document.querySelector("input[name='modal-period'][value='yes']");
  const periodNo =
    document.querySelector("input[name='modal-period'][value='no']");

  if (existingLog && existingLog.isPeriod) {
    periodYes.checked = true;
  } else {
    periodNo.checked = true;
  }

  modalFlow.value = (existingLog && existingLog.flow) || "medium";
  modalCramps.value = (existingLog && existingLog.cramps) || "medium";
  modalMood.value = (existingLog && existingLog.mood) || "";

  // show centered overlay
  modalEl.style.display = "flex";
}

function closeModal() {
  modalEl.style.display = "none";
  modalDateKey = null;
}

function handleModalSave() {
  if (!modalDateKey) return;

  const periodValue =
    document.querySelector("input[name='modal-period']:checked")?.value || "no";
  const isPeriod = periodValue === "yes";

  const newLog = {
    date: modalDateKey,
    isPeriod,
    flow: modalFlow.value || "medium",
    cramps: modalCramps.value || "medium",
    mood: modalMood.value || "",
  };

  const logs = loadDayLogs();
  const idx = logs.findIndex((l) => l.date === modalDateKey);
  if (idx >= 0) logs[idx] = newLog;
  else logs.push(newLog);
  saveDayLogs(logs);

  if (currentUserId) {
    saveLogsToFirestore(currentUserId, logs).catch((err) =>
      console.error("Failed to save logs to Firestore:", err)
    );
  }

  closeModal();
  updateSummaryAndCalendar();
}

function handleDayClick(dateKey, existingLog) {
  openModal(dateKey, existingLog);
}

// ---------- DOM wiring + Firebase init ----------

document.addEventListener("DOMContentLoaded", () => {
  // form submit (start + cycle)
  document.getElementById("tracker-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const dateStr = document.getElementById("last_period").value;
    const cycleDays = parseInt(document.getElementById("cycle_days").value, 10);
    if (!dateStr || !cycleDays) return;

    const history = loadCycles();
    history.push({ start: dateStr, cycle: cycleDays });
    saveCycles(history);

    updateSummaryAndCalendar();
    e.target.reset();
  });

  // Analyse button
  document.getElementById("analyse-btn").addEventListener("click", () => {
    const cycles = loadCycles();
    const dayLogs = loadDayLogs();
    const panel = document.getElementById("analysis-panel");
    const content = document.getElementById("analysis-content");

    if (!cycles.length && !dayLogs.length) {
      panel.style.display = "block";
      content.innerHTML =
        "Add some periods and daily logs first so Sakhi can understand your pattern.";
      return;
    }

    let avgCycle = getAverageCycle(cycles);
    let cycleComment = "";
    if (avgCycle) {
      if (avgCycle >= 26 && avgCycle <= 32) {
        cycleComment =
          "Your average cycle length looks within the typical range (around 28 days).";
      } else if (avgCycle < 26) {
        cycleComment =
          "Your average cycle seems on the shorter side. Short cycles can still be normal, but if they worry you, consider discussing with a doctor.";
      } else {
        cycleComment =
          "Your average cycle seems on the longer side. Longer cycles can be normal for some, but if they are very irregular or you miss periods, talk to a doctor.";
      }
    }

    const cyclesList = cycles.map(c => c.cycle).sort((a, b) => a - b);
    let variabilityComment = "";
    if (cyclesList.length >= 2) {
      const minC = cyclesList[0];
      const maxC = cyclesList[cyclesList.length - 1];
      const spread = maxC - minC;
      if (spread <= 3) {
        variabilityComment =
          "Your cycle lengths look fairly consistent from month to month.";
      } else if (spread <= 7) {
        variabilityComment =
          "There is some variation in your cycle length, which is common.";
      } else {
        variabilityComment =
          "Your cycle lengths vary quite a bit. If this is new for you or combined with very heavy/painful periods, consider medical advice.";
      }
    }

    const periodLogs = dayLogs.filter(l => l.isPeriod);
    const periodDaysCount = periodLogs.length;

    const flowMap = { low: 0, medium: 0, high: 0 };
    const crampsMap = { low: 0, medium: 0, high: 0 };

    periodLogs.forEach(l => {
      if (flowMap[l.flow] != null) flowMap[l.flow]++;
      if (crampsMap[l.cramps] != null) crampsMap[l.cramps]++;
    });

    const dominantFlow = Object.entries(flowMap).sort((a, b) => b[1] - a[1])[0];
    const dominantCramps = Object.entries(crampsMap).sort((a, b) => b[1] - a[1])[0];

    let flowComment = "";
    if (dominantFlow && dominantFlow[1] > 0) {
      if (dominantFlow[0] === "low" || dominantFlow[0] === "medium") {
        flowComment =
          "Your logged flow is mostly " + dominantFlow[0] + ". That can be comfortable for many people.";
      } else {
        flowComment =
          "You often log heavy flow. If you need to change pads very frequently or feel dizzy/very tired, discuss heavy bleeding with a doctor.";
      }
    }

    let crampsComment = "";
    if (dominantCramps && dominantCramps[1] > 0) {
      if (dominantCramps[0] === "low" || dominantCramps[0] === "medium") {
        crampsComment =
          "Your cramps are mostly " + dominantCramps[0] + ". Mild to moderate cramps are common.";
      } else {
        crampsComment =
          "You often log strong cramps. If pain stops you from daily activities, consider medical support and pain management.";
      }
    }

    const moodsSample = dayLogs
      .map(l => (l.mood || "").trim())
      .filter(m => m.length > 0)
      .slice(-5);
    let moodComment = "";
    if (moodsSample.length) {
      moodComment =
        "Recently you noted: " + moodsSample.join(", ") +
        ". It can help to notice what makes you feel better and keep those habits on heavy days.";
    }

    panel.style.display = "block";
    content.innerHTML =
      `<p><b>Cycles tracked:</b> ${cycles.length || 0}</p>` +
      (avgCycle ? `<p><b>Average cycle length:</b> ${avgCycle} days.</p>` : "") +
      (cycleComment ? `<p>${cycleComment}</p>` : "") +
      (variabilityComment ? `<p>${variabilityComment}</p>` : "") +
      `<p><b>Total logged period days:</b> ${periodDaysCount}</p>` +
      (flowComment ? `<p>${flowComment}</p>` : "") +
      (crampsComment ? `<p>${crampsComment}</p>` : "") +
      (moodComment ? `<p>${moodComment}</p>` : "") +
      `<p style="margin-top:0.6rem; font-size:0.85rem; color:#7a4a66;">
        This analysis is informational, not a diagnosis. If you notice sudden changes,
        very heavy bleeding, or severe pain, please talk to a healthcare professional.
      </p>`;
  });

  // month slider
  document.getElementById("prev-month").addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    updateSummaryAndCalendar();
  });

  document.getElementById("next-month").addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    updateSummaryAndCalendar();
  });

  // modal element refs + handlers
  modalEl = document.getElementById("day-modal");
  modalTitle = document.getElementById("day-modal-title");
  modalFlow = document.getElementById("modal-flow");
  modalCramps = document.getElementById("modal-cramps");
  modalMood = document.getElementById("modal-mood");

  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-save").addEventListener("click", handleModalSave);

  // init: sign in anon and sync from Firestore
  const today = new Date();
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();

  signInAnon()
    .then((user) => {
      currentUserId = user.uid;
      return loadLogsFromFirestore(currentUserId);
    })
    .then((cloudLogs) => {
      if (cloudLogs && cloudLogs.length) {
        saveDayLogs(cloudLogs);
      }
      updateSummaryAndCalendar();
    })
    .catch((err) => {
      console.error("Firebase init failed, using local only:", err);
      updateSummaryAndCalendar();
    });
});
