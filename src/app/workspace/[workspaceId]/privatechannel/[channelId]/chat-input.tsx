/*import Quill from "quill";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useChannelId } from "@/hooks/use-channel-id";
import { toast } from "sonner";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { usePrivateChannelId } from "@/hooks/use-get-private-channel-id";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });


interface ChatInputProps {
  placeholder: string;
}

type CreateMessageValues = {
  channelId: Id<"privateChannels">;
  workspaceId: Id<"workspaces">;
  body: string;
  image?: Id<"_storage"> | undefined;
}


export const ChatInput = ({
  placeholder }: ChatInputProps

) => {

  const [isPending, setIsPendng] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const editorRef = useRef<Quill | null>(null);



  const workspaceId = useWorkspaceId();
  const channelId = usePrivateChannelId();
  
  const { mutate: generateUploadurl } = useGenerateUploadUrl();
  const { mutate: createMessage } = useCreateMessage();


  const handleSubmit = async (
    { body,
      image }: {
        body: string;
        image: File | null;

      }) => {
    try {
      setIsPendng(true);
      editorRef.current?.enable(false);
      const values: CreateMessageValues = {
        channelId,
        workspaceId,
        body,
        image: undefined,

      };

      if (image) {

        const url = await generateUploadurl({}, { throwError: true });
        console.log({ url });
        if (!url) {
          throw new Error("url not found");
        }
        const result = await fetch(url, {

          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });
        console.log({ result });
        if (!result.ok) {
          throw new Error("Failed to upload image");
        }
        const { storageId } = await result.json();
        values.image = storageId;
      };

      await createMessage(values,
        { throwError: true });

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

      />
    </div>

  );


}*/