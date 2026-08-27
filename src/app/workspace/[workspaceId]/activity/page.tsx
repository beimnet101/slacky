"use client";

import { useState } from "react";
import { Settings, Filter, Search, ChevronDown, X, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useGetMentions } from "@/features/mentions/api/use-get-mentions";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

type Tab = "All" | "DMs" | "Mentions" | "Threads";

const TABS: Tab[] = ["All", "DMs", "Mentions", "Threads"];

const FILTER_OPTIONS = [
    { label: "DMs", key: "dms" },
    { label: "Mentions", key: "mentions" },
    { label: "Threads", key: "threads" },
    { label: "Channels", key: "channels" },
    { label: "Reactions", key: "reactions" },
    { label: "Invitations", key: "invitations" },
    { label: "Apps", key: "apps" },
    { label: "Reminders", key: "reminders" },
];

const ADDITIONAL_FILTER_OPTIONS = [
    { label: "VIP", key: "vip" },
    { label: "Cleared items", key: "cleared" },
    { label: "Specific channel", key: "specific_channel" },
];

const extractPlainText = (body: string) => {
    try {
        const delta = JSON.parse(body);
        if (delta?.ops) {
            return delta.ops
                .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
                .join("");
        }
    } catch {}
    return body;
};

const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
        return "Yesterday";
    } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function ActivityPage() {
    const [activeTab, setActiveTab] = useState<Tab>("All");
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, boolean>>({});

    const workspaceId = useWorkspaceId();
    const { data: mentions, isLoading } = useGetMentions({ workspaceId });
    const markAllRead = useMutation(api.mentions.markAllRead);
    const markRead = useMutation(api.mentions.markRead);

    const toggleFilter = (key: string) => {
        setSelectedFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const activeFilterCount = Object.values(selectedFilters).filter(Boolean).length;

    const unreadMentions = mentions.filter((m) => !m.isRead);
    const displayedMentions = unreadOnly ? unreadMentions : mentions;

    const showMentions = activeTab === "Mentions" || activeTab === "All";

    const handleMarkAllRead = async () => {
        await markAllRead({ workspaceId });
    };

    const handleMarkRead = async (mentionId: string) => {
        await markRead({ mentionId: mentionId as any });
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1d21] text-white relative">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h1 className="text-lg font-semibold text-white">Activity</h1>
                <div className="flex items-center gap-2">
                    {unreadMentions.length > 0 && showMentions && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-400 hover:text-white hover:bg-white/10 h-7 px-2"
                            onClick={handleMarkAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white hover:bg-white/10 size-8"
                    >
                        <Settings className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-white/10 px-4">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
                            activeTab === tab
                                ? "text-white"
                                : "text-gray-400 hover:text-gray-200"
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-sm" />
                        )}
                    </button>
                ))}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
                {/* Unreads pill */}
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

                {/* Filter dropdown button */}
                <div className="relative">
                    <button
                        onClick={() => setFilterOpen((v) => !v)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-colors ${
                            activeFilterCount > 0
                                ? "bg-white/10 text-white border-white/30"
                                : "text-gray-400 border-white/20 hover:border-white/40"
                        }`}
                    >
                        <Filter className="size-3" />
                        <span>
                            {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filter"}
                        </span>
                        <ChevronDown className="size-3" />
                    </button>

                    {/* Dropdown */}
                    {filterOpen && (
                        <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-[#222529] border border-white/10 rounded-lg shadow-xl py-2">
                            <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                                    Filters
                                </span>
                                <button
                                    onClick={() => setFilterOpen(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>
                            {FILTER_OPTIONS.map((opt) => (
                                <label
                                    key={opt.key}
                                    className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/5 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!selectedFilters[opt.key]}
                                        onChange={() => toggleFilter(opt.key)}
                                        className="accent-white size-3.5"
                                    />
                                    <span className="text-sm text-gray-200">{opt.label}</span>
                                </label>
                            ))}
                            <div className="my-1.5 border-t border-white/10" />
                            <div className="px-3 py-1 mb-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                    Additional Filters
                                </span>
                            </div>
                            {ADDITIONAL_FILTER_OPTIONS.map((opt) => (
                                <label
                                    key={opt.key}
                                    className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/5 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!selectedFilters[opt.key]}
                                        onChange={() => toggleFilter(opt.key)}
                                        className="accent-white size-3.5"
                                    />
                                    <span className="text-sm text-gray-200">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="ml-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white hover:bg-white/10 size-7"
                    >
                        <Search className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {showMentions && (
                    <>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                                Loading...
                            </div>
                        ) : displayedMentions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-16">
                                <span className="text-5xl select-none">🎉</span>
                                <h2 className="text-xl font-semibold text-white">Ta-da!</h2>
                                <p className="text-sm text-gray-400">You&apos;re up to date.</p>
                                <button
                                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors mt-1"
                                    onClick={() => {
                                        setUnreadOnly(false);
                                        setSelectedFilters({});
                                    }}
                                >
                                    Show all activity
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {displayedMentions.map((mention) => {
                                    const plainText = mention.message
                                        ? extractPlainText(mention.message.body)
                                        : "";
                                    const avatarFallback = mention.mentioner.name?.charAt(0).toUpperCase() ?? "?";
                                    const timestamp = mention.message?._creationTime ?? mention._creationTime;
                                    const location = mention.channelId
                                        ? "a channel"
                                        : "a DM";

                                    return (
                                        <div
                                            key={mention._id}
                                            className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors ${
                                                !mention.isRead ? "border-l-2 border-blue-500" : "border-l-2 border-transparent"
                                            }`}
                                            onClick={() => !mention.isRead && handleMarkRead(mention._id)}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <Avatar className="size-9">
                                                    <AvatarImage src={mention.mentioner.image} />
                                                    <AvatarFallback className="bg-purple-600 text-white text-sm">
                                                        {avatarFallback}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {!mention.isRead && (
                                                    <span className="absolute -top-1 -right-1 size-2.5 bg-blue-500 rounded-full border-2 border-[#1a1d21]" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="text-sm font-semibold text-white truncate">
                                                            {mention.mentioner.name ?? "Unknown"}
                                                        </span>
                                                        <AtSign className="size-3 text-blue-400 flex-shrink-0" />
                                                        <span className="text-xs text-gray-400 truncate">
                                                            mentioned you in {location}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                                        {formatTime(timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-300 truncate">
                                                    {plainText}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {(activeTab === "DMs" || activeTab === "Threads") && (
                    <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-16">
                        <span className="text-5xl select-none">🎉</span>
                        <h2 className="text-xl font-semibold text-white">Ta-da!</h2>
                        <p className="text-sm text-gray-400">You&apos;re up to date.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
