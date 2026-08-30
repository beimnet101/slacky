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

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });


interface ChatInputProps {
  placeholder: string;
}

type CreateMessageValues = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  body: string;
  image?: Id<"_storage"> | undefined;
  video?: Id<"_storage"> | undefined;
  fileId?: Id<"_storage"> | undefined;
  fileName?: string | undefined;
  canvasId?: Id<"canvases"> | undefined;
}


export const ChatInput = ({
  placeholder }: ChatInputProps

) => {

  const [isPending, setIsPendng] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const editorRef = useRef<Quill | null>(null);

  const workspaceId = useWorkspaceId();
  const channelId = useChannelId();

  const { mutate: generateUploadurl } = useGenerateUploadUrl();
  const { mutate: createMessage } = useCreateMessage();
  const { data: canvases } = useGetCanvases({ workspaceId });


  const handleSubmit = async (
    { body, image, video, file, canvasId }: {
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
        image: undefined,
        video: undefined,
        fileId: undefined,
        fileName: undefined,
        canvasId: canvasId ?? undefined,
      };

      if (image) {
        const url = await generateUploadurl({}, { throwError: true });
        if (!url) throw new Error("url not found");
        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });
        if (!result.ok) throw new Error("Failed to upload image");
        const { storageId } = await result.json();
        values.image = storageId;
      }

      if (video) {
        const url = await generateUploadurl({}, { throwError: true });
        if (!url) throw new Error("url not found");
        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": video.type },
          body: video,
        });
        if (!result.ok) throw new Error("Failed to upload video");
        const { storageId } = await result.json();
        values.video = storageId;
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

      setEditorKey((prevKey) => prevKey + 1);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsPendng(false);
      editorRef.current?.enable(true);
    }
  };

  return (
    <div className="px-5 w-full ">
      <Editor
        key={editorKey}
        placeholder={placeholder}
        variant="create"
        onSubmit={handleSubmit}
        disabled={isPending}
        innerRef={editorRef}
        workspaceCanvases={canvases?.map((c: { _id: string; title: string }) => ({ _id: c._id, title: c.title })) ?? []}
      />
    </div>

  );


}
