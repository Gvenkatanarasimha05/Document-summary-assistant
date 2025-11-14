import { useState } from 'react';
import { FileText, List, Maximize2 } from 'lucide-react';

export default function SummaryDisplay({ summary, fileName }) {
  const [selectedLength, setSelectedLength] = useState("medium");

  const lengths = [
    { id: "short", label: "Short", description: "2-3 sentences" },
    { id: "medium", label: "Medium", description: "1 paragraph" },
    { id: "long", label: "Long", description: "2-3 paragraphs" },
  ];

  const summaryText = summary[`summary_${selectedLength}`];

  return (
    <div className="space-y-8">

      {/* SUMMARY CARD */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Document Summary
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{fileName}</p>
        </div>

        <div className="p-6">
          {/* LENGTH BUTTONS */}
          <div className="flex gap-3 mb-6">
            {lengths.map((length) => (
              <button
                key={length.id}
                onClick={() => setSelectedLength(length.id)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    selectedLength === length.id
                      ? "bg-blue-600 text-white shadow-md dark:shadow-blue-900/30"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }
                `}
              >
                {length.label}
              </button>
            ))}
          </div>

          {/* SUMMARY TEXT */}
          <div className="prose max-w-none dark:prose-invert">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {summaryText}
            </p>
          </div>
        </div>
      </div>

      {/* KEY POINTS */}
      {summary.key_points && summary.key_points.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Key Points
              </h3>
            </div>
          </div>

          <div className="p-6">
            <ul className="space-y-3">
              {summary.key_points.map((point, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* FULL EXTRACTED TEXT */}
      {summary.extracted_text && (
        <details className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
          <summary className="cursor-pointer p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 inline">
                View Full Extracted Text
              </h3>
            </div>
          </summary>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-300 font-mono leading-relaxed">
              {summary.extracted_text}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}
