
"use client";
import {useRouter} from "next/navigation"

import { useCreateChannelModal } from "@/features/channels/store/use-create-channel-modal";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetWorkSpace } from "@/features/workspaces/api/use-get-workspace";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { useMemo,useEffect } from "react";
import { Loader, TriangleAlert } from "lucide-react";
import{useCurrentMember} from"@/features/members/api/use-current-member";
const WorkspaceIdPage=()=>{
 const router=useRouter();
 const workspaceId=useWorkspaceId();
 const[open,setOpen]=useCreateChannelModal();
 const{data:workspace,isLoading:workspaceLoading}=useGetWorkSpace({id:workspaceId})
const{ data:channels,isLoading:channelsLoading}=useGetChannels({workspaceId});
const{data:member,isLoading:memeberLoading}=useCurrentMember({workspaceId});
  const channelId=useMemo(()=>channels?.[0]?._id,[channels]);

  const isAdmin=useMemo(()=>member?.role==="admin",[member?.role]);



  useEffect(()=>{
    if (workspaceLoading || channelsLoading||memeberLoading||!member||!workspace) return;
     if (channelId){

        router.push(`/workspace/${workspaceId}/channel/${channelId}`)
     }
     else if(!open && isAdmin ){
      setOpen(true);

     }
    
        },[
            member,
            memeberLoading,
            isAdmin,
            channelId,
            workspaceLoading,
            channelsLoading,
            open,
            setOpen,
            router,
            workspaceId,
    ]);
             if(workspaceLoading||channelsLoading||memeberLoading){
            return(
                            <div className="h-full flex-1 flex items-center justify-center flex-col gap-2">
                                <Loader className="size-6 animate-spin text-muted-foreground"/>



                            </div>

            )

             }

                    if(!workspace||!member){
                        return(
                      
                            <div className="h-full flex-1 flex items-center justify-center flex-col gap-2">
                                <TriangleAlert className="size-6 text-muted-foreground"/>
                            <span className="text-sm text-muted-foreground">workspace not found</span>
                            </div>

                        )
                        

                    }

                          return  (
                      
                            <div className="h-full flex-1 flex items-center justify-center flex-col gap-2">
                                <TriangleAlert className="size-6 text-muted-foreground"/>
                            <span className="text-sm text-muted-foreground">channel not found</span>
                            </div>

                        );

   
};
 export default WorkspaceIdPage;
