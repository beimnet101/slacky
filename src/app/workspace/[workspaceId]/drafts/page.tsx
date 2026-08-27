"use client"

import { SendHorizonal } from "lucide-react";

const DraftsPage = () => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <SendHorizonal className="size-5 mr-2 text-gray-700" />
                <h1 className="text-lg font-semibold text-gray-900">Drafts & Sent</h1>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-y-2">
                <SendHorizonal className="size-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm font-medium">No drafts or sent messages yet</p>
                <p className="text-muted-foreground text-xs">
                    Your drafts and sent messages will appear here.
                </p>
            </div>
        </div>
    );
};

export default DraftsPage;
