
import { Doc, Id } from "../../convex/_generated/dataModel"
import dynamic from "next/dynamic";

const Renderer = dynamic(() => import("@/components/renderer"), { ssr: false })
const Editor = dynamic(() => import("@/components/editor"), { ssr: false })

import { format, isToday, isYesterday } from "date-fns";
import { Hint } from "./ui/hint";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Thumbnail } from "./thumbnail";
import { Toolbar } from "./toolbar";
import { useUpdateMessage } from "@/features/messages/api/use-update-message";
import { useRemoveMessage } from "@/features/messages/api/use-remove-message";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/hooks/use-confirm";
import React from "react";
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
    createdAt: Doc<"messages">["_creationTime"]
    updatedAt: Doc<"messages">["updatedAt"];
    isEditing: boolean;
    isCompact: boolean;
    setEditingId: (id: Id<"messages"> | null) => void;
    hideThreadButton?: boolean;
    threadCount?: number;
    threadImage?: string;
    threadTimestamp?: number;

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
        createdAt,
        updatedAt,
        isEditing,
        isCompact,
        setEditingId,
        hideThreadButton,
        threadCount,
        threadImage,
        threadTimestamp,

    }: MessageProps

) => {

    const { mutate: updateMessage, isPending: isUpdatingMessage } = useUpdateMessage();
    const { mutate: removeMessage, isPending: isRemovingMessage } = useRemoveMessage();
    const isPending = isUpdatingMessage;

    const [ConfirmDialog, confirm] = useConfirm("Delete Message",
        "Are you sure you want to delete this message? This can not be undone"
    );

    const handleRemove = async () => {
        const ok = await confirm();
        if (!ok) return;
        removeMessage({ id }), {
            onSucces: () => {
                toast.success("Message deleted")
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
                                {updatedAt ? (
                                    <span className="text-xs text-muted-foreground">
                                        (edited)
                                    </span>) : null}
                            </div>
                        )}
                    </div>

                    {!isEditing && (
                        <Toolbar
                            isAuthor={isAuthor}
                            isPending={false}
                            handleEdit={() => setEditingId(id)}
                            handleThread={() => { }}
                            handleDelete={handleRemove}
                            handleReaction={() => { }}
                            hideThreadButton={hideThreadButton}




                        />)}
                </div>
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
                    <button>
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
                                    <button onClick={() => { }} className="text-bold text-primary hover:underline">
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
                                {updatedAt ? (
                                    <span className="text-xs text-muted-foreground">(edited)</span>
                                ) : null}
                            </div>
                        )}
                </div>
                {!isEditing && (
                    <Toolbar
                        isAuthor={isAuthor}
                        isPending={false}
                        handleEdit={() => setEditingId(id)}
                        handleThread={() => { }}
                        handleDelete={handleRemove}
                        handleReaction={() => { }}
                        hideThreadButton={hideThreadButton}




                    />)}

            </div>
        </>

    )

};