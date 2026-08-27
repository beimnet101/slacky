import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaChevronDown } from "react-icons/fa";
import { Video } from "lucide-react";

interface HeaderProps {
    memberName?: string;
    memberImage?: string;
    onClick?: () => void;
    onVideoCall?: () => void;
};

export const Header = ({ memberName, memberImage, onClick, onVideoCall }: HeaderProps) => {
    const avatarFallback = memberName?.charAt(0).toUpperCase();
    return (

        <div className="bg-white border-b h-[49px] flex items-center px-4 overflow-hidden">
            <Button
                variant="ghost"
                className="text-lg font-semibold px-2 overflow-hidden w-auto"
                size="sm"
                onClick={onClick}
            >

                <Avatar className="size-6 mr-2">
                    <AvatarImage src={memberImage} />
                    <AvatarFallback>
                        {avatarFallback}
                    </AvatarFallback>

                </Avatar>
               <span className="truncate">
                {memberName}
               </span>

               <FaChevronDown className="size-2.5 ml-2"/>
            </Button>

            <div className="ml-auto">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={onVideoCall}
                    title="Start video call"
                >
                    <Video className="size-4" />
                </Button>
            </div>
        </div>
    )
}
