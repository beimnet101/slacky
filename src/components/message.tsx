
import { Doc, Id } from "../../convex/_generated/dataModel"
import dynamic from "next/dynamic";

const Renderer = dynamic(() => import("@/components/renderer"), { ssr: false })
const Editor = dynamic(() => import("@/components/editor"), { ssr: false })
const CanvasEditorModal = dynamic(() => import("@/components/canvas-editor-modal").then(m => m.CanvasEditorModal), { ssr: false })

import { format, isToday, isYesterday } from "date-fns";
import { Hint } from "./ui/hint";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Thumbnail, VideoPlayer } from "./thumbnail";
import { FileAttachment } from "./file-attachment";
import { FileText, Pencil } from "lucide-react";
import { Toolbar } from "./toolbar";
import { useUpdateMessage } from "@/features/messages/api/use-update-message";
import { useRemoveMessage } from "@/features/messages/api/use-remove-message";
import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/hooks/use-confirm";
import React, { useState } from "react";
import { useToggleReaction } from "@/features/reactions/api/use-toggle-reactions";
import { Reactions } from "./reactions";
import { usePanel } from "@/hooks/use-panel";
import { ThreadBar } from "./thread-bar";

interface MessageProps {
    id: Id<"messages">;
    memberId: Id<"members">;
    authorImage?: string;
    authorName?: string;
    isAuthor: boolean;
    reactions: Array<
        Omit<Doc<"reactions">, "memberId"> & {
            count: number;
            memberIds: Id<"members">[];
        }>;
    body: Doc<"messages">["body"];
    image: string | null | undefined;
    video?: string | null | undefined;
    file?: string | null | undefined;
    fileName?: string | null | undefined;
    canvas?: { _id: string; title: string; content: string } | null;
    createdAt: Doc<"messages">["_creationTime"]
    updatedAt: Doc<"messages">["updatedAt"];
    isEditing: boolean;
    isCompact: boolean;
    setEditingId: (id: Id<"messages"> | null) => void;
    hideThreadButton?: boolean;
    threadCount?: number;
    threadImage?: string;
    threadName?: string;
    threadTimestamp?: number;
    callEvent?: { status: "missed" | "ended" | "declined"; duration?: number } | null;
    channelId?: Id<"channels">;
    conversationId?: Id<"conversations">;
};



const formatFullTime = (date: Date) => {
    return `${isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MM d, yyyy")} at ${format(date, "hh:mm:ss a")}`;
}


export const Message = (
    {
        id,
        isAuthor,
        memberId,
        authorImage,
        authorName = "Member",
        reactions,

        body,
        image,
        video,
        file,
        fileName,
        canvas,
        createdAt,
        updatedAt,
        isEditing,
        isCompact,
        setEditingId,
        hideThreadButton,
        threadCount,
        threadImage,
        threadName,
        threadTimestamp,
        callEvent,
        channelId,
        conversationId,

    }: MessageProps

) => {
    const { parentMessageId, onOpenMessage, onOpenProfile, onClose } = usePanel();
    const workspaceId = useWorkspaceId();
    const { mutate: createMessage } = useCreateMessage();


    const { mutate: updateMessage, isPending: isUpdatingMessage } = useUpdateMessage();
    const { mutate: removeMessage, isPending: isRemovingMessage } = useRemoveMessage();
    const { mutate: toggleReaction, isPending: isTogglingReaction } = useToggleReaction();
    const isPending = isUpdatingMessage || isTogglingReaction;

    const [editingCanvas, setEditingCanvas] = useState<{ _id: string; title: string; content: string; isStarred?: boolean } | null>(null);

    const handleSendCanvas = async (canvasId: Id<"canvases">) => {
        if (!channelId && !conversationId) return;
        try {
            await createMessage({
                body: JSON.stringify({ ops: [{ insert: "\n" }] }),
                workspaceId,
                channelId,
                conversationId,
                canvasId,
            }, { throwError: true });
        } catch {
            toast.error("Failed to send canvas");
        }
    };

    const [ConfirmDialog, confirm] = useConfirm("Delete Message",
        "Are you sure you want to delete this message? This can not be undone"
    );

    const handleReactions = (value: string) => {
        toggleReaction({ messageId: id, value },
            {
                onError: () => {
                    toast.error("failed to toggle reaction");
                }

            }


        )


    }

    const handleRemove = async () => {
        const ok = await confirm();
        if (!ok) return;
        removeMessage({ id }), {
            onSucces: () => {
                toast.success("Message deleted");
                if (parentMessageId === id) {

                    onClose();
                }
            },
            onError: () => {
                toast.error("Failed to delete message")

            }
            //to do close thread if opened
        }

    }


    const handleUpdate = ({ body }: { body: string }) => {
        updateMessage({ id, body },
            {
                onSuccess: () => {
                    toast.success("Message updated");
                    setEditingId(null);
                }, onError: () => {
                    toast.error("Failed updating message ");


                }

            }


        )

    };

    if (callEvent) {
        const isMissed = callEvent.status === "missed" || callEvent.status === "declined";
        const formatDuration = (secs: number) => {
            const m = Math.floor(secs / 60).toString().padStart(2, "0");
            const s = (secs % 60).toString().padStart(2, "0");
            return `${m}:${s}`;
        };
        return (
            <div className="flex items-center gap-2 px-5 py-2 text-sm text-muted-foreground">
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isMissed ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4 flex-shrink-0">
                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">
                        {isMissed ? "Missed call" : `Call ended · ${formatDuration(callEvent.duration ?? 0)}`}
                    </span>
                    <span className="text-xs opacity-70">
                        {format(new Date(createdAt), "hh:mm a")}
                    </span>
                </div>
            </div>
        );
    }

    if (isCompact) {
        return (
            <>
                <ConfirmDialog />
                <div className={cn("flex flex-col gap-2 p-1.5 px-5 hover:bg-green-100/60 group  relative",
                    isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
                    isRemovingMessage && "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200"
                )} >
                    <div className="flex items-start gap-2">
                        <Hint label={formatFullTime(new Date(createdAt))}>
                            <button className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 w-[40px] leading-[22px] text-center hover:underline">
                                {format(new Date(createdAt), "hh:mm")}
                            </button>
                        </Hint>
                        {isEditing ? (
                            <div className="w-full h-full">
                                <Editor
                                    onSubmit={handleUpdate}
                                    disabled={isUpdatingMessage}
                                    defaultValue={JSON.parse(body)}
                                    onCancel={() => setEditingId(null)}
                                    variant="update"
                                />
                            </div>) : (


                            <div className="flex flex-col w-full">

                                <Renderer value={body} />
                                <Thumbnail url={image} />
                                <VideoPlayer url={video} />
                                {file && fileName && (
                                    <FileAttachment url={file} fileName={fileName} />
                                )}
                                {canvas && (
                                    <button
                                        onClick={() => setEditingCanvas(canvas)}
                                        className="flex items-start gap-2 border border-slate-200 rounded-lg p-3 my-2 max-w-[360px] bg-white hover:bg-slate-50 transition-colors text-left w-full group/canvas"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 bg-teal-600/20 rounded flex items-center justify-center mt-0.5">
                                            <FileText className="size-4 text-teal-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{canvas.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{canvas.content.slice(0, 100)}</p>
                                            <span className="text-xs text-teal-600 font-medium mt-1 block">Canvas</span>
                                        </div>
                                        <Pencil className="size-3.5 text-slate-400 opacity-0 group-hover/canvas:opacity-100 flex-shrink-0 mt-1" />
                                    </button>
                                )}
                                {updatedAt ? (
                                    <span className="text-xs text-muted-foreground">
                                        (edited)
                                    </span>) : null}
                                <Reactions data={reactions} onChange={handleReactions} />

                                <ThreadBar
                                    count={threadCount}
                                    image={threadImage}
                                    timestamp={threadTimestamp}
                                    name={threadName}
                                    onClick={() => onOpenMessage(id)}
                                />

                            </div>
                        )}
                    </div>

                    {!isEditing && (
                        <Toolbar
                            isAuthor={isAuthor}
                            isPending={false}
                            handleEdit={() => setEditingId(id)}
                            handleThread={() => onOpenMessage(id)}
                            handleDelete={handleRemove}
                            handleReaction={handleReactions}
                            hideThreadButton={hideThreadButton}




                        />)}
                </div>

                {editingCanvas && (
                    <CanvasEditorModal
                        canvasId={editingCanvas._id as Id<"canvases">}
                        initialTitle={editingCanvas.title}
                        initialContent={editingCanvas.content}
                        initialIsStarred={(editingCanvas as any).isStarred}
                        onClose={() => setEditingCanvas(null)}
                        onSend={(channelId || conversationId) ? () => handleSendCanvas(editingCanvas._id as Id<"canvases">) : undefined}
                    />
                )}
            </>

        );
    }
    const avatarFallback = authorName.charAt(0).toUpperCase();
    return (
        <>
            <ConfirmDialog />
            <div className={cn("flex flex-col gap-2 p-1.5 px-5 hover:bg-green-100/60 group  relative",
                isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
                isRemovingMessage &&
                "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200")}>
                <div className="flex items-start gap-2">
                    <button onClick={() => onOpenProfile(memberId)}>
                        <Avatar >
                            <AvatarImage src={authorImage} />
                            <AvatarFallback className=" bg-sky-500 text-white text-sm">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>


                    </button>
                    {isEditing ?
                        (<div className="w-full h-full ">
                            <Editor
                                onSubmit={handleUpdate}
                                disabled={isUpdatingMessage}
                                defaultValue={JSON.parse(body)}
                                onCancel={() => setEditingId(null)}
                                variant="update"
                            />
                        </div>
                        ) : (
                            <div className="flex flex-col w-full overflow-hidden">
                                <div className="text-sm">
                                    <button onClick={() => onOpenProfile(memberId)} className="text-bold text-primary hover:underline">
                                        {authorName}
                                    </button>
                                    <span>&nbsp;&nbsp;</span>
                                    <Hint label={formatFullTime(new Date(createdAt))}>
                                        <button className="text-xs text-muted-foreground hove:underline">
                                            {format(new Date(createdAt), "h:mm a")}
                                        </button>
                                    </Hint>
                                </div>
                                <Renderer value={body} />
                                <Thumbnail url={image} />
                                <VideoPlayer url={video} />
                                {file && fileName && (
                                    <FileAttachment url={file} fileName={fileName} />
                                )}
                                {canvas && (
                                    <button
                                        onClick={() => setEditingCanvas(canvas)}
                                        className="flex items-start gap-2 border border-slate-200 rounded-lg p-3 my-2 max-w-[360px] bg-white hover:bg-slate-50 transition-colors text-left w-full group/canvas"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 bg-teal-600/20 rounded flex items-center justify-center mt-0.5">
                                            <FileText className="size-4 text-teal-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{canvas.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{canvas.content.slice(0, 100)}</p>
                                            <span className="text-xs text-teal-600 font-medium mt-1 block">Canvas</span>
                                        </div>
                                        <Pencil className="size-3.5 text-slate-400 opacity-0 group-hover/canvas:opacity-100 flex-shrink-0 mt-1" />
                                    </button>
                                )}
                                {updatedAt ? (
                                    <span className="text-xs text-muted-foreground">(edited)</span>
                                ) : null}
                                <Reactions data={reactions} onChange={handleReactions} />
                                <ThreadBar
                                    count={threadCount}
                                    image={threadImage}
                                    timestamp={threadTimestamp}
                                    name={threadName}
                                    onClick={() => onOpenMessage(id)}
                                />
                            </div>
                        )}
                </div>
                {!isEditing && (
                    <Toolbar
                        isAuthor={isAuthor}
                        isPending={false}
                        handleEdit={() => setEditingId(id)}
                        handleThread={() => onOpenMessage(id)}
                        handleDelete={handleRemove}
                        handleReaction={handleReactions}
                        hideThreadButton={hideThreadButton}




                    />)}

            </div>

            {editingCanvasId && (
                <CanvasEditorModal
                    canvasId={editingCanvasId}
                    onClose={() => setEditingCanvasId(null)}
                />
            )}
        </>

    )

};