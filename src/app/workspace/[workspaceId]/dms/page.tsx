"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader, Edit, Search } from "lucide-react";
import { format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetConversations } from "@/features/conversations/api/use-get-conversations";
import { useCurrentMember } from "@/features/members/api/use-current-member";

function extractText(body: string): string {
    try {
        const delta = JSON.parse(body);
        if (delta?.ops && Array.isArray(delta.ops)) {
            return delta.ops
                .map((op: { insert?: unknown }) =>
                    typeof op.insert === "string" ? op.insert : ""
                )
                .join("")
                .replace(/\n+$/, "")
                .trim();
        }
    } catch {
        // not JSON, return as-is
    }
    return body;
}

export default function DmsPage() {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [search, setSearch] = useState("");

    const { data: conversations, isLoading } = useGetConversations({ workspaceId });
    const { data: currentMember } = useCurrentMember({ workspaceId });

    const filtered = (conversations ?? []).filter((conv) => {
        const matchesSearch = conv.otherMember.name
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesUnread = unreadOnly ? conv.lastMessage !== null : true;
        return matchesSearch && matchesUnread;
    });

    return (
        <div className="flex flex-col h-full bg-[#1a1d21] text-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h1 className="text-lg font-semibold text-white">Direct messages</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setUnreadOnly((v) => !v)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                            unreadOnly
                                ? "bg-white text-[#1a1d21] border-white font-semibold"
                                : "text-gray-400 border-white/20 hover:border-white/40"
                        }`}
                    >
                        Unreads
                    </button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white hover:bg-white/10 size-8"
                    >
                        <Edit className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 py-2">
                <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-md px-3 py-1.5">
                    <Search className="size-4 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Find a DM..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent text-sm text-white placeholder:text-gray-500 outline-none w-full"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader className="size-5 text-gray-400 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                        <p className="text-gray-400 text-sm">
                            {search
                                ? "No DMs match your search."
                                : unreadOnly
                                ? "No unread messages."
                                : "No direct messages yet."}
                        </p>
                    </div>
                ) : (
                    <ul className="py-1">
                        {filtered.map((conv) => {
                            const fallback = conv.otherMember.name?.[0]?.toUpperCase() ?? "?";
                            const isMe = currentMember?._id === conv.otherMember._id;
                            const displayName = isMe
                                ? `${conv.otherMember.name} (you)`
                                : conv.otherMember.name;

                            return (
                                <li key={conv.conversationId}>
                                    <button
                                        onClick={() =>
                                            router.push(
                                                `/workspace/${workspaceId}/member/${conv.otherMember._id}`
                                            )
                                        }
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                                    >
                                        <Avatar className="size-9 shrink-0">
                                            <AvatarImage src={conv.otherMember.image} />
                                            <AvatarFallback className="bg-sky-500 text-white text-sm font-semibold">
                                                {fallback}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-sm text-white truncate">
                                                    {displayName}
                                                </span>
                                                {conv.lastMessage && (
                                                    <span className="text-xs text-gray-500 shrink-0">
                                                        {format(
                                                            new Date(conv.lastMessage.createdAt),
                                                            "MMM d"
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            {conv.lastMessage ? (
                                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                                    {extractText(conv.lastMessage.body)}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-600 mt-0.5 italic">
                                                    No messages yet
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
