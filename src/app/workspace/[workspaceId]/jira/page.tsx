"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, ExternalLink, Loader2, RefreshCw, Search } from "lucide-react";

interface JiraIssueRow {
    key: string;
    id: string;
    summary: string;
    status: string;
    statusCategory: string;
    assignee: { name: string; avatarUrl: string } | null;
    priority: string;
    priorityIconUrl: string;
    issueType: string;
    updated: string;
    domain: string;
}

function statusColor(category: string) {
    if (category === "green" || category === "done") return "bg-green-100 text-green-800 border-green-200";
    if (category === "blue-grey" || category === "new") return "bg-slate-100 text-slate-700 border-slate-200";
    if (category === "yellow" || category === "indeterminate") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
}

function IssueRow({
    issue,
    workspaceId,
}: {
    issue: JiraIssueRow;
    workspaceId: Id<"workspaces">;
}) {
    const [expanded, setExpanded] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [transitions, setTransitions] = useState<{ id: string; name: string }[]>([]);
    const [loadingTransitions, setLoadingTransitions] = useState(false);
    const [selectedTransition, setSelectedTransition] = useState("");
    const [applyingTransition, setApplyingTransition] = useState(false);

    const addComment = useAction(api.jira.addComment);
    const getTransitions = useAction(api.jira.getTransitions);
    const applyTransition = useAction(api.jira.applyTransition);

    const handleExpand = async () => {
        const next = !expanded;
        setExpanded(next);
        if (next && transitions.length === 0) {
            setLoadingTransitions(true);
            try {
                const t = await getTransitions({ workspaceId, issueKey: issue.key });
                setTransitions(t);
            } catch {
                // ignore
            } finally {
                setLoadingTransitions(false);
            }
        }
    };

    const handleComment = async () => {
        if (!commentText.trim()) return;
        setSubmittingComment(true);
        try {
            await addComment({ workspaceId, issueKey: issue.key, text: commentText });
            setCommentText("");
            toast.success("Comment added");
        } catch (err: any) {
            toast.error(err.message ?? "Failed to add comment");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleApplyTransition = async () => {
        if (!selectedTransition) return;
        setApplyingTransition(true);
        try {
            await applyTransition({ workspaceId, issueKey: issue.key, transitionId: selectedTransition });
            toast.success("Status updated");
            setSelectedTransition("");
        } catch (err: any) {
            toast.error(err.message ?? "Failed to update status");
        } finally {
            setApplyingTransition(false);
        }
    };

    const issueUrl = `https://${issue.domain}/browse/${issue.key}`;

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-2">
            <button
                onClick={handleExpand}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
            >
                {expanded ? (
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                ) : (
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                )}
                {issue.priorityIconUrl && (
                    <img src={issue.priorityIconUrl} alt={issue.priority} className="size-4 shrink-0" />
                )}
                <span className="text-xs font-mono font-semibold text-blue-700 shrink-0">{issue.key}</span>
                <span className="text-sm flex-1 truncate">{issue.summary}</span>
                <Badge
                    variant="outline"
                    className={cn("text-xs px-1.5 py-0 h-5 shrink-0", statusColor(issue.statusCategory))}
                >
                    {issue.status}
                </Badge>
                {issue.assignee && (
                    <Avatar className="size-6 shrink-0">
                        <AvatarImage src={issue.assignee.avatarUrl} />
                        <AvatarFallback className="text-[9px]">{issue.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
                {issue.updated && (
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                        {format(new Date(issue.updated), "MMM d")}
                    </span>
                )}
                <a
                    href={issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-muted-foreground hover:text-blue-600"
                >
                    <ExternalLink className="size-3.5" />
                </a>
            </button>

            {expanded && (
                <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-muted-foreground text-xs">Issue Type</span>
                            <p className="font-medium">{issue.issueType}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-xs">Priority</span>
                            <p className="font-medium">{issue.priority}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-xs">Assignee</span>
                            <p className="font-medium">{issue.assignee?.name ?? "Unassigned"}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-xs">Updated</span>
                            <p className="font-medium">
                                {issue.updated ? format(new Date(issue.updated), "MMM d, yyyy") : "—"}
                            </p>
                        </div>
                    </div>

                    {/* Change Status */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Change Status</p>
                        {loadingTransitions ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Select value={selectedTransition} onValueChange={setSelectedTransition}>
                                    <SelectTrigger className="flex-1 h-8 text-sm">
                                        <SelectValue placeholder="Select transition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {transitions.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    onClick={handleApplyTransition}
                                    disabled={!selectedTransition || applyingTransition}
                                >
                                    {applyingTransition && <Loader2 className="size-3.5 mr-1 animate-spin" />}
                                    Apply
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Comment */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Add Comment</p>
                        <Textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment…"
                            rows={2}
                            className="text-sm"
                        />
                        <Button
                            size="sm"
                            className="mt-2"
                            onClick={handleComment}
                            disabled={!commentText.trim() || submittingComment}
                        >
                            {submittingComment && <Loader2 className="size-3.5 mr-1 animate-spin" />}
                            Comment
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function JiraPage() {
    const workspaceId = useWorkspaceId();
    const searchIssues = useAction(api.jira.searchIssues);

    const [myIssues, setMyIssues] = useState<JiraIssueRow[]>([]);
    const [searchResults, setSearchResults] = useState<JiraIssueRow[]>([]);
    const [jql, setJql] = useState("ORDER BY updated DESC");
    const [loadingMy, setLoadingMy] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [myLoaded, setMyLoaded] = useState(false);

    const loadMyIssues = async () => {
        setLoadingMy(true);
        try {
            const result = await searchIssues({
                workspaceId,
                jql: "assignee = currentUser() ORDER BY updated DESC",
            });
            setMyIssues(result.issues as JiraIssueRow[]);
            setMyLoaded(true);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to load issues");
        } finally {
            setLoadingMy(false);
        }
    };

    const handleSearch = async () => {
        setLoadingSearch(true);
        try {
            const result = await searchIssues({ workspaceId, jql });
            setSearchResults(result.issues as JiraIssueRow[]);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to search issues");
        } finally {
            setLoadingSearch(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="border-b px-6 py-4">
                <h1 className="text-xl font-semibold flex items-center gap-2">
                    <span className="text-blue-600 font-bold text-2xl">J</span>
                    Jira
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <Tabs defaultValue="my-issues">
                    <TabsList>
                        <TabsTrigger value="my-issues">My Issues</TabsTrigger>
                        <TabsTrigger value="search">Search</TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-issues" className="mt-4">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">
                                Issues assigned to you
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={loadMyIssues}
                                disabled={loadingMy}
                            >
                                {loadingMy ? (
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="size-4 mr-2" />
                                )}
                                {myLoaded ? "Refresh" : "Load Issues"}
                            </Button>
                        </div>

                        {myIssues.length === 0 && myLoaded && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No issues assigned to you.
                            </p>
                        )}

                        {myIssues.map((issue) => (
                            <IssueRow key={issue.id} issue={issue} workspaceId={workspaceId} />
                        ))}
                    </TabsContent>

                    <TabsContent value="search" className="mt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Input
                                value={jql}
                                onChange={(e) => setJql(e.target.value)}
                                placeholder='JQL query, e.g. project = "MY" ORDER BY created DESC'
                                className="flex-1 font-mono text-sm"
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={loadingSearch}>
                                {loadingSearch ? (
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                ) : (
                                    <Search className="size-4 mr-2" />
                                )}
                                Search
                            </Button>
                        </div>

                        {searchResults.length === 0 && !loadingSearch && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Enter a JQL query and press Search.
                            </p>
                        )}

                        {searchResults.map((issue) => (
                            <IssueRow key={issue.id} issue={issue} workspaceId={workspaceId} />
                        ))}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
