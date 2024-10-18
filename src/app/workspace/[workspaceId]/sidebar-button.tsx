import { LucideIcon } from "lucide-react";
import { IconType } from "react-icons/lib";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarButtonProps {
  icon: LucideIcon | IconType;
  label: string;
  isActive?: boolean;
  newMessages?: number;
  onClick?: () => void; 
};

export const SidebarButton = ({
  icon: Icon,
  label,
  isActive,
  newMessages = 0,
  onClick,
}: SidebarButtonProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-y-0.5 cursor-pointer group relative"> {/* Added relative positioning */}
      <Button
        variant="transparent"
        className={cn("size-9 p-2 group-hover:bg-accent/20", isActive && "bg-accent/20")}
        onClick={onClick} // Use the custom onClick
      >
        <Icon className="size-5 text-white group-hover:scale-110 transition-all" />
        {newMessages > 0 && (
          <span className="absolute top-[-5px] right-[-5px] bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {newMessages}
          </span>
        )}
      </Button>

      <span className="text-[11px] text-white group-hover:text-accent">
        {label}
      </span>
    </div>
  );
};
