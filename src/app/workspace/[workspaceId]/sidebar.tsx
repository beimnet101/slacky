
import { UserButton } from "@/features/auth/components/user-button";
import { WorkspaceSwitcher } from "./workspaceSwitcher";
import { SidebarButton } from "./sidebar-button";
import { Bell, BellIcon, Home, HomeIcon, MessageSquare, MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";


export  const Sidebar=()=>{
 const pathname=usePathname();
return(
<aside className="w-[70px] h-full bg-[#481349] flex flex-col gap-y-4 items-center pt-[9px] pb-4">
<WorkspaceSwitcher/>
<SidebarButton icon={Home} label="home" isActive={pathname.includes("/workspace")}/>
<SidebarButton icon={MessageSquare} label="DMs" />
<SidebarButton icon={Bell} label="activity" />
<SidebarButton icon={MoreHorizontal} label="more" />
<div className="flex flex-col items-center justify-center gap-y-1 mt-auto" >

<UserButton/>

</div>
</aside>
);

}