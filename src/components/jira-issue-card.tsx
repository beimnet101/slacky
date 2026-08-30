"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface JiraIssue {
    key: string;
    summary: string;
    status: string;
    statusCategory: string;
    assignee: { name: string; avatarUrl: string } | null;
    priority: string;
    priorityIconUrl: string;
    issueType: string;
    domain: string;
}

function statusColor(category: string) {
    if (category === "green" || category === "done") return "bg-green-100 text-green-800 border-green-200";
    if (category === "blue-grey" || category === "new") return "bg-slate-100 text-slate-700 border-slate-200";
    if (category === "yellow" || category === "indeterminate") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
}

interface JiraIssueCardProps {
    issueKey: string;
    workspaceId: Id<"workspaces">;
}

export const JiraIssueCard = ({ issueKey, workspaceId }: JiraIssueCardProps) => {
    const getIssue = useAction(api.jira.getIssue);
    const [issue, setIssue] = useState<JiraIssue | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getIssue({ workspaceId, issueKey })
            .then((data) => setIssue(data as JiraIssue))
            .catch((err) => setError(err.message ?? "Failed to load issue"))
            .finally(() => setLoading(false));
    }, [issueKey, workspaceId]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-3 my-1 max-w-[400px] bg-white">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading {issueKey}…</span>
            </div>
        );
    }

    if (error || !issue) {
        return (
            <div className="flex items-center gap-2 border border-red-200 rounded-lg p-3 my-1 max-w-[400px] bg-red-50">
                <span className="text-sm text-red-600">{issueKey}: {error ?? "Not found"}</span>
            </div>
        );
    }

    const issueUrl = `https://${issue.domain}/browse/${issue.key}`;

    return (
        <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 border border-blue-200 rounded-lg p-3 my-1 max-w-[420px] bg-blue-50/40 hover:bg-blue-50 transition-colors group no-underline"
        >
            <div className="flex-shrink-0 mt-0.5">
                {issue.priorityIconUrl ? (
                    <img src={issue.priorityIconUrl} alt={issue.priority} className="size-4" />
                ) : (
                    <div className="size-4 rounded bg-blue-200" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-blue-700">{issue.key}</span>
                    <Badge
                        variant="outline"
                        className={cn("text-xs px-1.5 py-0 h-5", statusColor(issue.statusCategory))}
                    >
                        {issue.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{issue.issueType}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 truncate">{issue.summary}</p>
                {issue.assignee && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <Avatar className="size-4">
                            <AvatarImage src={issue.assignee.avatarUrl} />
                            <AvatarFallback className="text-[8px]">
                                {issue.assignee.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{issue.assignee.name}</span>
                    </div>
                )}
            </div>
            <ExternalLink className="size-3.5 text-blue-400 shrink-0 opacity-0 group-hover:opacity-100 mt-1" />
        </a>
    );
};
