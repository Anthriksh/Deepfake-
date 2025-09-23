import React, { useEffect, useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_BASE = import.meta.env.VITE_API_BACKEND || "https://deepfake-3.onrender.com";

/* Simple i18n strings */
const I18N = {
  English: {
    title: "AI Content Detector",
    uploadHint: "Drop file here or click to select (image/video)",
    analyze: "Analyze",
    analyzing: "Analyzing...",
    chooseFile: "Please choose a file first.",
    copyReport: "📋 Copy Report",
    downloadPdf: "⬇️ Download PDF",
    exportCsv: "Export CSV",
    uploadedAt: "Uploaded at",
    confidence: "Confidence",
    prediction: "Prediction",
    file: "File",
    history: "History",
    summary: "Summary Chart",
    real: "real",
    fake: "fake"
  },
  Spanish: {
    title: "Detector de Contenido AI",
    uploadHint: "Suelta el archivo aquí o haz clic para seleccionar (imagen/video)",
    analyze: "Analizar",
    analyzing: "Analizando...",
    chooseFile: "Por favor selecciona un archivo primero.",
    copyReport: "📋 Copiar reporte",
    downloadPdf: "⬇️ Descargar PDF",
    exportCsv: "Exportar CSV",
    uploadedAt: "Subido el",
    confidence: "Confianza",
    prediction: "Predicción",
    file: "Archivo",
    history: "Historial",
    summary: "Gráfico",
    real: "real",
    fake: "falso"
  },
  French: {
    title: "Détecteur de contenu IA",
    uploadHint: "Déposez le fichier ici ou cliquez pour sélectionner (image/vidéo)",
    analyze: "Analyser",
    analyzing: "Analyse en cours...",
    chooseFile: "Veuillez d'abord choisir un fichier.",
    copyReport: "📋 Copier le rapport",
    downloadPdf: "⬇️ Télécharger PDF",
    exportCsv: "Exporter CSV",
    uploadedAt: "Téléversé le",
    confidence: "Confiance",
    prediction: "Prédiction",
    file: "Fichier",
    history: "Historique",
    summary: "Graphique",
    real: "réel",
    fake: "faux"
  }
};

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => {
    // load from localStorage
    try {
      const raw = localStorage.getItem("df_history");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [error, setError] = useState("");
  const [lang, setLang] = useState(() => localStorage.getItem("df_lang") || "English");
  const [dark, setDark] = useState(() => localStorage.getItem("df_theme") !== "light");
  const [copied, setCopied] = useState(false);
  const dropRef = useRef(null);
  const i18 = I18N[lang] || I18N.English;

  useEffect(() => {
    localStorage.setItem("df_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("df_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("df_lang", lang);
  }, [lang]);

  // drag & drop handlers
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDragOver = (e) => { e.preventDefault(); el.classList.add("ring-2", "ring-indigo-400"); };
    const onDragLeave = (e) => { el.classList.remove("ring-2", "ring-indigo-400"); };
    const onDrop = (e) => {
      e.preventDefault();
      el.classList.remove("ring-2", "ring-indigo-400");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const f = e.dataTransfer.files[0];
        setFileAndPreview(f);
        e.dataTransfer.clearData();
      }
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  function setFileAndPreview(f) {
    setFile(f);
    setError("");
    setResult(null);
    if (f && f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  const handleFileInput = (e) => {
    const f = e.target.files[0];
    if (f) setFileAndPreview(f);
  };

  const handleUpload = async () => {
    if (!file) {
      setError(i18.chooseFile);
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: form
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server ${res.status}: ${txt}`);
      }
      const data = await res.json();

      // backend returns { file, prediction, confidence }
      const record = {
        file: data.file || file.name,
        prediction: (data.prediction || "unknown"),
        confidence: typeof data.confidence === "number" ? data.confidence : 0,
        time: new Date().toLocaleString(),
        preview
      };

      setResult(record);
      setHistory(prev => [record, ...prev].slice(0, 200)); // keep last 200
      setCopied(false);
    } catch (err) {
      console.error(err);
      setError("Error: " + (err.message || "Analysis failed"));
    } finally {
      setLoading(false);
    }
  };

  const copyReport = async () => {
    if (!result) return;
    const text = `${i18.title} - Analysis\nFile: ${result.file}\nPrediction: ${result.prediction}\n${i18.confidence}: ${(result.confidence*100).toFixed(1)}%\n${i18.uploadedAt}: ${result.time}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy to clipboard.");
    }
  };

  const downloadPdf = async () => {
    if (!result) return;
    // render a small report area to canvas then to pdf
    const el = document.createElement("div");
    el.style.width = "800px";
    el.style.padding = "24px";
    el.style.fontFamily = "Arial, sans-serif";
    el.style.background = dark ? "#0f172a" : "#fff";
    el.style.color = dark ? "#fff" : "#111";

    // add logo
    const img = document.createElement("img");
    img.src = "/logo.png";
    img.style.height = "80px";
    img.style.objectFit = "contain";
    el.appendChild(img);

    const h = document.createElement("h2");
    h.textContent = `${i18.title} - Report`;
    h.style.marginTop = "12px";
    el.appendChild(h);

    const p1 = document.createElement("p");
    p1.textContent = `${i18.file}: ${result.file}`;
    el.appendChild(p1);

    const p2 = document.createElement("p");
    p2.textContent = `${i18.prediction}: ${result.prediction}`;
    el.appendChild(p2);

    const p3 = document.createElement("p");
    p3.textContent = `${i18.confidence}: ${(result.confidence*100).toFixed(1)}%`;
    el.appendChild(p3);

    const p4 = document.createElement("p");
    p4.textContent = `${i18.uploadedAt}: ${result.time}`;
    el.appendChild(p4);

    // if preview image, append it
    if (result.preview) {
      const img2 = document.createElement("img");
      img2.src = result.preview;
      img2.style.width = "100%";
      img2.style.maxHeight = "400px";
      img2.style.objectFit = "contain";
      img2.style.marginTop = "12px";
      el.appendChild(img2);
    }

    document.body.appendChild(el);
    try {
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Calculate image dimensions to fit A4 width
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(imgData, "JPEG", (pageWidth - w) / 2, 40, w, h);
      pdf.save(`${result.file.replace(/\s+/g, "_")}_report.pdf`);
    } catch (err) {
      console.error(err);
      setError("Failed to generate PDF.");
    } finally {
      document.body.removeChild(el);
    }
  };

  const exportCsv = () => {
    const rows = [
      ["File", "Prediction", "Confidence (%)", "Uploaded At"]
    ];
    history.forEach(h => rows.push([h.file, h.prediction, (h.confidence*100).toFixed(1), h.time]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deepfake_history.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // chart data (counts + avg confidence)
  const fakeItems = history.filter(h => h.prediction === "fake");
  const realItems = history.filter(h => h.prediction === "real");
  const avgConfidence = (items) => items.length ? (items.reduce((s,i)=>s+i.confidence,0)/items.length)*100 : 0;
  const chartData = [
    { name: "Deepfake", count: fakeItems.length, confidence: Math.round(avgConfidence(fakeItems)) },
    { name: "Real", count: realItems.length, confidence: Math.round(avgConfidence(realItems)) },
  ];

  return (
    <div className={`${dark ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-900"} min-h-screen p-4`}>
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="logo" className="h-12 w-12 rounded-md object-cover shadow" />
            <div>
              <h1 className="text-2xl font-bold">{i18.title}</h1>
              <p className="text-sm text-slate-400">Upload an image or short video to check if it's AI-generated.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select value={lang} onChange={(e) => setLang(e.target.value)} className={`${dark ? "bg-slate-800 text-white" : "bg-white text-gray-900"} border px-2 py-1 rounded`}>
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>

            <button onClick={() => { setDark(!dark); }} className={`px-3 py-1 rounded ${dark ? "bg-indigo-600" : "bg-indigo-500"}`}>
              {dark ? "🌙" : "☀️"}
            </button>
          </div>
        </header>

        {/* Upload area */}
        <section className={`${dark ? "bg-slate-800" : "bg-white"} rounded-xl p-6 shadow mb-6`}>
          <div ref={dropRef} className="border-dashed border-2 border-slate-600 rounded-lg p-6 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <p className="text-sm text-slate-300 mb-3">{i18.uploadHint}</p>

              <input type="file" accept="image/*,video/*" onChange={handleFileInput} className="mb-3 w-full" />
              <div className="flex gap-3">
                <button onClick={handleUpload} disabled={loading} className="px-4 py-2 bg-indigo-600 rounded text-white">
                  {loading ? `${i18.analyzing}` : i18.analyze}
                </button>
                <button onClick={exportCsv} className="px-4 py-2 bg-slate-600 rounded text-white">
                  {i18.exportCsv}
                </button>
              </div>

              {error && <div className="mt-3 text-red-400 text-sm">{error}</div>}
            </div>

            {/* preview + quick actions */}
            <div className="w-48">
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-32 object-cover rounded" />
              ) : (
                <div className="w-full h-32 bg-slate-700 rounded flex items-center justify-center text-slate-400">No preview</div>
              )}
              {result && (
                <div className="mt-3 bg-slate-900/40 p-3 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm">{i18.file}: <strong>{result.file}</strong></div>
                      <div className="text-xs text-slate-400">{i18.uploadedAt}: {result.time}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button onClick={copyReport} className="px-3 py-1 bg-indigo-600 rounded text-white">{copied ? "✅ Copied!" : i18.copyReport}</button>
                    <button onClick={downloadPdf} className="px-3 py-1 bg-slate-700 rounded text-white">{i18.downloadPdf}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Result card */}
        {result && (
          <section className={`${dark ? "bg-slate-800" : "bg-white"} rounded-xl p-6 shadow mb-6`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-2 rounded-full ${result.prediction === "fake" ? "bg-red-600" : "bg-green-600"}`}></div>
                  <div>
                    <div className="text-sm text-slate-400">{i18.prediction}</div>
                    <div className="text-lg font-semibold">{result.prediction}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-slate-400">{i18.confidence}</div>
                  <div className="flex items-center gap-4 mt-2">
                    <div style={{ width: 96, height: 96 }}>
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="44" stroke="#1f2937" strokeWidth="12" fill="none" />
                        <circle
                          cx="50" cy="50" r="44"
                          stroke={result.prediction === "fake" ? "#ef4444" : "#10b981"}
                          strokeWidth="12"
                          strokeDasharray={`${Math.max(0, Math.min(100, result.confidence * 100))} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                          fill="none"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{(result.confidence*100).toFixed(1)}%</div>
                      <div className="text-sm text-slate-400">Confidence</div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="w-full md:w-1/3">
                <h3 className="text-sm text-slate-400 mb-2">Quick actions</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={copyReport} className="px-3 py-2 bg-indigo-600 rounded text-white">{copied ? "✅ Copied!" : i18.copyReport}</button>
                  <button onClick={downloadPdf} className="px-3 py-2 bg-slate-700 rounded text-white">{i18.downloadPdf}</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* History + Chart */}
        {history.length > 0 && (
          <section className={`${dark ? "bg-slate-800" : "bg-white"} rounded-xl p-6 shadow`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{i18.history}</h2>
              <div className="text-sm text-slate-400">{history.length} entries</div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {history.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/20 rounded">
                      <div className="flex items-center gap-3">
                        {h.preview && <img src={h.preview} alt="thumb" className="h-10 w-10 object-cover rounded" />}
                        <div>
                          <div className="text-sm">{h.file}</div>
                          <div className="text-xs text-slate-400">{h.time}</div>
                        </div>
                      </div>
                      <div className={h.prediction === "fake" ? "text-red-400" : "text-green-400"}>
                        {h.prediction} {(h.confidence*100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm text-slate-400 mb-2">{i18.summary}</h3>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#4f46e5" name="Count" />
                      <Bar dataKey="confidence" fill="#10b981" name="Avg Confidence (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
