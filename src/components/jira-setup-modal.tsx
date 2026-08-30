"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, Copy, Loader2, XCircle } from "lucide-react";
import { useGetChannels } from "@/features/channels/api/use-get-channels";

interface JiraSetupModalProps {
    open: boolean;
    onClose: () => void;
    workspaceId: Id<"workspaces">;
}

export const JiraSetupModal = ({ open, onClose, workspaceId }: JiraSetupModalProps) => {
    const connection = useQuery(api.jira.getConnection, { workspaceId });
    const { data: channels } = useGetChannels({ workspaceId });

    const testConnection = useAction(api.jira.testConnection);
    const saveConnection = useMutation(api.jira.saveConnection);
    const removeConnection = useMutation(api.jira.removeConnection);

    const [domain, setDomain] = useState("");
    const [email, setEmail] = useState("");
    const [apiToken, setApiToken] = useState("");
    const [notificationChannelId, setNotificationChannelId] = useState<string>("");
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [testResult, setTestResult] = useState<{ name: string; avatarUrl: string } | null>(null);
    const [testError, setTestError] = useState<string | null>(null);

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
    const siteUrl = convexUrl.replace(".cloud", ".site");
    const webhookUrl = `${siteUrl}/api/jira-webhook?workspaceId=${workspaceId}`;

    const isConnected = !!connection;

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        setTestError(null);
        try {
            const result = await testConnection({ domain, email, apiToken });
            setTestResult(result);
            toast.success(`Connected as ${result.name}`);
        } catch (err: any) {
            setTestError(err.message ?? "Connection failed");
            toast.error("Connection test failed");
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!domain || !email || !apiToken) {
            toast.error("Please fill in all required fields");
            return;
        }
        setSaving(true);
        try {
            await saveConnection({
                workspaceId,
                domain,
                email,
                apiToken,
                notificationChannelId: notificationChannelId
                    ? (notificationChannelId as Id<"channels">)
                    : undefined,
            });
            toast.success("Jira connection saved");
            onClose();
        } catch (err: any) {
            toast.error(err.message ?? "Failed to save connection");
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnect = async () => {
        setDisconnecting(true);
        try {
            await removeConnection({ workspaceId });
            toast.success("Jira disconnected");
            onClose();
        } catch (err: any) {
            toast.error(err.message ?? "Failed to disconnect");
        } finally {
            setDisconnecting(false);
        }
    };

    const copyWebhookUrl = () => {
        navigator.clipboard.writeText(webhookUrl);
        toast.success("Webhook URL copied");
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold text-lg">J</span>
                        Jira Integration
                    </DialogTitle>
                </DialogHeader>

                {isConnected ? (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-800 font-medium">Jira is connected</p>
                            <p className="text-xs text-green-600 mt-1">
                                Domain: <strong>{connection.domain}</strong>
                            </p>
                            <p className="text-xs text-green-600">
                                Account: <strong>{connection.email}</strong>
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={webhookUrl}
                                    className="text-xs font-mono"
                                />
                                <Button size="iconSm" variant="outline" onClick={copyWebhookUrl}>
                                    <Copy className="size-3.5" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Add this URL as a webhook in your Jira project settings to receive notifications.
                            </p>
                        </div>

                        <div className="flex justify-between pt-2">
                            <Button variant="outline" onClick={onClose}>Close</Button>
                            <Button
                                variant="destructive"
                                onClick={handleDisconnect}
                                disabled={disconnecting}
                            >
                                {disconnecting && <Loader2 className="size-4 mr-2 animate-spin" />}
                                Disconnect Jira
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="jira-domain">
                                Jira Domain <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="jira-domain"
                                placeholder="mycompany.atlassian.net"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jira-email">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="jira-email"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jira-token">
                                API Token <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="jira-token"
                                type="password"
                                placeholder="Your Jira API token"
                                value={apiToken}
                                onChange={(e) => setApiToken(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Generate at{" "}
                                <a
                                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    Atlassian account settings
                                </a>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Notification Channel (optional)</Label>
                            <Select
                                value={notificationChannelId}
                                onValueChange={setNotificationChannelId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a channel for notifications" />
                                </SelectTrigger>
                                <SelectContent>
                                    {channels?.map((ch) => (
                                        <SelectItem key={ch._id} value={ch._id}>
                                            # {ch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {testResult && (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm">
                                <CheckCircle className="size-4 shrink-0" />
                                Connected as <strong>{testResult.name}</strong>
                            </div>
                        )}
                        {testError && (
                            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm">
                                <XCircle className="size-4 shrink-0" />
                                {testError}
                            </div>
                        )}

                        <div className="flex justify-between pt-2">
                            <Button
                                variant="outline"
                                onClick={handleTest}
                                disabled={testing || !domain || !email || !apiToken}
                            >
                                {testing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                Test Connection
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={onClose}>Cancel</Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !domain || !email || !apiToken}
                                >
                                    {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
