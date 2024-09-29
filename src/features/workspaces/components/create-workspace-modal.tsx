"use client"
import{
    Dialog,
    DialogContent,
   
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { useCreateWorkspaceModal } from "../store/use-create-workspace-modal";
import { Button } from "@/components/ui/button";
import { useCreateWorkspace } from "../api/use-create-workspaces";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const CreateWorkspaceModal=()=>{
  const router=useRouter();
const[open,setOpen]=useCreateWorkspaceModal();
const{ mutate ,isPending,isError,isSuccess, data, error }=useCreateWorkspace();
 const[name,setName]=useState("");

 
 
const handleclose=()=>{
    setOpen(false);
    setName("");
};

const handleSubmit=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
   mutate({name},{
 onSuccess(id){
  toast.success("workspace created");
  router.push(`/workspace/${id}`);
   handleclose();
 }

   })
 // TODO: handle success and redirect to workspace page
};

return(
<Dialog open={open}  onOpenChange={handleclose}>
   <DialogContent className="bg-white">
     <DialogHeader>
           <DialogTitle>
              Add a new workspace
           </DialogTitle>
     </DialogHeader>
     <form onSubmit={handleSubmit}className="space-y-4 ">
        <input  
        value={name}
        onChange={(e)=>setName(e.target.value)}
        disabled={isPending}
        required
       autoFocus
       minLength={3}
       placeholder="workspace name eg 'work,personal,home'"
      className="w-full border border-gray-300 rounded"
      />
   <div className="flex justify-end">
      <Button disabled={false}>

        create
      </Button>
   </div>

     </form>

   </DialogContent>
</Dialog >

);
};