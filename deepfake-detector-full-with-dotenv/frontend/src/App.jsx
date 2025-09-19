import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const API_BASE =
  import.meta.env.VITE_API_BACKEND || "https://deepfake-3.onrender.com";

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("English");
  const [darkMode, setDarkMode] = useState(true);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setResult(null);
    setError("");
    if (f && f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

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

      // ✅ Parse Sightengine response properly
      const prediction = data.deepfake?.label || "unknown";
      const confidence = data.deepfake?.prob ?? 0;

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

  const chartData = [
    {
      name: "Deepfake",
      count: history.filter((h) => h.prediction === "fake").length,
    },
    {
      name: "Real",
      count: history.filter((h) => h.prediction === "real").length,
    },
  ];

  const getPredictionColor = (prediction) =>
    prediction === "real" ? "text-green-400" : "text-red-400";

  return (
    <div
      className={`${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } min-h-screen p-6 flex flex-col items-center transition-colors duration-500`}
    >
      {/* Header */}
      <header className="w-full max-w-3xl flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span role="img" aria-label="shield">
            🛡️
          </span>
          AI Content Detector
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            title="Select language"
            className={`${
              darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            } px-3 py-1 rounded transition`}
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1 transition"
          >
            {darkMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </header>

      {/* Upload card */}
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } w-full max-w-2xl p-6 rounded-2xl shadow-lg mb-6 transition-colors duration-500`}
      >
        <div className="mb-4">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="w-full text-sm file:bg-indigo-600 file:text-white file:px-4 file:py-2 file:rounded-lg file:border-0 cursor-pointer"
          />
        </div>

        {preview && (
          <div className="mb-4 flex justify-center">
            <img
              src={preview}
              alt="preview"
              className="max-h-48 rounded-lg shadow-md"
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition relative overflow-hidden"
        >
          {loading ? (
            <div className="flex justify-center items-center gap-2">
              <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </div>
          ) : (
            "Analyze"
          )}
        </button>

        {error && <div className="mt-4 text-red-400">{error}</div>}

        {result && (
          <div
            className={`${
              darkMode ? "bg-gray-900" : "bg-gray-100"
            } mt-4 p-4 rounded-lg shadow-inner text-sm transition-colors duration-500`}
          >
            <strong>File:</strong> {result.file} <br />
            <strong>Prediction:</strong>{" "}
            <span className={getPredictionColor(result.prediction)}>
              {result.prediction}
            </span>{" "}
            <br />
            <strong>Confidence:</strong>{" "}
            {(result.confidence * 100).toFixed(0)}% <br />
            <strong>Uploaded at:</strong> {result.time}
          </div>
        )}
      </div>

      {/* History + Chart */}
      {history.length > 0 && (
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } w-full max-w-2xl p-6 rounded-2xl shadow-lg transition-colors duration-500`}
        >
          <h2 className="text-xl font-semibold mb-4">History</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
            {history.map((item, index) => (
              <div
                key={index}
                className={`${
                  darkMode
                    ? "bg-gray-900 hover:bg-gray-700"
                    : "bg-gray-100 hover:bg-gray-200"
                } p-3 rounded-lg flex justify-between items-center transition-colors duration-300`}
              >
                <span className="flex items-center gap-2">
                  {item.preview && (
                    <img
                      src={item.preview}
                      alt="thumb"
                      className="h-8 w-8 rounded-md object-cover"
                    />
                  )}
                  {item.file}
                </span>
                <span className={getPredictionColor(item.prediction)}>
                  {item.prediction} ({Math.round(item.confidence * 100)}%)
                </span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <h2 className="text-xl font-semibold mb-4">Summary Chart</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}


