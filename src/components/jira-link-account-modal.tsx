"use client";

import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, XIcon, Unlink, Search } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface JiraLinkAccountModalProps {
    workspaceId: Id<"workspaces">;
    onClose: () => void;
}

interface JiraUser {
    accountId: string;
    displayName: string;
    emailAddress: string;
    avatarUrl: string;
}

export const JiraLinkAccountModal = ({ workspaceId, onClose }: JiraLinkAccountModalProps) => {
    const myLink = useQuery(api.jira.getMyLink, { workspaceId });
    const searchJiraUsers = useAction(api.jira.searchJiraUsers);
    const linkAccount = useMutation(api.jira.linkMemberAccount);
    const unlinkAccount = useMutation(api.jira.unlinkMemberAccount);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<JiraUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [linking, setLinking] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) {
            setResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const users = await searchJiraUsers({ workspaceId, query });
                setResults(users);
            } catch (err: any) {
                toast.error(err?.message ?? "Failed to search Jira users");
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const handleSelect = async (user: JiraUser) => {
        setLinking(true);
        try {
            await linkAccount({
                workspaceId,
                jiraAccountId: user.accountId,
                jiraEmail: user.emailAddress,
                jiraDisplayName: user.displayName,
                jiraAvatarUrl: user.avatarUrl || undefined,
            });
            toast.success(`Linked to ${user.displayName}`);
            setQuery("");
            setResults([]);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to link account");
        } finally {
            setLinking(false);
        }
    };

    const handleUnlink = async () => {
        setUnlinking(true);
        try {
            await unlinkAccount({ workspaceId });
            toast.success("Jira account unlinked");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to unlink account");
        } finally {
            setUnlinking(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="size-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            J
                        </div>
                        Connect your Jira account
                    </DialogTitle>
                </DialogHeader>

                {myLink === undefined ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                ) : myLink !== null ? (
                    <div className="flex flex-col gap-4 py-2">
                        <p className="text-sm text-muted-foreground">Currently linked to:</p>
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50/40 border-blue-200">
                            <Avatar className="size-10">
                                <AvatarImage src={myLink.jiraAvatarUrl} />
                                <AvatarFallback className="bg-blue-200 text-blue-800">
                                    {myLink.jiraDisplayName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{myLink.jiraDisplayName}</p>
                                <p className="text-xs text-muted-foreground truncate">{myLink.jiraEmail}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleUnlink}
                            disabled={unlinking}
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        >
                            {unlinking ? (
                                <Loader2 className="size-4 animate-spin mr-2" />
                            ) : (
                                <Unlink className="size-4 mr-2" />
                            )}
                            Unlink Jira account
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 py-2">
                        <p className="text-sm text-muted-foreground">
                            Search for your Jira account to link it to your workspace profile.
                        </p>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="pl-8"
                                disabled={linking}
                            />
                        </div>

                        {searching && (
                            <div className="flex justify-center py-3">
                                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {!searching && results.length > 0 && (
                            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                                {results.map((user) => (
                                    <button
                                        key={user.accountId}
                                        onClick={() => handleSelect(user)}
                                        disabled={linking}
                                        className="flex items-center gap-3 p-3 w-full text-left hover:bg-blue-50 transition-colors disabled:opacity-50"
                                    >
                                        <Avatar className="size-8 flex-shrink-0">
                                            <AvatarImage src={user.avatarUrl} />
                                            <AvatarFallback className="bg-blue-200 text-blue-800 text-xs">
                                                {user.displayName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.displayName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.emailAddress}</p>
                                        </div>
                                        {linking && (
                                            <Loader2 className="size-3.5 animate-spin text-muted-foreground flex-shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!searching && query.trim() && results.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-3">
                                No Jira users found for &ldquo;{query}&rdquo;
                            </p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
