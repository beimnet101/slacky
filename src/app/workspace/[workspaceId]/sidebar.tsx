import { UserButton } from "@/features/auth/components/user-button";
import { WorkspaceSwitcher } from "./workspaceSwitcher";
import { SidebarButton } from "./sidebar-button";
import { Bell, BellIcon, Files, Home, HomeIcon, MessageSquare, MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMessageCount } from "@/features/conversations/api/use-get-conversation-count";
import { useMemberId } from "@/hooks/use-member-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetMentionCount } from "@/features/mentions/api/use-get-mention-count";

import { useRouter } from "next/navigation";
import { EditProfileModal } from "@/features/members/components/editProfile";
import { useEditProfileModal } from "@/features/members/store/use-edit-profile-modal";




export const Sidebar = () => {
    const router = useRouter();

    const pathname = usePathname();
    const workspaceId = useWorkspaceId();
    const memberId = useMemberId();
    const data = useMessageCount({ workspaceId, memberId });
    const newMessagecount = data;
    const mentionCount = useGetMentionCount({ workspaceId });


    const [open, setOpen] = useEditProfileModal(); // Use the atom to manage modal state

    const handleOpenModal = () => {
        setOpen(true); // Set the modal state to open
    };


    return (
        <aside className="w-[70px] h-full bg-[#481349] flex flex-col gap-y-4 items-center pt-[9px] pb-4">
            <WorkspaceSwitcher />
            <SidebarButton icon={Home} label="home" isActive={pathname.includes("/workspace")} onClick={() => router.push('/')} />
            <SidebarButton icon={MessageSquare} newMessages={data} label="DMs" isActive={pathname.includes("/dms")} onClick={() => router.push(`/workspace/${workspaceId}/dms`)} />
            <SidebarButton icon={Bell} label="activity" isActive={pathname.includes("/activity")} newMessages={mentionCount} onClick={() => router.push(`/workspace/${workspaceId}/activity`)} />
            <SidebarButton icon={Files} label="files" isActive={pathname.includes("/files")} onClick={() => router.push(`/workspace/${workspaceId}/files`)} />
            <SidebarButton icon={MoreHorizontal} label="more"  onClick={handleOpenModal }/>
            <div className="flex flex-col items-center justify-center gap-y-1 mt-auto" >

                <UserButton />

            </div>
        </aside>
    );

}

