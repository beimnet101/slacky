"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
    ChevronDown, ChevronRight, ExternalLink, Loader2,
    RefreshCw, Search, Users, LayoutGrid, FolderKanban,
    Milestone, BarChart3, CheckCircle2, Clock, CircleDot,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

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
    issueTypeIconUrl: string;
    updated: string;
    projectKey: string;
    projectName: string;
    domain: string;
}

interface JiraProject {
    id: string;
    key: string;
    name: string;
}

interface JiraVersion {
    id: string;
    name: string;
    released: boolean;
    releaseDate?: string;
    description?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(category: string) {
    if (category === "green" || category === "done") return "bg-green-100 text-green-800 border-green-200";
    if (category === "blue-grey" || category === "new") return "bg-slate-100 text-slate-700 border-slate-200";
    if (category === "yellow" || category === "indeterminate") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
}

function progressBar(done: number, total: number) {
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { pct, label: `${pct}%` };
}

// ─── IssueRow (expandable) ────────────────────────────────────────────────────

function IssueRow({ issue, workspaceId }: { issue: JiraIssueRow; workspaceId: Id<"workspaces"> }) {
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
            try { setTransitions(await getTransitions({ workspaceId, issueKey: issue.key })); }
            catch { }
            finally { setLoadingTransitions(false); }
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
        } finally { setSubmittingComment(false); }
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
        } finally { setApplyingTransition(false); }
    };

    const issueUrl = `https://${issue.domain}/browse/${issue.key}`;

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-2 bg-white">
            <button onClick={handleExpand} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left">
                {expanded ? <ChevronDown className="size-4 text-muted-foreground shrink-0" /> : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                {issue.priorityIconUrl && <img src={issue.priorityIconUrl} alt={issue.priority} className="size-4 shrink-0" />}
                <span className="text-xs font-mono font-semibold text-blue-700 shrink-0">{issue.key}</span>
                <span className="text-sm flex-1 truncate">{issue.summary}</span>
                <Badge variant="outline" className={cn("text-xs px-1.5 py-0 h-5 shrink-0", statusColor(issue.statusCategory))}>{issue.status}</Badge>
                {issue.assignee && (
                    <Avatar className="size-6 shrink-0">
                        <AvatarImage src={issue.assignee.avatarUrl} />
                        <AvatarFallback className="text-[9px]">{issue.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
                {issue.updated && <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{format(new Date(issue.updated), "MMM d")}</span>}
                <a href={issueUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-muted-foreground hover:text-blue-600">
                    <ExternalLink className="size-3.5" />
                </a>
            </button>

            {expanded && (
                <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground text-xs">Issue Type</span><p className="font-medium">{issue.issueType}</p></div>
                        <div><span className="text-muted-foreground text-xs">Priority</span><p className="font-medium">{issue.priority}</p></div>
                        <div><span className="text-muted-foreground text-xs">Assignee</span><p className="font-medium">{issue.assignee?.name ?? "Unassigned"}</p></div>
                        <div><span className="text-muted-foreground text-xs">Updated</span><p className="font-medium">{issue.updated ? format(new Date(issue.updated), "MMM d, yyyy") : "—"}</p></div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Change Status</p>
                        {loadingTransitions ? <Loader2 className="size-4 animate-spin" /> : (
                            <div className="flex items-center gap-2">
                                <Select value={selectedTransition} onValueChange={setSelectedTransition}>
                                    <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue placeholder="Select transition" /></SelectTrigger>
                                    <SelectContent>{transitions.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button size="sm" onClick={handleApplyTransition} disabled={!selectedTransition || applyingTransition}>
                                    {applyingTransition && <Loader2 className="size-3.5 mr-1 animate-spin" />}Apply
                                </Button>
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Add Comment</p>
                        <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment…" rows={2} className="text-sm" />
                        <Button size="sm" className="mt-2" onClick={handleComment} disabled={!commentText.trim() || submittingComment}>
                            {submittingComment && <Loader2 className="size-3.5 mr-1 animate-spin" />}Comment
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────

function KanbanCard({ issue }: { issue: JiraIssueRow }) {
    const issueUrl = `https://${issue.domain}/browse/${issue.key}`;
    return (
        <a href={issueUrl} target="_blank" rel="noopener noreferrer"
            className="block bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all no-underline group">
            <div className="flex items-center gap-1.5 mb-1.5">
                {issue.priorityIconUrl && <img src={issue.priorityIconUrl} alt={issue.priority} className="size-3.5 shrink-0" />}
                <span className="text-[10px] font-mono font-semibold text-blue-700">{issue.key}</span>
                <ExternalLink className="size-2.5 text-slate-300 group-hover:text-blue-400 ml-auto shrink-0" />
            </div>
            <p className="text-xs text-slate-800 font-medium line-clamp-2 mb-2">{issue.summary}</p>
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{issue.issueType}</span>
                {issue.assignee && (
                    <Avatar className="size-5">
                        <AvatarImage src={issue.assignee.avatarUrl} />
                        <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">{issue.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
            </div>
        </a>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JiraPage() {
    const workspaceId = useWorkspaceId();
    const searchIssues = useAction(api.jira.searchIssues);
    const getProjects = useAction(api.jira.getProjects);
    const getProjectVersions = useAction(api.jira.getProjectVersions);

    const [allIssues, setAllIssues] = useState<JiraIssueRow[]>([]);
    const [projects, setProjects] = useState<JiraProject[]>([]);
    const [versions, setVersions] = useState<Record<string, JiraVersion[]>>({});
    const [myIssues, setMyIssues] = useState<JiraIssueRow[]>([]);
    const [searchResults, setSearchResults] = useState<JiraIssueRow[]>([]);
    const [jql, setJql] = useState("ORDER BY updated DESC");
    const [loading, setLoading] = useState(true);
    const [loadingMy, setLoadingMy] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [myLoaded, setMyLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

    // Load all issues + projects on mount
    const loadAll = async () => {
        setLoading(true);
        try {
            const [issueResult, projectList] = await Promise.all([
                searchIssues({ workspaceId, jql: "ORDER BY updated DESC", maxResults: 100 }),
                getProjects({ workspaceId }),
            ]);
            setAllIssues(issueResult.issues as JiraIssueRow[]);
            setProjects(projectList);

            // Fetch versions for each project (non-blocking)
            for (const p of projectList) {
                getProjectVersions({ workspaceId, projectKey: p.key })
                    .then((v) => setVersions((prev) => ({ ...prev, [p.key]: v })))
                    .catch(() => {});
            }
        } catch (err: any) {
            toast.error(err.message ?? "Failed to load Jira data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, [workspaceId]);

    // ── Computed stats ──────────────────────────────────────────────────────

    const stats = useMemo(() => {
        const total = allIssues.length;
        const done = allIssues.filter((i) => i.statusCategory === "done" || i.statusCategory === "green").length;
        const inProgress = allIssues.filter((i) => i.statusCategory === "indeterminate" || i.statusCategory === "yellow").length;
        const todo = allIssues.filter((i) => i.statusCategory === "new" || i.statusCategory === "blue-grey").length;
        const unassigned = allIssues.filter((i) => !i.assignee).length;
        return { total, done, inProgress, todo, unassigned };
    }, [allIssues]);

    // Per-project stats
    const projectStats = useMemo(() => {
        const map = new Map<string, { key: string; name: string; total: number; done: number; inProgress: number; todo: number }>();
        for (const issue of allIssues) {
            const key = issue.projectKey;
            if (!map.has(key)) map.set(key, { key, name: issue.projectName || key, total: 0, done: 0, inProgress: 0, todo: 0 });
            const p = map.get(key)!;
            p.total++;
            if (issue.statusCategory === "done" || issue.statusCategory === "green") p.done++;
            else if (issue.statusCategory === "indeterminate" || issue.statusCategory === "yellow") p.inProgress++;
            else p.todo++;
        }
        return Array.from(map.values());
    }, [allIssues]);

    // Per-person stats
    const peopleStats = useMemo(() => {
        const map = new Map<string, { assignee: { name: string; avatarUrl: string }; total: number; done: number; inProgress: number; issues: JiraIssueRow[] }>();
        for (const issue of allIssues) {
            if (!issue.assignee) continue;
            const key = issue.assignee.name;
            if (!map.has(key)) map.set(key, { assignee: issue.assignee, total: 0, done: 0, inProgress: 0, issues: [] });
            const p = map.get(key)!;
            p.total++;
            if (issue.statusCategory === "done" || issue.statusCategory === "green") p.done++;
            else if (issue.statusCategory === "indeterminate" || issue.statusCategory === "yellow") p.inProgress++;
            p.issues.push(issue);
        }
        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [allIssues]);

    // Board columns
    const boardColumns = useMemo(() => ({
        todo: allIssues.filter((i) => i.statusCategory === "new" || i.statusCategory === "blue-grey"),
        inProgress: allIssues.filter((i) => i.statusCategory === "indeterminate" || i.statusCategory === "yellow"),
        done: allIssues.filter((i) => i.statusCategory === "done" || i.statusCategory === "green"),
    }), [allIssues]);

    const loadMyIssues = async () => {
        setLoadingMy(true);
        try {
            const result = await searchIssues({ workspaceId, jql: "assignee = currentUser() ORDER BY updated DESC" });
            setMyIssues(result.issues as JiraIssueRow[]);
            setMyLoaded(true);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to load issues");
        } finally { setLoadingMy(false); }
    };

    const handleSearch = async () => {
        setLoadingSearch(true);
        try {
            const result = await searchIssues({ workspaceId, jql });
            setSearchResults(result.issues as JiraIssueRow[]);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to search issues");
        } finally { setLoadingSearch(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
                <span className="text-sm">Loading Jira data…</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
                <h1 className="text-lg font-semibold flex items-center gap-2">
                    <span className="size-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">J</span>
                    Jira Dashboard
                </h1>
                <Button size="sm" variant="outline" onClick={loadAll} disabled={loading}>
                    <RefreshCw className="size-3.5 mr-1.5" /> Refresh
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                    <TabsList className="mx-6 mt-3 flex-shrink-0 w-fit">
                        <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="size-3.5" />Overview</TabsTrigger>
                        <TabsTrigger value="board" className="gap-1.5"><LayoutGrid className="size-3.5" />Board</TabsTrigger>
                        <TabsTrigger value="people" className="gap-1.5"><Users className="size-3.5" />People</TabsTrigger>
                        <TabsTrigger value="projects" className="gap-1.5"><FolderKanban className="size-3.5" />Projects</TabsTrigger>
                        <TabsTrigger value="milestones" className="gap-1.5"><Milestone className="size-3.5" />Milestones</TabsTrigger>
                        <TabsTrigger value="my-issues">My Issues</TabsTrigger>
                        <TabsTrigger value="search">Search</TabsTrigger>
                    </TabsList>

                    {/* ── Overview ── */}
                    <TabsContent value="overview" className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
                        {/* Stat cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                            {[
                                { label: "Total Issues", value: stats.total, icon: <CircleDot className="size-4 text-blue-500" />, color: "bg-blue-50 border-blue-200" },
                                { label: "In Progress", value: stats.inProgress, icon: <Clock className="size-4 text-yellow-500" />, color: "bg-yellow-50 border-yellow-200" },
                                { label: "Done", value: stats.done, icon: <CheckCircle2 className="size-4 text-green-500" />, color: "bg-green-50 border-green-200" },
                                { label: "Unassigned", value: stats.unassigned, icon: <Users className="size-4 text-slate-400" />, color: "bg-slate-50 border-slate-200" },
                            ].map((s) => (
                                <div key={s.label} className={cn("border rounded-xl p-4 flex items-center gap-3", s.color)}>
                                    {s.icon}
                                    <div>
                                        <p className="text-2xl font-bold">{s.value}</p>
                                        <p className="text-xs text-muted-foreground">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Project progress */}
                            <div>
                                <h2 className="text-sm font-semibold mb-3 text-slate-700">Project Progress</h2>
                                <div className="space-y-3">
                                    {projectStats.map((p) => {
                                        const { pct } = progressBar(p.done, p.total);
                                        return (
                                            <div key={p.key} className="bg-white border border-slate-200 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div>
                                                        <span className="text-xs font-mono font-semibold text-blue-700 mr-2">{p.key}</span>
                                                        <span className="text-sm font-medium">{p.name}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{pct}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                                    <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-slate-300 inline-block" />{p.todo} To Do</span>
                                                    <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-yellow-400 inline-block" />{p.inProgress} In Progress</span>
                                                    <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-green-500 inline-block" />{p.done} Done</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Top assignees */}
                            <div>
                                <h2 className="text-sm font-semibold mb-3 text-slate-700">Team Workload</h2>
                                <div className="space-y-2">
                                    {peopleStats.map((p) => {
                                        const { pct } = progressBar(p.done, p.total);
                                        return (
                                            <div key={p.assignee.name} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                                                <Avatar className="size-8 shrink-0">
                                                    <AvatarImage src={p.assignee.avatarUrl} />
                                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{p.assignee.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium truncate">{p.assignee.name}</span>
                                                        <span className="text-xs text-muted-foreground ml-2 shrink-0">{p.total} tasks</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                                        <span>{p.inProgress} active</span>
                                                        <span>{p.done} done</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {peopleStats.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-6">No assigned issues</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── Board ── */}
                    <TabsContent value="board" className="flex-1 overflow-hidden mt-4 px-6 pb-6">
                        <div className="grid grid-cols-3 gap-4 h-full">
                            {[
                                { label: "To Do", issues: boardColumns.todo, color: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
                                { label: "In Progress", issues: boardColumns.inProgress, color: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-400" },
                                { label: "Done", issues: boardColumns.done, color: "bg-green-100 text-green-800", dot: "bg-green-500" },
                            ].map((col) => (
                                <div key={col.label} className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                    <div className={cn("flex items-center gap-2 px-3 py-2 border-b border-slate-200", col.color)}>
                                        <span className={cn("size-2 rounded-full", col.dot)} />
                                        <span className="text-xs font-semibold">{col.label}</span>
                                        <span className="ml-auto text-xs font-bold">{col.issues.length}</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                        {col.issues.map((issue) => <KanbanCard key={issue.id} issue={issue} />)}
                                        {col.issues.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-6">No issues</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* ── People ── */}
                    <TabsContent value="people" className="flex-1 overflow-y-auto mt-4 px-6 pb-6">
                        {/* Filter bar */}
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <button
                                onClick={() => setSelectedPerson(null)}
                                className={cn("text-xs px-3 py-1 rounded-full border transition-colors",
                                    !selectedPerson ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300")}
                            >
                                All
                            </button>
                            {peopleStats.map((p) => (
                                <button
                                    key={p.assignee.name}
                                    onClick={() => setSelectedPerson(selectedPerson === p.assignee.name ? null : p.assignee.name)}
                                    className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors",
                                        selectedPerson === p.assignee.name ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white")}
                                >
                                    <Avatar className="size-4">
                                        <AvatarImage src={p.assignee.avatarUrl} />
                                        <AvatarFallback className="text-[7px]">{p.assignee.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {p.assignee.name}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6">
                            {peopleStats
                                .filter((p) => !selectedPerson || p.assignee.name === selectedPerson)
                                .map((p) => {
                                    const { pct } = progressBar(p.done, p.total);
                                    return (
                                        <div key={p.assignee.name} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                            {/* Person header */}
                                            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
                                                <Avatar className="size-9">
                                                    <AvatarImage src={p.assignee.avatarUrl} />
                                                    <AvatarFallback className="text-sm bg-blue-100 text-blue-700">{p.assignee.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{p.assignee.name}</p>
                                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                                                        <span>{p.total} tasks</span>
                                                        <span>{p.inProgress} in progress</span>
                                                        <span>{p.done} done</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-slate-700">{pct}%</span>
                                                    <p className="text-[10px] text-muted-foreground">complete</p>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="h-1.5 bg-slate-100">
                                                <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            {/* Issues */}
                                            <div className="p-3 space-y-1.5">
                                                {p.issues.map((issue) => (
                                                    <a key={issue.id} href={`https://${issue.domain}/browse/${issue.key}`} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors no-underline group">
                                                        {issue.priorityIconUrl && <img src={issue.priorityIconUrl} alt={issue.priority} className="size-3.5 shrink-0" />}
                                                        <span className="text-[10px] font-mono font-semibold text-blue-700 shrink-0">{issue.key}</span>
                                                        <span className="text-xs text-slate-700 flex-1 truncate">{issue.summary}</span>
                                                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 shrink-0", statusColor(issue.statusCategory))}>{issue.status}</Badge>
                                                        <ExternalLink className="size-3 text-slate-300 group-hover:text-blue-400 shrink-0" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </TabsContent>

                    {/* ── Projects ── */}
                    <TabsContent value="projects" className="flex-1 overflow-y-auto mt-4 px-6 pb-6">
                        <div className="space-y-6">
                            {projectStats.map((p) => {
                                const { pct } = progressBar(p.done, p.total);
                                const projectIssues = allIssues.filter((i) => i.projectKey === p.key);
                                return (
                                    <div key={p.key} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{p.key}</span>
                                                    <span className="font-semibold text-sm">{p.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-600">{pct}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                                                <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                                                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-slate-300 inline-block" />{p.todo} To Do</span>
                                                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-yellow-400 inline-block" />{p.inProgress} In Progress</span>
                                                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-green-500 inline-block" />{p.done} Done</span>
                                                <span className="ml-auto">{p.total} total</span>
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
                                            {projectIssues.map((issue) => (
                                                <a key={issue.id} href={`https://${issue.domain}/browse/${issue.key}`} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors no-underline group">
                                                    {issue.priorityIconUrl && <img src={issue.priorityIconUrl} alt={issue.priority} className="size-3.5 shrink-0" />}
                                                    <span className="text-[10px] font-mono font-semibold text-blue-700 shrink-0">{issue.key}</span>
                                                    <span className="text-xs text-slate-700 flex-1 truncate">{issue.summary}</span>
                                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 shrink-0", statusColor(issue.statusCategory))}>{issue.status}</Badge>
                                                    {issue.assignee && (
                                                        <Avatar className="size-5 shrink-0">
                                                            <AvatarImage src={issue.assignee.avatarUrl} />
                                                            <AvatarFallback className="text-[8px]">{issue.assignee.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <ExternalLink className="size-3 text-slate-300 group-hover:text-blue-400 shrink-0" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {projectStats.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No projects found</p>}
                        </div>
                    </TabsContent>

                    {/* ── Milestones ── */}
                    <TabsContent value="milestones" className="flex-1 overflow-y-auto mt-4 px-6 pb-6">
                        {Object.keys(versions).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-12">No milestones/versions found in your projects</p>
                        ) : (
                            <div className="space-y-6">
                                {projects.map((project) => {
                                    const vList = versions[project.key];
                                    if (!vList?.length) return null;
                                    return (
                                        <div key={project.key} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{project.key}</span>
                                                <span className="font-semibold text-sm">{project.name}</span>
                                                <span className="ml-auto text-xs text-muted-foreground">{vList.length} version{vList.length !== 1 ? "s" : ""}</span>
                                            </div>
                                            <div className="divide-y divide-slate-100">
                                                {vList.map((v) => (
                                                    <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                                                        <div className={cn(
                                                            "size-2.5 rounded-full shrink-0",
                                                            v.released ? "bg-green-500" : "bg-blue-400"
                                                        )} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium">{v.name}</p>
                                                            {v.description && <p className="text-xs text-muted-foreground truncate">{v.description}</p>}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <Badge variant="outline" className={cn("text-[10px]", v.released ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
                                                                {v.released ? "Released" : "Unreleased"}
                                                            </Badge>
                                                            {v.releaseDate && <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(v.releaseDate), "MMM d, yyyy")}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── My Issues ── */}
                    <TabsContent value="my-issues" className="flex-1 overflow-y-auto mt-4 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">Issues assigned to you</p>
                            <Button size="sm" variant="outline" onClick={loadMyIssues} disabled={loadingMy}>
                                {loadingMy ? <Loader2 className="size-4 animate-spin mr-2" /> : <RefreshCw className="size-4 mr-2" />}
                                {myLoaded ? "Refresh" : "Load Issues"}
                            </Button>
                        </div>
                        {myIssues.length === 0 && myLoaded && <p className="text-sm text-muted-foreground text-center py-8">No issues assigned to you.</p>}
                        {myIssues.map((issue) => <IssueRow key={issue.id} issue={issue} workspaceId={workspaceId} />)}
                    </TabsContent>

                    {/* ── Search ── */}
                    <TabsContent value="search" className="flex-1 overflow-y-auto mt-4 px-6 pb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Input value={jql} onChange={(e) => setJql(e.target.value)} placeholder='JQL query, e.g. project = "MY" ORDER BY created DESC'
                                className="flex-1 font-mono text-sm" onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                            <Button onClick={handleSearch} disabled={loadingSearch}>
                                {loadingSearch ? <Loader2 className="size-4 animate-spin mr-2" /> : <Search className="size-4 mr-2" />}Search
                            </Button>
                        </div>
                        {searchResults.length === 0 && !loadingSearch && <p className="text-sm text-muted-foreground text-center py-8">Enter a JQL query and press Search.</p>}
                        {searchResults.map((issue) => <IssueRow key={issue.id} issue={issue} workspaceId={workspaceId} />)}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
