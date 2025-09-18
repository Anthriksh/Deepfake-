import React, { useState } from "react";

// Directly point to Render backend
const API_BASE = "https://deepfake-3.onrender.com";

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

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
        body: formData
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      setError("Upload failed: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
      <div className="max-w-2xl w-full bg-slate-800 p-6 rounded-lg">
        <h1 className="text-2xl mb-4">AI Content Detector</h1>

        <input
          type="file"
          accept="image/*,video/*"
          onChange={e => setFile(e.target.files[0])}
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 rounded"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {error && <div className="mt-4 text-red-400">{error}</div>}
        {result && (
          <pre className="mt-4 text-xs bg-slate-900 p-3 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
