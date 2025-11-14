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
    setError(null);
    setCurrentSummary(null);
    setCurrentFile(file);
    setProgress(0);

    try {
      setProcessingStage("uploading");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: documentData, error: insertError } = await supabase
        .from("documents")
        .insert({
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          status: "processing",
        })
        .select()
        .single();
      if (insertError) throw insertError;

      setProcessingStage("extracting");
      let extractedText = "";

      if (file.type === "application/pdf") {
        extractedText = await extractTextFromPDF(file);
      } else if (file.type.startsWith("image/")) {
        extractedText = await extractTextFromImage(file, (progressValue) => {
          setProgress(progressValue);
        });
      } else {
        throw new Error("Unsupported file type");
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("No text could be extracted from the document");
      }

      setProcessingStage("summarizing");
      setProgress(0);

      const summaries = await generateSummaries(extractedText);

      const { error: summaryError } = await supabase
        .from("summaries")
        .insert({
          document_id: documentData.id,
          extracted_text: extractedText,
          summary_short: summaries.short,
          summary_medium: summaries.medium,
          summary_long: summaries.long,
          key_points: summaries.keyPoints,
        });
      if (summaryError) throw summaryError;

      await supabase
        .from("documents")
        .update({ status: "completed" })
        .eq("id", documentData.id);

      setProcessingStage("complete");

      const { data: summaryData } = await supabase
        .from("summaries")
        .select("*")
        .eq("document_id", documentData.id)
        .single();

      setCurrentSummary(summaryData);
      setHistoryKey((prev) => prev + 1);
    } catch (err) {
      console.error("Error processing document:", err);
      setError(err.message || "Failed to process document. Please try again.");
    } finally {
      setProcessing(false);
      setProcessingStage("");
      setProgress(0);
    }
  }

  async function handleSelectDocument(doc) {
    if (doc.summaries && doc.summaries.length > 0) {
      setCurrentSummary(doc.summaries[0]);
      setCurrentFile({ name: doc.filename });
    }
  }

  function handleNewDocument() {
    setCurrentSummary(null);
    setCurrentFile(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* HEADER */}
      <header className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Document Summary Assistant
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Upload PDFs or images to generate AI-powered summaries
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">
            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-400">Error</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* FILE UPLOAD */}
            {!processing && !currentSummary && (
              <FileUpload onFileSelect={handleFileSelect} isProcessing={processing} />
            )}

            {/* PROCESSING STATUS */}
            {processing && (
              <ProcessingStatus
                stage={processingStage}
                progress={progress}
                fileName={currentFile?.name}
              />
            )}

            {/* SUMMARY DISPLAY */}
            {currentSummary && !processing && (
              <>
                <SummaryDisplay summary={currentSummary} fileName={currentFile?.name} />

                <div className="flex justify-center">
                  <button
                    onClick={handleNewDocument}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md"
                  >
                    Upload Another Document
                  </button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT SIDE - HISTORY */}
          <div className="lg:col-span-1">
            <DocumentHistory
              key={historyKey}
              onSelectDocument={handleSelectDocument}
              currentDocumentId={currentSummary?.document_id}
            />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>AI powered Application</p>
        </div>
      </footer>
    </div>
  );
}
