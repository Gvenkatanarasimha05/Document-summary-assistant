import { useState } from "react";
import { FileText, AlertCircle } from "lucide-react";
import FileUpload from "./components/FileUpload";
import ProcessingStatus from "./components/ProcessingStatus";
import SummaryDisplay from "./components/SummaryDisplay";
import DocumentHistory from "./components/DocumentHistory";
import { supabase } from "./lib/supabase";
import { extractTextFromPDF, extractTextFromImage } from "./lib/documentProcessor";
import { generateSummaries } from "./lib/gemini";

export default function App() {
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [error, setError] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);

  async function handleFileSelect(file) {
    setProcessing(true);
    setCurrentFile(file);
    setProcessingStage("uploading");
    setProgress(0);
    setError(null);

    try {
      // validate file
      if (!file.type.includes("pdf") && !file.type.startsWith("image/")) {
        throw new Error("Only PDF or image files are supported");
      }

      // upload to supabase
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw new Error(uploadError.message);

      // add database row
      const { data: docRow, error: docErr } = await supabase
        .from("documents")
        .insert({
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: fileName,
          status: "processing",
        })
        .select()
        .single();

      if (docErr) throw new Error(docErr.message);

      // extract text
      setProcessingStage("extracting");

      let extractedText = "";
      if (file.type.includes("pdf")) {
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await extractTextFromImage(file, (p) => setProgress(p));
      }

      if (!extractedText || extractedText.trim() === "") {
        throw new Error("Could not extract readable text");
      }

      // generate summaries
      setProcessingStage("summarizing");
      setProgress(0);

      const summaries = await generateSummaries(extractedText);

      const { error: sumErr } = await supabase
        .from("summaries")
        .insert({
          document_id: docRow.id,
          extracted_text: extractedText,
          summary_short: summaries.short,
          summary_medium: summaries.medium,
          summary_long: summaries.long,
          key_points: summaries.keyPoints,
        });

      if (sumErr) throw new Error(sumErr.message);

      // update status
      await supabase
        .from("documents")
        .update({ status: "completed" })
        .eq("id", docRow.id);

      setProcessingStage("complete");

      const { data: summaryData } = await supabase
        .from("summaries")
        .select("*")
        .eq("document_id", docRow.id)
        .single();

      setCurrentSummary(summaryData);
      setHistoryKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unexpected error");
    } finally {
      setProcessing(false);
      // DON'T reset stage here
    }
  }

  function handleSelectDocument(doc) {
    if (doc.summaries?.length > 0) {
      setCurrentSummary(doc.summaries[0]);
      setCurrentFile({ name: doc.filename });
    }
  }

  function handleNewDocument() {
    setCurrentSummary(null);
    setCurrentFile(null);
    setError(null);
    setProcessingStage("");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* HEADER */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl shadow text-white">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Document Summary Assistant
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upload PDF or Image → AI Generates Summary
            </p>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* File upload */}
          {!processing && !currentSummary && (
            <FileUpload onFileSelect={handleFileSelect} />
          )}

          {/* Processing status */}
          {processing && (
            <ProcessingStatus
              stage={processingStage}
              progress={progress}
              fileName={currentFile?.name}
            />
          )}

          {/* Summary */}
          {currentSummary && !processing && (
            <>
              <SummaryDisplay summary={currentSummary} fileName={currentFile?.name} />

              <div className="flex justify-center mt-4">
                <button
                  onClick={handleNewDocument}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg"
                >
                  Upload Another Document
                </button>
              </div>
            </>
          )}

        </div>

        {/* RIGHT SIDE */}
        <div>
          <DocumentHistory
            key={historyKey}
            onSelectDocument={handleSelectDocument}
            currentDocumentId={currentSummary?.document_id}
          />
        </div>

      </main>

      {/* FOOTER */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        AI Powered System
      </footer>

    </div>
  );
}
