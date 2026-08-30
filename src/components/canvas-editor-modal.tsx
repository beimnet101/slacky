"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Star, Send } from "lucide-react";

interface CanvasEditorModalProps {
  canvasId: Id<"canvases">;
  onClose: () => void;
  onSend?: () => void; // called after saving to send as a new message
}

export const CanvasEditorModal = ({ canvasId, onClose, onSend }: CanvasEditorModalProps) => {
  const canvas = useQuery(api.canvases.getById, { id: canvasId });
  const updateCanvas = useMutation(api.canvases.update);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);
  const latestTitle = useRef(title);
  const latestContent = useRef(content);

  useEffect(() => { latestTitle.current = title; }, [title]);
  useEffect(() => { latestContent.current = content; }, [content]);

  // Populate once canvas loads
  useEffect(() => {
    if (canvas && !initializedRef.current) {
      initializedRef.current = true;
      setTitle(canvas.title ?? "");
      setContent(canvas.content ?? "");
    }
  }, [canvas]);

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

  // Flush any pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        updateCanvas({ id: canvasId, title: latestTitle.current, content: latestContent.current }).catch(() => {});
      }
    };
  }, [canvasId, updateCanvas]);

  const handleSend = async () => {
    // Flush pending save first
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await updateCanvas({ id: canvasId, title, content });
    setSaved(true);
    onSend?.();
    onClose();
  };

  const toggleStar = async () => {
    if (!canvas) return;
    await updateCanvas({ id: canvasId, isStarred: !canvas.isStarred });
  };

  if (canvas === undefined) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="size-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (canvas === null) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <p className="text-slate-500">Canvas not found</p>
      </div>
    );
  }

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

          <button
            onClick={toggleStar}
            className="p-1.5 rounded hover:bg-slate-100 transition-colors"
            title={canvas.isStarred ? "Unstar" : "Star"}
          >
            <Star className={`size-4 ${canvas.isStarred ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`} />
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

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-500"
          >
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
