import { Button } from "@/components/ui/button";
import { Id } from "../../../../../convex/_generated/dataModel"
import { useGetMember } from "../api/use-get-member";
import { AlertTriangle, ChevronDownIcon, MailIcon, Verified, XIcon } from "lucide-react";
import { Loader } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useUpdateMember } from "../api/use-update.member";
import { useRemoveMember } from "../api/use-remove-member";
import { useCurrentMember } from "../api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { toast, Toaster } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import VerifiedIcon from '@mui/icons-material/Verified';


import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@radix-ui/react-dropdown-menu";

interface ProfileProps {
    memberId: Id<"members">
    onClose: () => void;

};


export const Profile = ({ memberId, onClose }: ProfileProps) => {
    const workspaceId = useWorkspaceId();
    const router = useRouter();
    const { data: currentMember, isLoading: isLoadingCurrentMember } = useCurrentMember({ workspaceId });

    const { data: member, isLoading: isLoadingMember } = useGetMember({ id: memberId });
    const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();
    const { mutate: removeMember, isPending: isRemovingMember } = useRemoveMember();


    const [LeaveDialog, confirmLeave] = useConfirm("Leave workspace", "Are you sure you want to leave this workspace");

    const [RemoveDialog, confirmRemove] = useConfirm("Leave workspace", "Are you sure you want to leave this workspace");
    const [UpdateDialog, confirmUpdate] = useConfirm("Change role", "Are you sure you want to change this member's role");
    const avatarfallback = member?.user.name?.[0] ?? "M";

    const onRemove = async () => {

        const ok = await confirmRemove();
        if (!ok) return;
        removeMember({ id: memberId }, {
            onSuccess: () => {

                toast.success("Member removed");
                onClose();
            }
            ,
            onError: () => {
                toast.error("failed to remove them :(")

            }
        })
    };


    const onLeave = async () => {
        router.replace("/");
        const ok = await confirmLeave();
        if (!ok) return;
        removeMember({ id: memberId }, {
            onSuccess: () => {
                router.replace("/");
                toast.success("You left the workspace");
                onClose();
            }
            ,
            onError: () => {
                toast.error("failed to leave the workspace ")

            }
        })
    };

    const onUpdate = async (role: "admin" | "member") => {
        const ok = await confirmUpdate();
        if (!ok) return;

        updateMember({ id: memberId, role }, {
            onSuccess: () => {
                toast.success("Role changed");
                onClose();
            }
            ,
            onError: (error) => {
                console.log({ error })
                toast.error("failed to change role");


            }
        })
    };




    if (isLoadingMember || isLoadingCurrentMember) {
        return (
            <div className="h-full flex flex-col">

                <div className=" h-[49px] flex justify-between items-center px-4 py-4  border-b">
                    <p className="text-lg font-bold">Profile</p>

                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]" />
                    </Button>

                </div>
                <div className="flex h-full items-center justify-center">
                    <Loader className=" size-5 animate-spin text-muted-foreground" />

                </div>

            </div>
        );

    }
    if (!member) {

        //console.log("errror");
        return (
            <div className="h-full flex flex-col">

                <div className=" h-[49px] flex justify-between items-center px-4 py-6 border-b">
                    <p className="text-lg font-bold">profile</p>

                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]" />
                    </Button>

                </div>
                <div className="flex flex-col gap-y-2 h-full items-center justify-center">
                    <AlertTriangle className="  size-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground"> Profile not found</p>
                </div>

            </div>
        );


    }


    return (
        <>
            <RemoveDialog />
            <LeaveDialog />
            <UpdateDialog />
            <div className="h-full flex flex-col">

                <div className=" h-[49px] flex justify-between items-center px-4 py-6 border-b">
                    <p className="text-lg font-bold">profile</p>

                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]" />
                    </Button>

                </div>
                <div className="flex flex-col  items-center justify-center p-3">
                    <Avatar className="max-h-[180px] max-w-[180px] size-full">
                        <AvatarImage src={member.user.image} />
                        <AvatarFallback className="aspect-square text-4xl">
                            {avatarfallback}
                        </AvatarFallback>


                    </Avatar>

                </div>
                <div className="flex flex-col p-4">

                    <p className="text-xl font-bold flex items-center">
                        {member.user.name}
                        {member.role === "admin" && (
                            <span className="ml-2 bg-blue-500 rounded-full  flex items-center justify-center">
                                <Verified className="h-4 w-4 text-white" />
                            </span>
                        )}
                    </p>



                    {currentMember?.role === "admin" &&
                        currentMember?._id !== memberId ? (
                        <div className="flex items-center gap-2  mt-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>

                                    <Button variant="outline" className="w-full capitalize">
                                        {member.role} <ChevronDownIcon className="size-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full p-4 cursor-pointer">
                                    <DropdownMenuRadioGroup

                                        value={member.role}
                                        onValueChange={(role) => onUpdate(role as "admin" | "member")}>
                                        <DropdownMenuRadioItem value="admin"
                                        >
                                            Admin
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="member"
                                        >
                                            Member
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button onClick={onRemove} variant="outline" className="w-full">
                                Remove
                            </Button>

                        </div>

                    )
                        : currentMember?._id === memberId &&
                            currentMember?.role !== "admin" ? (
                            <div>
                                <Button onClick={onLeave} variant="outline" className="w-full">
                                    Leave
                                </Button>

                            </div>

                        )
                            : null}
                </div>
                <Separator />
                <div className="flex flex-col p-4">
                    <p className="text-sm font-bold mb-4">Contact Information</p>
                    <div className="flex items-center gap-2">
                        <div className="size-9 rounded-md bg-muted flex items-center justify-center">
                            <MailIcon className="size-4" />
                        </div>
                        <div className="flex flex-col">

                            <p className="text-[13px] font-semibold text-muted-foreground">
                                Email Address
                            </p>

                            <Link href={`mailto:${member.user.email}`}
                                className="text-sm hover:underline text-[#1264a3]"
                            >
                                {member.user.email}

                            </Link>
                        </div>

                    </div>

                </div>

            </div>
        </>

    );

};