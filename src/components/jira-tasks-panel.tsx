"use client";

import { useEffect, useState, useMemo } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, X, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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

function progressWidth(category: string) {
    if (category === "done" || category === "green") return "w-full bg-green-500";
    if (category === "indeterminate" || category === "yellow") return "w-1/2 bg-yellow-400";
    return "w-[8%] bg-slate-300";
}

interface JiraTasksPanelProps {
    workspaceId: Id<"workspaces">;
    onClose: () => void;
}

export const JiraTasksPanel = ({ workspaceId, onClose }: JiraTasksPanelProps) => {
    const searchIssues = useAction(api.jira.searchIssues);
    const workspaceLinks = useQuery(api.jira.getWorkspaceLinks, { workspaceId });

    const [issues, setIssues] = useState<JiraIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

    const fetchIssues = () => {
        setLoading(true);
        searchIssues({
            workspaceId,
            jql: "assignee is not EMPTY ORDER BY assignee, updated DESC",
            maxResults: 100,
        })
            .then((result) => setIssues(result.issues as JiraIssue[]))
            .catch(() => toast.error("Failed to load tasks"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchIssues(); }, [workspaceId]);

    // Unique assignees from results
    const assignees = useMemo(() => {
        const seen = new Map<string, { name: string; avatarUrl: string }>();
        for (const issue of issues) {
            if (issue.assignee && !seen.has(issue.assignee.name)) {
                seen.set(issue.assignee.name, issue.assignee);
            }
        }
        return Array.from(seen.values());
    }, [issues]);

    const filtered = selectedAssignee
        ? issues.filter((i) => i.assignee?.name === selectedAssignee)
        : issues;

    // Group by assignee
    const grouped = useMemo(() => {
        const map = new Map<string, { assignee: { name: string; avatarUrl: string }; issues: JiraIssue[] }>();
        for (const issue of filtered) {
            if (!issue.assignee) continue;
            const key = issue.assignee.name;
            if (!map.has(key)) map.set(key, { assignee: issue.assignee, issues: [] });
            map.get(key)!.issues.push(issue);
        }
        return Array.from(map.values());
    }, [filtered]);

    return (
        <div className="flex flex-col h-full w-80 border-l border-slate-200 bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="size-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">J</span>
                    <span className="font-semibold text-sm">Tasks</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={fetchIssues}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="size-3.5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            </div>

            {/* Member filter */}
            {assignees.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 flex-wrap flex-shrink-0">
                    <button
                        onClick={() => setSelectedAssignee(null)}
                        className={cn(
                            "text-xs px-2 py-0.5 rounded-full border transition-colors",
                            !selectedAssignee
                                ? "bg-blue-600 text-white border-blue-600"
                                : "text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                    >
                        All
                    </button>
                    {assignees.map((a) => (
                        <button
                            key={a.name}
                            onClick={() => setSelectedAssignee(selectedAssignee === a.name ? null : a.name)}
                            title={a.name}
                            className={cn(
                                "rounded-full border-2 transition-all",
                                selectedAssignee === a.name
                                    ? "border-blue-500 ring-1 ring-blue-400"
                                    : "border-transparent hover:border-slate-300"
                            )}
                        >
                            <Avatar className="size-6">
                                <AvatarImage src={a.avatarUrl} />
                                <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700">
                                    {a.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-sm">Loading tasks…</span>
                    </div>
                ) : grouped.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <span className="text-sm text-muted-foreground">No assigned tasks found</span>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {grouped.map(({ assignee, issues: groupIssues }) => (
                            <div key={assignee.name} className="p-3">
                                {/* Assignee row */}
                                <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="size-6 flex-shrink-0">
                                        <AvatarImage src={assignee.avatarUrl} />
                                        <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700">
                                            {assignee.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-semibold text-slate-700 truncate">{assignee.name}</span>
                                    <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">
                                        {groupIssues.length} task{groupIssues.length !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                {/* Issue list */}
                                <div className="flex flex-col gap-1.5 pl-8">
                                    {groupIssues.map((issue) => (
                                        <a
                                            key={issue.key}
                                            href={`https://${issue.domain}/browse/${issue.key}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block rounded-md border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 p-2 transition-colors no-underline"
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                {issue.priorityIconUrl && (
                                                    <img src={issue.priorityIconUrl} alt={issue.priority} className="size-3 flex-shrink-0" />
                                                )}
                                                <span className="text-[10px] font-mono font-semibold text-blue-700">{issue.key}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] px-1 py-0 h-4 ml-auto flex-shrink-0", statusColor(issue.statusCategory))}
                                                >
                                                    {issue.status}
                                                </Badge>
                                                <ExternalLink className="size-2.5 text-slate-300 group-hover:text-blue-400 flex-shrink-0" />
                                            </div>
                                            <p className="text-xs text-slate-700 truncate mb-1.5">{issue.summary}</p>
                                            {/* Progress bar */}
                                            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div className={cn("h-full rounded-full transition-all", progressWidth(issue.statusCategory))} />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
