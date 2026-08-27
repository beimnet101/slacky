"use client"

import { useState } from "react";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useGetWorkSpace } from "@/features/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { AlertTriangle, HashIcon, Loader, MessageSquareText, Search, SendHorizonal } from "lucide-react";
import { WorkspaceHeader } from "./workspace-header";
import { SidebarItem } from "./sidebar-item";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { WorkspaceSection } from "./workspace-section";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { UserItem } from "./user-item";
import { useCreateChannelModal } from "@/features/channels/store/use-create-channel-modal";
import { useChannelId } from "@/hooks/use-channel-id";
import { useMemberId } from "@/hooks/use-member-id";
import { NewMessageModal } from "./new-message-modal";
import { Input } from "@/components/ui/input";


export const WorkspaceSidebar = () => {
    const channelId = useChannelId();
    const workspaceId = useWorkspaceId();
    const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId });
    const { data: workspace, isLoading: workspaceLoading } = useGetWorkSpace({ id: workspaceId });
    const { data: channels, isLoading: channelsLoading } = useGetChannels({ workspaceId });
    const { data: members, isLoading: membersLoading } = useGetMembers({ workspaceId });
    const [_open, setOpen] = useCreateChannelModal();
    const memberId = useMemberId();
    const [newMessageOpen, setNewMessageOpen] = useState(false);
    const [filterQuery, setFilterQuery] = useState("");

    // Show loading spinner while data is being fetched
    if (workspaceLoading || memberLoading) {
        return (
            <div className="flex flex-col bg-[#5E2C5F] h-full items-center justify-center">
                <Loader className="size-5 animate-spin text-white" />
            </div>
        );
    }

    // Check if both data are loaded and if either is missing
    if (!workspace || !member) {
        return (
            <div className="flex flex-col gap-y-2 bg-[#5E2C5F] h-full items-center justify-center">
                <AlertTriangle className="size-5 text-white" />
                <p className="text-white text-sm">
                    Workspace not found
                </p>
            </div>
        );
    }

    const query = filterQuery.toLowerCase().trim();

    const filteredChannels = query
        ? channels?.filter((c) => c.name.toLowerCase().includes(query))
        : channels;

    const filteredMembers = query
        ? members?.filter((m) => m.user.name?.toLowerCase().includes(query))
        : members;

    return (
        <div className="flex flex-col bg-[#5E2C5F] h-full ">
            <WorkspaceHeader workspace={workspace} isAdmin={member.role === "admin"} />
            <div className="flex flex-col overflow-y-auto flex-1 messages-scrollbar">
                <div className="flex flex-col px-2 mt-3">
                    <SidebarItem
                        label="Treads"
                        icon={MessageSquareText}
                        id="threads"
                        href={`/workspace/${workspaceId}/threads`}
                    />
                    <SidebarItem
                        label="Drafts & Sent"
                        icon={SendHorizonal}
                        id="drafts"
                        href={`/workspace/${workspaceId}/drafts`}
                    />
                </div>

                {/* Search / Filter */}
                <div className="px-2 mt-2 mb-1">
                    <div className="flex items-center gap-1.5 bg-white/10 rounded-md px-2">
                        <Search className="size-3.5 text-white/50 shrink-0" />
                        <Input
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            placeholder="Filter channels & DMs"
                            className="bg-transparent border-none text-white placeholder:text-white/50 focus-visible:ring-0 h-7 px-0 text-sm"
                        />
                    </div>
                </div>

                <WorkspaceSection
                    label="Channels"
                    hint="New channel"
                    onNew={
                        member.role === "admin" ?
                            () =>
                                setOpen(true) : undefined}
                >

                    {filteredChannels?.map((item) => (
                        <SidebarItem
                            key={item._id}
                            icon={HashIcon}
                            label={item.name}
                            id={item._id}
                            variant={channelId === item._id ? "active" : "default"}
                        />

                    ))}

                </WorkspaceSection>
                <WorkspaceSection
                    label="Direct Messages"
                    hint="New direct message"
                    onNew={() => setNewMessageOpen(true)}
                >

                    {filteredMembers?.map((item) => {

                        return (
                            <UserItem
                                key={item._id}
                                id={item._id}
                                label={item.user.name}
                                image={item.user.image}
                                variant={item._id === memberId ? "active" : "default"}
                            />
                        )
                    })}
                </WorkspaceSection>
            </div>

            <NewMessageModal
                open={newMessageOpen}
                onClose={() => setNewMessageOpen(false)}
                members={(members ?? []).map((m) => ({
                    _id: m._id,
                    user: { name: m.user.name, image: m.user.image },
                }))}
            />

        </div>

    );

    // If everything is loaded correctly, render workspace and member info
}
