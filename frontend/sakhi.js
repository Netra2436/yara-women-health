// sakhi.js - shared assistant logic for all pages

function sakhiInit() {
  const sakhiToggle = document.getElementById("sakhi-toggle");
  const sakhiPanel = document.getElementById("sakhi-panel");
  const sakhiClose = document.getElementById("sakhi-close");
  const sakhiMessages = document.getElementById("sakhi-messages");
  const sakhiInput = document.getElementById("sakhi-input");
  const sakhiSend = document.getElementById("sakhi-send");

  if (!sakhiToggle || !sakhiPanel) return; // page has no Sakhi HTML

  function sakhiAddMsg(text, who) {
    const div = document.createElement("div");
    div.className = "sakhi-msg " + who;
    div.textContent = text;
    sakhiMessages.appendChild(div);
    sakhiMessages.scrollTop = sakhiMessages.scrollHeight;
  }

  function sakhiPersonalSummary() {
    // These helpers exist on tracker; on other pages fall back to generic text
    const hasLocal = typeof loadCycles === "function" && typeof loadDayLogs === "function";
    if (!hasLocal) {
      return "Open the Period Tracker and start logging cycles and symptoms so I can analyse your pattern.";
    }
    const cycles = loadCycles();
    const dayLogs = loadDayLogs();
    if (!cycles.length && !dayLogs.length) {
      return "Start logging your cycles and daily symptoms, and I will summarise patterns for you.";
    }
    let msg = "";
    if (cycles.length) {
      const avg = getAverageCycle(cycles);
      msg += `You have logged ${cycles.length} cycles; your average cycle length is about ${avg} days. `;
    }
    const periodLogs = dayLogs.filter(l => l.isPeriod);
    if (periodLogs.length) {
      msg += `You marked ${periodLogs.length} period days so far. `;
    }
    return msg || "I can see your data is growing. Keep logging for richer insights.";
  }

  function sakhiReply(userText) {
    const text = userText.toLowerCase();
    if (text.includes("pcos")) {
      return "PCOS is a hormonal condition that can affect cycles, skin, hair and weight. Use the PCOS Prediction page to estimate risk, but only a doctor can diagnose it.";
    }
    if (text.includes("late") || text.includes("delay")) {
      return "A late period can be due to stress, illness, weight changes, PCOS, thyroid issues or pregnancy. If your period is more than 2 weeks late or often irregular, talk to a doctor.";
    }
    if (text.includes("pain") || text.includes("cramp")) {
      return "Mild cramps are common, but if pain stops you from working, studying or sleeping, that is a sign to seek medical advice. Heat pads, gentle stretching and hydration may help meanwhile.";
    }
    if (text.includes("cycle") || text.includes("length") || text.includes("track")) {
      return sakhiPersonalSummary();
    }
    if (text.includes("mood") || text.includes("anxious") || text.includes("sad")) {
      return "Mood changes around periods are very common. Track your mood and notice which days feel heavier emotionally. If sadness or anxiety is constant or very strong, seek professional support.";
    }
    return "I am Sakhi, your cycle buddy. Ask me about PCOS, late periods, pain, cycle length, mood, or how to use YARA's features.";
  }

  sakhiToggle.addEventListener("click", () => {
    const isHidden = sakhiPanel.classList.contains("hidden");
    if (isHidden) {
      sakhiPanel.classList.remove("hidden");
      if (!sakhiMessages.childElementCount) {
        sakhiAddMsg(
          "Hi, I am Sakhi. Ask me about your cycle, pain, mood, or how to use YARA. I use your logs on the tracker page to guide you.",
          "bot"
        );
      }
    } else {
      sakhiPanel.classList.add("hidden");
    }
  });

  sakhiClose.addEventListener("click", () => {
    sakhiPanel.classList.add("hidden");
  });

  function sakhiHandleSend() {
    const text = sakhiInput.value.trim();
    if (!text) return;
    sakhiAddMsg(text, "me");
    sakhiInput.value = "";
    const reply = sakhiReply(text);
    setTimeout(() => sakhiAddMsg(reply, "bot"), 200);
  }

  sakhiSend.addEventListener("click", sakhiHandleSend);
  sakhiInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sakhiHandleSend();
    }
  });
}

document.addEventListener("DOMContentLoaded", sakhiInit);
