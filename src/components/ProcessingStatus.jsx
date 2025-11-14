import { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon } from 'lucide-react';

export default function FileUpload({ onFileSelect, isProcessing }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(
      (file) =>
        file.type === "application/pdf" ||
        file.type.startsWith("image/")
    );

    if (validFile) {
      onFileSelect(validFile);
    } else {
      alert("Please upload a PDF or image file");
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  };

  const handleClick = () => {
    if (!isProcessing) fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={` 
        relative rounded-2xl border-2 border-dashed p-12 
        text-center cursor-pointer transition-all duration-200 ease-in-out 
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm 
        shadow-sm hover:shadow-md dark:shadow-none

        ${isDragging
          ? "border-blue-500 bg-blue-50/70 dark:bg-blue-900/30 scale-[1.03]"
          : "border-gray-300 dark:border-gray-700 hover:bg-gray-50/70 dark:hover:bg-gray-800"
        }

        ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={isProcessing}
      />

      <div className="flex flex-col items-center gap-5">
        <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 transition-transform" />

        <div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {isDragging ? "Drop your file here" : "Upload a document"}
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Drag & drop or click to browse files
          </p>

          <div className="flex items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </div>

            <div className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              <span>Images</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
