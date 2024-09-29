"use client"

import { Button } from "@/components/ui/button";
import{DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuSeparator,
DropdownMenuTrigger
}from "@/components/ui/dropdown-menu";
import { useGetWorkSpace } from "@/features/workspaces/api/use-get-workspace";
import { useGetWorkSpaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Loader, Plus } from "lucide-react";
import { useRouter } from "next/navigation";




export const WorkspaceSwitcher=()=>{
 const router=useRouter();

const workspaceId=useWorkspaceId();
const{data:workspace,isLoading:workspaceLoading}=useGetWorkSpace({
    id:workspaceId
});

const{data:workspaces,isLoading:workspacesLoading}=useGetWorkSpaces();
 
const[_open,setOpen]=useCreateWorkspaceModal();

const filteredWorkSpaces=workspaces?.filter(
(ws)=> ws?._id!==workspaceId
 
  );
  
 



return(

   <DropdownMenu>
   <DropdownMenuTrigger asChild>
        <Button className="size-9 relative overflow-hidden bg-[#ABABAD] hover:bg-[#ABABAD]/80 text-slate-800 font-semibold text-xl"  >
        {workspaceLoading ?(
                <Loader className="size-5 animate-spin shrink-0"/>
            ): workspace?.name.charAt(0).toUpperCase()}
        </Button> 
      

        
   </DropdownMenuTrigger>
   <DropdownMenuContent side="bottom" align="start" className="w-64">
           <DropdownMenuItem  
            onClick={()=> router.push(`/workspace/${workspace?._id}`)}
           className=" cursor-pointer flex-col justify-start items-start capitalize">
            {workspace?.name}
              <span className="text-xs text-muted-foreground ">active workspace</span>
            
            </DropdownMenuItem>  
            {filteredWorkSpaces?.map((ws)=>(
         <DropdownMenuItem
         key={ws?._id}
         className="cursor-pointer capitalize overflow-hidden truncate flex items-center"
         onClick={() => router.push(`/workspace/${ws._id}`)}
       >
         <div className="shrink-0 h-9 w-9 relative overflow-hidden bg-[#616061] text-white text-lg font-semibold rounded-md flex items-center justify-center mr-2">
           {ws.name.charAt(0).toUpperCase()}
         </div>
       
         <p className="truncate w-full overflow-hidden text-ellipsis">{ws.name}</p>
       </DropdownMenuItem>
       
            )

            )}

     <DropdownMenuItem className="cursor-pointer" onClick={()=>setOpen(true)}>
    <div className="size-9 relative  overflow-hidden bg-[#f2f2f2] text-slate-800  text-lg font-semibold rounded-md flex items-center justify-center mr-2" >
          <div> 
             
             <Plus/>

          </div>


    </div>
 create a new workspace
     </DropdownMenuItem>
    
   </DropdownMenuContent>



   </DropdownMenu>




);

}