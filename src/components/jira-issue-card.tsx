"use client";

import { useEffect, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

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
    const assignIssue = useAction(api.jira.assignIssue);
    const workspaceLinks = useQuery(api.jira.getWorkspaceLinks, { workspaceId });

    const [issue, setIssue] = useState<JiraIssue | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assigning, setAssigning] = useState(false);
    const [assignPopoverOpen, setAssignPopoverOpen] = useState(false);

    const fetchIssue = () => {
        setLoading(true);
        setError(null);
        getIssue({ workspaceId, issueKey })
            .then((data) => setIssue(data as JiraIssue))
            .catch((err) => setError(err.message ?? "Failed to load issue"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchIssue();
    }, [issueKey, workspaceId]);

    const handleAssign = async (link: { jiraAccountId: string; jiraDisplayName: string }) => {
        setAssigning(true);
        setAssignPopoverOpen(false);
        try {
            await assignIssue({ workspaceId, issueKey, jiraAccountId: link.jiraAccountId });
            toast.success(`Assigned to ${link.jiraDisplayName}`);
            fetchIssue();
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to assign issue");
        } finally {
            setAssigning(false);
        }
    };

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
    const linkedMembers = workspaceLinks ?? [];

    return (
        <div className="flex items-start gap-3 border border-blue-200 rounded-lg p-3 my-1 max-w-[420px] bg-blue-50/40 group relative">
            <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 flex-1 min-w-0 no-underline"
                onClick={(e) => e.stopPropagation()}
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
                    {/* Progress bar */}
                    <div className="mt-1.5 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                issue.statusCategory === "done" || issue.statusCategory === "green"
                                    ? "bg-green-500 w-full"
                                    : issue.statusCategory === "indeterminate" || issue.statusCategory === "yellow"
                                        ? "bg-yellow-400 w-1/2"
                                        : "bg-slate-300 w-[8%]"
                            )}
                        />
                    </div>
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
            </a>

            <div className="flex items-center gap-1 flex-shrink-0">
                {linkedMembers.length > 0 && (
                    <Popover open={assignPopoverOpen} onOpenChange={setAssignPopoverOpen}>
                        <PopoverTrigger asChild>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                disabled={assigning}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-100 text-blue-500 transition-all disabled:opacity-50"
                                title="Assign issue"
                            >
                                {assigning ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <UserPlus className="size-3.5" />
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-1" align="end">
                            <p className="text-xs font-semibold text-muted-foreground px-2 py-1">Assign to</p>
                            <div className="max-h-48 overflow-y-auto">
                                {linkedMembers.map((link) => (
                                    <button
                                        key={link.jiraAccountId}
                                        onClick={() => handleAssign(link)}
                                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-blue-50 text-left transition-colors"
                                    >
                                        <Avatar className="size-6 flex-shrink-0">
                                            <AvatarImage src={link.jiraAvatarUrl} />
                                            <AvatarFallback className="text-[10px] bg-blue-200 text-blue-800">
                                                {link.jiraDisplayName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm truncate">{link.jiraDisplayName}</span>
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
                <a
                    href={issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 p-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink className="size-3.5 text-blue-400" />
                </a>
            </div>
        </div>
    );
};
