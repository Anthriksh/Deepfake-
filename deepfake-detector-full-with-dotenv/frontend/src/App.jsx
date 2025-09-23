
const handleUpload = async () => {
  if (!file) {
    setError("Please choose a file first.");
    return;
  }
  setError("");
  setResult(null);
  setLoading(true);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server error ${res.status}: ${text}`);
    }

    const data = await res.json();

    // ✅ Sightengine parsing (fix)
    if (data.status !== "success" || !data.genai) {
      throw new Error("Analysis failed. Please try another file.");
    }

    const genaiData = data.genai;
    const isAIGenerated = genaiData.ai_generated ?? false;
    const confidence = genaiData.confidence ?? 0;

    const prediction = isAIGenerated ? "fake" : "real";

    const resultData = {
      file: file.name,
      prediction,
      confidence,
      time: new Date().toLocaleString(),
      preview,
    };

    setResult(resultData);
    setHistory([resultData, ...history]);
  } catch (e) {
    console.error(e);
    setError("Upload failed: " + (e.message || e));
  } finally {
    setLoading(false);
  }
};
