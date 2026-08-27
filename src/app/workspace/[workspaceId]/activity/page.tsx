"use client";

import { useState } from "react";
import { Settings, Filter, Search, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function ActivityPage() {
    const [activeTab, setActiveTab] = useState<Tab>("All");
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, boolean>>({});

    const toggleFilter = (key: string) => {
        setSelectedFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const activeFilterCount = Object.values(selectedFilters).filter(Boolean).length;

    return (
        <div className="flex flex-col h-full bg-[#1a1d21] text-white relative">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h1 className="text-lg font-semibold text-white">Activity</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-white/10 size-8"
                >
                    <Settings className="size-4" />
                </Button>
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

            {/* Empty state */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
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
        </div>
    );
}
