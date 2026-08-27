"use client"

import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

interface Member {
    _id: string;
    user: {
        name?: string;
        image?: string;
    };
}

interface NewMessageModalProps {
    open: boolean;
    onClose: () => void;
    members: Member[];
}

export const NewMessageModal = ({ open, onClose, members }: NewMessageModalProps) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();

    const handleMemberClick = (memberId: string) => {
        onClose();
        router.push(`/workspace/${workspaceId}/member/${memberId}`);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
            <DialogContent className="bg-white p-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-2 border-b">
                    <DialogTitle className="text-gray-900">New Direct Message</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col py-2 max-h-80 overflow-y-auto">
                    {members.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No members found
                        </p>
                    ) : (
                        members.map((member) => {
                            const name = member.user.name ?? "Member";
                            const fallback = name.charAt(0).toUpperCase();
                            return (
                                <button
                                    key={member._id}
                                    onClick={() => handleMemberClick(member._id)}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-left"
                                >
                                    <Avatar className="size-8 rounded-md">
                                        <AvatarImage className="rounded-md" src={member.user.image} />
                                        <AvatarFallback className="rounded-md bg-sky-500 text-white text-sm">
                                            {fallback}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-800">{name}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
