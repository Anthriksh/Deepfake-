import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BACKEND || "https://deepfake-3.onrender.com";

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("English");

  const handleUpload = async () => {
    if (!file) {
      setError("Choose a file first");
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
      setResult(data);
      setHistory([{ file: file.name, ...data }, ...history]);
    } catch (e) {
      console.error(e);
      setError("Upload failed: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 text-white p-6 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-3xl flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Content Detector</h1>
        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-slate-800 text-white px-3 py-1 rounded"
        >
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
        </select>
      </header>

      {/* Upload card */}
      <div className="w-full max-w-2xl bg-slate-800 p-6 rounded-2xl shadow-lg mb-6">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full mb-4 text-sm file:bg-indigo-600 file:text-white file:px-4 file:py-2 file:rounded-lg file:border-0 cursor-pointer"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        {error && <div className="mt-4 text-red-400">{error}</div>}

        {result && (
          <div className="mt-4 p-4 bg-slate-900 rounded-lg shadow-inner text-sm">
            <strong>Prediction:</strong> {result.prediction} <br />
            <strong>Confidence:</strong> {result.confidence}
          </div>
        )}
      </div>

      {/* History tab */}
      {history.length > 0 && (
        <div className="w-full max-w-2xl bg-slate-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">History</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {history.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-slate-900 rounded-lg flex justify-between items-center"
              >
                <span>{item.file}</span>
                <span>
                  {item.prediction} ({Math.round(item.confidence * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
