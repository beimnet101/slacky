"use client";


import {useEffect, useMemo}from "react";
import { UserButton } from "@/features/auth/components/user-button"; // Ensure this path is correct
import{useGetWorkSpaces} from"@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useRouter } from "next/navigation";
export default function Home() {
    // Ensure this function works correctly
 const router=useRouter();
  const{data,isLoading}=useGetWorkSpaces();
const workspaceId=useMemo(()=>data?.[0]?._id,[data]);
  
  const [open, setOpen]=useCreateWorkspaceModal();

useEffect(()=>{
 console.log(workspaceId);
if(isLoading) return ;
if(workspaceId){

router.push(`/workspace/${workspaceId}`);
} 
else if(!open){
  setOpen(true);
}

  },[workspaceId,isLoading,open,setOpen,router]);


    return (
    
            <UserButton />
    
    );
};