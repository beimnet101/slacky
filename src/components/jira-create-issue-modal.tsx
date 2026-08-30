"use client";

import { useState, useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useChannelId } from "@/hooks/use-channel-id";
import { useCreateMessage } from "@/features/messages/api/use-create-message";

interface JiraCreateIssueModalProps {
    messageBody: string;
    onClose: () => void;
    workspaceId: Id<"workspaces">;
    channelId?: Id<"channels">;
    conversationId?: Id<"conversations">;
}

function extractPlainText(body: string): string {
    try {
        const delta = JSON.parse(body);
        if (delta?.ops) {
            return delta.ops
                .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
                .join("")
                .trim();
        }
    } catch {}
    return body.trim();
}

export const JiraCreateIssueModal = ({
    messageBody,
    onClose,
    workspaceId,
    channelId,
    conversationId,
}: JiraCreateIssueModalProps) => {
    const getProjects = useAction(api.jira.getProjects);
    const getIssueTypes = useAction(api.jira.getIssueTypes);
    const getPriorities = useAction(api.jira.getPriorities);
    const getAssignableUsers = useAction(api.jira.getAssignableUsers);
    const createIssue = useAction(api.jira.createIssue);
    const { mutate: createMessage } = useCreateMessage();

    const plainText = extractPlainText(messageBody);

    const [projects, setProjects] = useState<{ id: string; key: string; name: string }[]>([]);
    const [issueTypes, setIssueTypes] = useState<{ id: string; name: string }[]>([]);
    const [priorities, setPriorities] = useState<{ id: string; name: string }[]>([]);
    const [assignableUsers, setAssignableUsers] = useState<{ accountId: string; displayName: string }[]>([]);

    const [selectedProject, setSelectedProject] = useState("");
    const [selectedIssueType, setSelectedIssueType] = useState("");
    const [summary, setSummary] = useState(plainText.slice(0, 200));
    const [description, setDescription] = useState(plainText);
    const [selectedPriority, setSelectedPriority] = useState("");
    const [selectedAssignee, setSelectedAssignee] = useState("");

    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [createdIssue, setCreatedIssue] = useState<{ key: string; url: string } | null>(null);

    useEffect(() => {
        getProjects({ workspaceId })
            .then((p) => setProjects(p))
            .catch(() => toast.error("Failed to load Jira projects"))
            .finally(() => setLoadingProjects(false));

        getPriorities({ workspaceId })
            .then((p) => setPriorities(p as { id: string; name: string }[]))
            .catch(() => {});
    }, [workspaceId]);

    useEffect(() => {
        if (!selectedProject) return;
        setLoadingIssueTypes(true);
        setLoadingUsers(true);

        getIssueTypes({ workspaceId })
            .then((types) => setIssueTypes(types as { id: string; name: string }[]))
            .catch(() => {})
            .finally(() => setLoadingIssueTypes(false));

        const projectKey = projects.find((p) => p.id === selectedProject)?.key ?? "";
        if (projectKey) {
            getAssignableUsers({ workspaceId, projectKey })
                .then((users) => setAssignableUsers(users as { accountId: string; displayName: string }[]))
                .catch(() => {})
                .finally(() => setLoadingUsers(false));
        } else {
            setLoadingUsers(false);
        }
    }, [selectedProject]);

    const handleSubmit = async () => {
        if (!selectedProject || !selectedIssueType || !summary) {
            toast.error("Please fill in required fields");
            return;
        }
        setSubmitting(true);
        try {
            const fields: any = {
                project: { id: selectedProject },
                issuetype: { id: selectedIssueType },
                summary,
                description: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: description }],
                        },
                    ],
                },
            };
            if (selectedPriority) fields.priority = { id: selectedPriority };
            if (selectedAssignee) fields.assignee = { accountId: selectedAssignee };

            const result = await createIssue({ workspaceId, fields });
            setCreatedIssue(result);

            // Post message in channel
            if (channelId || conversationId) {
                const notifyBody = JSON.stringify({
                    ops: [
                        { insert: `✅ Jira issue ` },
                        { insert: result.key, attributes: { link: result.url } },
                        { insert: ` created: ${summary} ` },
                        { insert: result.url, attributes: { link: result.url } },
                        { insert: "\n" },
                    ],
                });
                createMessage({
                    body: notifyBody,
                    workspaceId,
                    channelId,
                    conversationId,
                });
            }

            toast.success(`Issue ${result.key} created!`);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to create issue");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold">J</span>
                        Create Jira Issue
                    </DialogTitle>
                </DialogHeader>

                {createdIssue ? (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4">
                            <CheckCircle className="size-5 shrink-0" />
                            <div>
                                <p className="font-medium">Issue created successfully!</p>
                                <a
                                    href={createdIssue.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm underline text-blue-600"
                                >
                                    {createdIssue.key} — View in Jira
                                </a>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={onClose}>Close</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>
                                Project <span className="text-red-500">*</span>
                            </Label>
                            {loadingProjects ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin" /> Loading projects…
                                </div>
                            ) : (
                                <Select value={selectedProject} onValueChange={setSelectedProject}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                [{p.key}] {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Issue Type <span className="text-red-500">*</span>
                            </Label>
                            {loadingIssueTypes ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin" /> Loading types…
                                </div>
                            ) : (
                                <Select
                                    value={selectedIssueType}
                                    onValueChange={setSelectedIssueType}
                                    disabled={!selectedProject}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select issue type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {issueTypes.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Summary <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="Issue summary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Issue description"
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorities.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Assignee</Label>
                                {loadingUsers ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
                                        <Loader2 className="size-4 animate-spin" /> Loading…
                                    </div>
                                ) : (
                                    <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assignableUsers.map((u) => (
                                                <SelectItem key={u.accountId} value={u.accountId}>
                                                    {u.displayName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between pt-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !selectedProject || !selectedIssueType || !summary}
                            >
                                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                                Create Issue
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
