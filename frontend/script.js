document.getElementById("pcos-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  Object.keys(data).forEach(k => data[k] = parseFloat(data[k]));

  try {
    const res = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const out = await res.json();
    const message = out.prediction === 1
      ? "🌸 PCOS is likely based on input."
      : "✅ PCOS is unlikely based on input.";

    document.getElementById("result").innerText = message;
  } catch (err) {
    document.getElementById("result").innerText = "Request failed.";
    console.error("Error during prediction:", err);
  }
});