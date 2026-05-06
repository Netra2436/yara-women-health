document.getElementById("pcos-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const raw = Object.fromEntries(formData.entries());

  // Fields that must be integers
  const intFields = [
    "blood_group", "cycle", "pregnant", "abortions",
    "weight_gain", "hair_growth", "skin_darkening",
    "hair_loss", "pimples", "fast_food", "exercise"
  ];

  // Fields that must be floats
  const floatFields = [
    "age", "weight", "height", "bmi",
    "cycle_length", "marriage_years", "hip", "waist"
  ];

  const data = {};

  for (const key of intFields) {
    data[key] = parseInt(raw[key], 10);
  }
  for (const key of floatFields) {
    data[key] = parseFloat(raw[key]);
  }

  // Validate: catch missing fields before sending
  for (const [key, val] of Object.entries(data)) {
    if (isNaN(val)) {
      document.getElementById("result").innerText = `Please fill in: ${key.replace(/_/g, " ")}`;
      return;
    }
  }

  document.getElementById("result").innerText = "Predicting...";

  try {
    const res = await fetch("https://yara-backend-5yyp.onrender.com/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error("API error:", errBody);
      document.getElementById("result").innerText = `Error ${res.status}: ${JSON.stringify(errBody?.detail ?? "Unknown error")}`;
      return;
    }

    const out = await res.json();
    const message = out.prediction === 1
      ? "🌸 PCOS is likely based on your inputs."
      : "✅ PCOS is unlikely based on your inputs.";

    document.getElementById("result").innerText = message;

  } catch (err) {
    document.getElementById("result").innerText = "Request failed. Please try again.";
    console.error("Error during prediction:", err);
  }
});