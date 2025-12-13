const form = document.getElementById("log-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  await fetch("http://localhost:8000/periods", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });

  loadSummary();
});

async function loadSummary() {
  const res = await fetch("http://localhost:8000/summary");
  const data = await res.json();

  document.getElementById("next-date").innerText = data.next_period;
  document.getElementById("phase").innerText = data.current_phase;
  document.getElementById("summary").classList.remove("hidden");

  highlightCalendar(data.next_period);
}

function highlightCalendar(nextDate) {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "<h4>Calendar (preview)</h4>";
  const date = new Date(nextDate);
  const cell = document.createElement("div");
  cell.innerText = `🌸 Next expected: ${date.toDateString()}`;
  cell.className = "pill";
  cal.appendChild(cell);
}

loadSummary();