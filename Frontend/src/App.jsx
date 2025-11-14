import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [length, setLength] = useState("medium"); // Default summary length

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleLengthChange = (e) => {
    setLength(e.target.value);
  };

  const uploadPdf = async () => {
    if (!file) {
      alert("Please upload a PDF or image file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("length", length); // send summary length to backend

    try {
      const res = await axios.post("/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      alert("Error summarizing file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>📄 Document Summary Assistant</h1>

        <label style={styles.uploadBox}>
          <input
            type="file"
            accept="application/pdf, image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <span>{file ? file.name : "Click to upload PDF or Image"}</span>
        </label>

        {/* Summary length options */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ marginRight: 10 }}>
            Summary Length:
          </label>
          <select value={length} onChange={handleLengthChange}>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>

        <button style={styles.button} onClick={uploadPdf} disabled={loading}>
          {loading ? "⏳ Summarizing..." : "Summarize"}
        </button>

        <h2 style={styles.subtitle}>Summary</h2>

        <div style={styles.summaryBox}>
          {loading ? (
            <div style={styles.loader}></div>
          ) : (
            <pre style={styles.summaryText}>{summary}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- STYLES ----------------
const styles = {
  page: {
    background: "#f5f7fa",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    background: "#fff",
    width: "100%",
    maxWidth: 600,
    padding: 30,
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  title: { textAlign: "center", marginBottom: 25, fontSize: 28 },
  uploadBox: {
    border: "2px dashed #7a7a7a",
    padding: 25,
    borderRadius: 10,
    textAlign: "center",
    cursor: "pointer",
    marginBottom: 20,
    background: "#fafafa",
    display: "block",
    color: "#444",
  },
  button: {
    width: "100%",
    padding: 12,
    border: "none",
    borderRadius: 8,
    background: "#007bff",
    color: "#fff",
    cursor: "pointer",
    fontSize: 16,
    marginTop: 10,
  },
  subtitle: { marginTop: 30, fontSize: 22, marginBottom: 10 },
  summaryBox: {
    background: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    minHeight: 150,
    maxHeight: 350,
    overflowY: "auto",
  },
  summaryText: { whiteSpace: "pre-wrap", margin: 0, fontFamily: "monospace" },
  loader: {
    border: "4px solid #ddd",
    borderTop: "4px solid #007bff",
    borderRadius: "50%",
    width: 30,
    height: 30,
    margin: "auto",
    animation: "spin 1s linear infinite",
  },
};

const styleTag = document.createElement("style");
styleTag.innerHTML = `
@keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(styleTag);

export default App;
