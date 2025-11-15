import { Loader2, FileText, Sparkles, CheckCircle } from "lucide-react";

export default function ProcessingStatus({ stage, progress, fileName }) {
  const stages = [
    { id: "uploading", label: "Uploading Document", icon: FileText },
    { id: "extracting", label: "Extracting Text", icon: FileText },
    { id: "summarizing", label: "Generating Summaries", icon: Sparkles },
    { id: "complete", label: "Complete", icon: CheckCircle },
  ];

  let currentIndex = stages.findIndex((s) => s.id === stage);
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div
      className="
        p-6 rounded-xl border shadow-sm dark:shadow-none
        bg-white dark:bg-gray-900
        border-gray-200 dark:border-gray-700
        transition-all duration-200
      "
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Processing Document
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{fileName}</p>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        {stages.map((item, i) => {
          const Icon = item.icon;
          const active = i === currentIndex;
          const done = i < currentIndex;

          return (
            <div key={item.id} className="flex items-center gap-3">
              <div
                className={`
                  w-8 h-8 rounded-full flex justify-center items-center
                  transition-all duration-200
                  ${
                    done
                      ? "bg-green-200 dark:bg-green-900/40"
                      : active
                      ? "bg-blue-200 dark:bg-blue-900/40"
                      : "bg-gray-200 dark:bg-gray-700"
                  }
                `}
              >
                <Icon
                  className={`
                    w-4 h-4
                    ${
                      done
                        ? "text-green-600 dark:text-green-400"
                        : active
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  `}
                />
              </div>

              <p
                className={`
                  text-sm font-medium
                  ${
                    done || active
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-500 dark:text-gray-400"
                  }
                `}
              >
                {item.label}
              </p>

              {active && progress > 0 && stage === "extracting" && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {progress}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      {stage === "extracting" && progress > 0 && (
        <div className="mt-5">
          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="
                h-2 rounded-full bg-blue-600 dark:bg-blue-400 
                transition-all duration-300
              "
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
