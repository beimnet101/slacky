"use client";
import { useState } from "react";
import { Check } from "lucide-react";

interface FileAttachmentProps {
  url: string;
  fileName: string;
}

export const FileAttachment = ({ url, fileName }: FileAttachmentProps) => {
  const [progress, setProgress] = useState<number | null>(null); // null = idle, 0-100 = downloading, 101 = done
  const [error, setError] = useState(false);

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const getIcon = () => {
    if (["pdf"].includes(ext)) return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    if (["ppt", "pptx"].includes(ext)) return "📋";
    if (["zip", "rar", "7z", "gz"].includes(ext)) return "🗜️";
    if (["mp3", "wav", "aac", "flac"].includes(ext)) return "🎵";
    return "📎";
  };

  const handleDownload = async () => {
    if (progress !== null) return; // already downloading
    setError(false);
    setProgress(0);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");

      const contentLength = res.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : null;
      const reader = res.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total) {
          setProgress(Math.min(99, Math.round((received / total) * 100)));
        } else {
          // Indeterminate — just pulse between 20-80
          setProgress((p) => (p !== null && p < 80 ? p + 10 : 20));
        }
      }

      // Build blob and trigger download with original filename
      const blob = new Blob(chunks);
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

      setProgress(101); // done
      setTimeout(() => setProgress(null), 2500); // reset after 2.5s
    } catch {
      setError(true);
      setProgress(null);
    }
  };

  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = progress !== null && progress <= 100
    ? (progress / 100) * circumference
    : 0;
  const isDone = progress === 101;
  const isDownloading = progress !== null && progress <= 100;

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-3 border border-slate-200 rounded-xl px-3 py-2.5 my-2 max-w-[300px] bg-slate-50 hover:bg-slate-100 transition-colors text-left w-full"
      title={isDownloading ? `Downloading… ${progress}%` : `Download ${fileName}`}
    >
      {/* Icon or progress circle */}
      <div className="relative flex-shrink-0 w-9 h-9 flex items-center justify-center">
        {isDownloading ? (
          /* Circular progress */
          <svg width="36" height="36" className="-rotate-90">
            {/* Track */}
            <circle
              cx="18" cy="18" r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="2.5"
            />
            {/* Progress arc */}
            <circle
              cx="18" cy="18" r={radius}
              fill="none"
              stroke="#007a5a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              className="transition-all duration-200"
            />
          </svg>
        ) : isDone ? (
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="size-4 text-green-600" />
          </div>
        ) : (
          <span className="text-xl">{getIcon()}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">{fileName}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {error ? "Download failed — tap to retry" :
           isDownloading ? `${progress}%` :
           isDone ? "Downloaded" :
           "Tap to download"}
        </p>
      </div>
    </button>
  );
};
