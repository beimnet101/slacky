import Quill from "quill";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useChannelId } from "@/hooks/use-channel-id";
import { toast } from "sonner";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useGetCanvases } from "@/features/canvases/api/use-get-canvases";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { JiraCreateIssueModal } from "@/components/jira-create-issue-modal";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

interface ChatInputProps {
  placeholder: string;
}

type CreateMessageValues = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  body: string;
  image?: Id<"_storage">;
  video?: Id<"_storage">;
  fileId?: Id<"_storage">;
  fileName?: string;
  canvasId?: Id<"canvases">;
}

export const ChatInput = ({ placeholder }: ChatInputProps) => {
  const [isPending, setIsPendng] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [jiraModalBody, setJiraModalBody] = useState("");

  const editorRef = useRef<Quill | null>(null);
  const workspaceId = useWorkspaceId();
  const channelId = useChannelId();

  const { mutate: generateUploadurl } = useGenerateUploadUrl();
  const { mutate: createMessage } = useCreateMessage();
  const { data: canvases } = useGetCanvases({ workspaceId });
  const jiraConnection = useQuery(api.jira.getConnection, { workspaceId });

  const handleJiraAssign = () => {
    const contents = editorRef.current?.getContents();
    const body = contents ? JSON.stringify(contents) : "";
    setJiraModalBody(body);
    setShowJiraModal(true);
  };

  // Called by JiraCreateIssueModal when issue is created — sends the draft message
  const handleSendFromModal = (body: string) => {
    const plain = (() => {
      try {
        const delta = JSON.parse(body);
        return delta?.ops?.map((op: any) => (typeof op.insert === "string" ? op.insert : "")).join("").trim() ?? "";
      } catch { return body.trim(); }
    })();
    if (!plain) return;
    createMessage({ channelId, workspaceId, body });
    setEditorKey((prev) => prev + 1);
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
        channelId,
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
      setEditorKey((prev) => prev + 1);
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
        onJiraAssign={jiraConnection ? handleJiraAssign : undefined}
        workspaceCanvases={canvases?.map((c: { _id: string; title: string }) => ({ _id: c._id, title: c.title })) ?? []}
      />

      {showJiraModal && (
        <JiraCreateIssueModal
          messageBody={jiraModalBody}
          workspaceId={workspaceId}
          channelId={channelId}
          onSendMessage={handleSendFromModal}
          onClose={() => setShowJiraModal(false)}
        />
      )}
    </div>
  );
};
