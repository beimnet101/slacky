"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Star, Send } from "lucide-react";

interface CanvasEditorModalProps {
  canvasId: Id<"canvases">;
  initialTitle: string;
  initialContent: string;
  initialIsStarred?: boolean;
  onClose: () => void;
  onSend?: () => void;
}

export const CanvasEditorModal = ({
  canvasId,
  initialTitle,
  initialContent,
  initialIsStarred = false,
  onClose,
  onSend,
}: CanvasEditorModalProps) => {
  const updateCanvas = useMutation(api.canvases.update);

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isStarred, setIsStarred] = useState(initialIsStarred);
  const [saved, setSaved] = useState(true);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestTitle = useRef(title);
  const latestContent = useRef(content);

  useEffect(() => { latestTitle.current = title; }, [title]);
  useEffect(() => { latestContent.current = content; }, [content]);

  const scheduleSave = useCallback((newTitle: string, newContent: string) => {
    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await updateCanvas({ id: canvasId, title: newTitle, content: newContent });
      setSaved(true);
    }, 800);
  }, [canvasId, updateCanvas]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTitle(v);
    scheduleSave(v, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setContent(v);
    scheduleSave(title, v);
  };

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        updateCanvas({ id: canvasId, title: latestTitle.current, content: latestContent.current }).catch(() => {});
      }
    };
  }, [canvasId, updateCanvas]);

  const handleSend = async () => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    await updateCanvas({ id: canvasId, title, content });
    setSaved(true);
    onSend?.();
    onClose();
  };

  const toggleStar = async () => {
    const next = !isStarred;
    setIsStarred(next);
    await updateCanvas({ id: canvasId, isStarred: next });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-teal-600/20 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] text-teal-700 font-bold">C</span>
          </div>
          <span className="text-xs text-slate-500">Canvas</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs ${saved ? "text-green-500" : "text-slate-400 animate-pulse"}`}>
            {saved ? "Saved" : "Saving..."}
          </span>

          <button onClick={toggleStar} className="p-1.5 rounded hover:bg-slate-100 transition-colors">
            <Star className={`size-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`} />
          </button>

          {onSend && (
            <button
              onClick={handleSend}
              className="flex items-center gap-1.5 bg-[#007a5a] hover:bg-[#006649] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
            >
              <Send className="size-3.5" />
              Send
            </button>
          )}

          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-500">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          <input
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled canvas"
            className="w-full text-3xl font-bold text-slate-900 placeholder:text-slate-300 outline-none mb-6 bg-transparent"
          />
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing..."
            className="w-full min-h-[60vh] text-base text-slate-700 placeholder:text-slate-300 outline-none resize-none leading-relaxed bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};
