import Quill from "quill";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { toast } from "sonner";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useGetCanvases } from "@/features/canvases/api/use-get-canvases";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { XIcon, Plus } from "lucide-react";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

interface ChatInputProps {
  placeholder: string;
  conversationId: Id<"conversations">;
}

type CreateMessageValues = {
  conversationId: Id<"conversations">;
  workspaceId: Id<"workspaces">;
  body: string;
  image?: Id<"_storage">;
  video?: Id<"_storage">;
  fileId?: Id<"_storage">;
  fileName?: string;
  canvasId?: Id<"canvases">;
}

type PendingAssignment = {
  issueKey: string;
  jiraAccountId: string;
  jiraDisplayName: string;
};

export const ChatInput = ({ placeholder, conversationId }: ChatInputProps) => {
  const [isPending, setIsPendng] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [issueKeyInput, setIssueKeyInput] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const editorRef = useRef<Quill | null>(null);
  const workspaceId = useWorkspaceId();

  const { mutate: generateUploadurl } = useGenerateUploadUrl();
  const { mutate: createMessage } = useCreateMessage();
  const { data: canvases } = useGetCanvases({ workspaceId });
  const jiraConnection = useQuery(api.jira.getConnection, { workspaceId });
  const workspaceLinks = useQuery(api.jira.getWorkspaceLinks, jiraConnection ? { workspaceId } : "skip");
  const assignIssue = useAction(api.jira.assignIssue);

  const jiraConnected = !!jiraConnection;

  const handleAddAssignment = () => {
    const key = issueKeyInput.trim().toUpperCase();
    const link = workspaceLinks?.find((l) => l.jiraAccountId === selectedAccountId);
    if (!key || !link) return;
    const id = key + link.jiraAccountId;
    if (pendingAssignments.find((a) => a.issueKey + a.jiraAccountId === id)) return;
    setPendingAssignments((prev) => [
      ...prev,
      { issueKey: key, jiraAccountId: link.jiraAccountId, jiraDisplayName: link.jiraDisplayName },
    ]);
    setIssueKeyInput("");
    setShowPanel(false);
  };

  const handleSubmit = async ({
    body, image, video, file, canvasId,
  }: {
    body: string;
    image: File | null;
    video: File | null;
    file: File | null;
    canvasId: Id<"canvases"> | null;
  }) => {
    try {
      setIsPendng(true);
      editorRef.current?.enable(false);

      const values: CreateMessageValues = {
        conversationId,
        workspaceId,
        body,
        canvasId: canvasId ?? undefined,
      };

      if (image) {
        const url = await generateUploadurl({}, { throwError: true });
        if (!url) throw new Error("url not found");
        const result = await fetch(url, { method: "POST", headers: { "Content-Type": image.type }, body: image });
        if (!result.ok) throw new Error("Failed to upload image");
        values.image = (await result.json()).storageId;
      }
      if (video) {
        const url = await generateUploadurl({}, { throwError: true });
        if (!url) throw new Error("url not found");
        const result = await fetch(url, { method: "POST", headers: { "Content-Type": video.type }, body: video });
        if (!result.ok) throw new Error("Failed to upload video");
        values.video = (await result.json()).storageId;
      }
      if (file) {
        const url = await generateUploadurl({}, { throwError: true });
        if (!url) throw new Error("url not found");
        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!result.ok) throw new Error("Failed to upload file");
        const { storageId } = await result.json();
        values.fileId = storageId;
        values.fileName = file.name;
      }

      await createMessage(values, { throwError: true });

      for (const a of pendingAssignments) {
        assignIssue({ workspaceId, issueKey: a.issueKey, jiraAccountId: a.jiraAccountId })
          .then(() => toast.success(`Assigned ${a.issueKey} to ${a.jiraDisplayName}`))
          .catch(() => toast.error(`Failed to assign ${a.issueKey}`));
      }

      setEditorKey((prev) => prev + 1);
      setPendingAssignments([]);
      setShowPanel(false);
      setIssueKeyInput("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setIsPendng(false);
      editorRef.current?.enable(true);
    }
  };

  return (
    <div className="px-5 w-full">
      <Editor
        key={editorKey}
        placeholder={placeholder}
        variant="create"
        onSubmit={handleSubmit}
        disabled={isPending}
        innerRef={editorRef}
        workspaceCanvases={canvases?.map((c: { _id: string; title: string }) => ({ _id: c._id, title: c.title })) ?? []}
      />

      {/* Jira assign panel */}
      {jiraConnected && (
        <div className="mt-1">
          {pendingAssignments.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {pendingAssignments.map((a) => (
                <span
                  key={a.issueKey + a.jiraAccountId}
                  className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-xs text-blue-800"
                >
                  <span className="size-3.5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-[8px]">J</span>
                  <span className="font-mono font-semibold">{a.issueKey}</span>
                  <span className="text-blue-500">→</span>
                  <span>{a.jiraDisplayName}</span>
                  <button
                    onClick={() => setPendingAssignments((prev) => prev.filter((x) => x.issueKey + x.jiraAccountId !== a.issueKey + a.jiraAccountId))}
                    className="text-blue-400 hover:text-blue-600 ml-0.5"
                  >
                    <XIcon className="size-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {showPanel ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
              <input
                type="text"
                placeholder="Issue key (e.g. ABC-123)"
                value={issueKeyInput}
                onChange={(e) => setIssueKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddAssignment()}
                className="text-xs border border-slate-200 rounded px-2 py-1 w-36 focus:outline-none focus:border-blue-300"
              />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-300 bg-white"
                disabled={!workspaceLinks?.length}
              >
                <option value="">{workspaceLinks?.length ? "Assignee" : "No linked accounts"}</option>
                {workspaceLinks?.map((l) => (
                  <option key={l.jiraAccountId} value={l.jiraAccountId}>
                    {l.jiraDisplayName}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddAssignment}
                disabled={!issueKeyInput.trim() || !selectedAccountId}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
              >
                Add
              </button>
              <button onClick={() => setShowPanel(false)} className="text-xs text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setShowPanel(true); if (!selectedAccountId && workspaceLinks?.[0]) setSelectedAccountId(workspaceLinks[0].jiraAccountId); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors mt-0.5"
            >
              <Plus className="size-3" />
              Assign Jira issue on send
            </button>
          )}
        </div>
      )}
    </div>
  );
};
