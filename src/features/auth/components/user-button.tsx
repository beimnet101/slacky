import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Ensure these paths are correct
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Check for these imports

import { useCurrentUser } from "../api/use-current-user";
import { Loader, LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";


// Define UserButton without React.FC
export const UserButton = () => {
    const router = useRouter();



    const { signOut } = useAuthActions();



    const handleLogout = async () => {
        await signOut(); // Sign out the user
        router.push("/auth"); // Redirect to the authentication page after logout


    };





    const { data, isLoading } = useCurrentUser();
    if (isLoading) {

        return <Loader className="size-4 animate-spin text-muted-foreground" />

    }
    if (!data) {
        return null; // Return early if user data is not available yet
    }
    const { image, name } = data;
    const avatarFallback = name!.charAt(0).toUpperCase()


    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="outline-none relative">
                <Avatar className="rounded-md size-10 opacity-75 transition">
                    <AvatarImage className="rounded-md" src={image} alt={name} />
                    <AvatarFallback className="bg-sky-500 rounded-md text-white">
                        {avatarFallback}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="right" className="w-60">
                <DropdownMenuItem onClick={handleLogout} className="h-10">
                    {/* Add any dropdown items here */}
                    <LogOut className="size-4 mr-2" />log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
