import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { IconType } from "react-icons/lib";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { cn } from "@/lib/utils";

const SidebarItemVariants = cva(

  "flex items-center gap-1.5 justify-start font-normal h-7 px-[18px] text-sm overflow-hidden"
  , {
    variants: {

      variant: {

        default: "text-[#f9edffcc]",
        active: "text-[#481349] bg-white/90 hover:bg-white/90",
      },
    },
    defaultVariants: {
      variant: "default"

    },

  }

);



interface SidebarItemProps {

  label: string;
  id: string;
  icon: LucideIcon | IconType;
  variant?: VariantProps<typeof SidebarItemVariants>["variant"];
  href?: string;


};

export const SidebarItem = ({
  label,
  id,
  icon: Icon,
  variant,
  href,
}: SidebarItemProps) => {

  const workspaceId = useWorkspaceId();
  const resolvedHref = href ?? `/workspace/${workspaceId}/channel/${id}`;
  return (
    <Button
      variant="transparent"
      size="sm"
      className={cn(SidebarItemVariants({ variant }))}
      asChild
    >
      <Link href={resolvedHref}>
        <Icon className="size-3.5  mr-0 shrink-0" />
        <span className="text-sm truncate">{label}</span>

      </Link>


    </Button>

  )

};