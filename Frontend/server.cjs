const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse-fixed");
const Tesseract = require("tesseract.js");
require("dotenv").config();
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// Multer setup for temporary uploads
const upload = multer({ dest: "uploads/" });

// === Helper: Split text into smaller chunks ===
function splitTextIntoChunks(text, wordsPerChunk = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
}

// === Helper: Call Gemini API for a single chunk ===
async function generateSummaryFromGemini(textChunk) {
  const apiKey = process.env.GEMINI_API_KEY;
  const payload = {
    response_mode: "COMPLETE",
    temperature: 0.2,
    candidate_count: 1,
    prompt: [
      {
        author: "user",
        content: [
          { type: "text", text: `Summarize this text concisely:\n\n${textChunk}` }
        ]
      }
    ]
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json();
  console.log("Gemini response:", JSON.stringify(result, null, 2));

  // Extract summary safely from possible fields
  return (
    result?.candidates?.[0]?.content?.[0]?.text ||
    result?.candidates?.[0]?.output_text ||
    ""
  );
}

app.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const mime = req.file.mimetype;
    let extractedText = "";

    // === PDF Extraction ===
    if (mime === "application/pdf") {
      const buffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || "";
    }
    // === Image OCR Extraction ===
    else if (mime.startsWith("image/")) {
      const { data: { text } } = await Tesseract.recognize(filePath, "eng");
      extractedText = text || "";
    }

    // Clean up the uploaded file immediately
    fs.unlinkSync(filePath);

    if (!extractedText.trim()) {
      return res.json({ summary: "Could not extract text from file." });
    }

    // Remove excessive whitespace
    extractedText = extractedText.replace(/\s+/g, " ").trim();

    // === Get desired summary length from client ===
    const length = req.body.length || "medium";

    // Determine words per chunk based on length
    let wordsPerChunk;
    switch (length) {
      case "short":
        wordsPerChunk = 300;
        break;
      case "long":
        wordsPerChunk = 800;
        break;
      default: // medium
        wordsPerChunk = 500;
    }

    // === Split text into chunks ===
    const chunks = splitTextIntoChunks(extractedText, wordsPerChunk);

    // === Generate summary for each chunk ===
    const chunkSummaries = [];
    for (const chunk of chunks) {
      // Adjust prompt based on length
      const promptText =
        length === "short"
          ? `Summarize this text in 2-3 sentences:\n\n${chunk}`
          : length === "long"
          ? `Summarize this text with detailed points:\n\n${chunk}`
          : `Summarize this text concisely:\n\n${chunk}`;

      const summary = await generateSummaryFromGemini(promptText);
      if (summary.trim()) chunkSummaries.push(summary.trim());
    }

    // Combine chunk summaries into final summary
    const finalSummary = chunkSummaries.join(" ");

    // Fallback: return first 500 chars if AI fails
    const summaryToSend = finalSummary || extractedText.slice(0, 500) + "...";

    res.json({ summary: summaryToSend });
  } catch (err) {
    console.error("Server error:", err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Server error" });
  }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
