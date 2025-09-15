import React, { useState } from "react";

function UploadCard() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    const formData = new FormData();
    formData.append("file", selectedFile);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/detect", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg mt-10 text-center">
      <input type="file" onChange={handleUpload} className="mb-4" />
      {loading && <p className="text-blue-500">Analyzing...</p>}
      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Result:</h3>
          <p className="mt-2">{result.message}</p>
          <p className="font-bold text-xl text-blue-600">
            Confidence: {result.confidence}%
          </p>
        </div>
      )}
    </div>
  );
}

export default UploadCard;