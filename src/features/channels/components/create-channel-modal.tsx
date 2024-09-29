import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
  import { useCreateChannelModal } from "../store/use-create-channel-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; import { useState } from "react"; 
import { useCreateChannel } from "../api/use-create-channel";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
  export const CreateChannelModal=()=>{
  
 const router=useRouter();
  const[open,setOpen]=useCreateChannelModal();
  const workspaceId=useWorkspaceId();
  const{mutate,isPending}=useCreateChannel();
  const[name,setName]=useState("");
  const handleclose=()=>{
        setName("");
        setOpen(false);


  };

  const handleChange=(e:React.ChangeEvent<HTMLInputElement>)=>{

 const  value=e.target.value.replace(/\s+/g,"-").toLowerCase();
  setName(value);
  }

   const handleSubmit=(e:React.FormEvent<HTMLFormElement>)=>{
    e .preventDefault();
  mutate(
    {name,
      workspaceId
    },
    {
      onSuccess:(id)=>{
        toast.success("channel created");
        router.push(`/workspace/${workspaceId}/channel/${id}`);
        handleclose();
      },
      onError:()=>{
        toast.error("failed to create channel");
      }
      ,
    }
  )
    }


  return(


     <Dialog open={open} onOpenChange={handleclose}>
       <DialogContent className="bg-white">
         <DialogHeader>
            <DialogTitle>Add a channel</DialogTitle>
         </DialogHeader>

         <form  onSubmit={handleSubmit}className="space-y-4">
           <Input
           value={name}
           disabled={isPending}
           onChange={handleChange} 
           required
           autoFocus 
           minLength={3}   
           maxLength={80}
           placeholder="eg plan-budget"   
           />
          <div className="flex justify-end">
            <Button disabled={isPending}>
              Create

            </Button>
               

          </div>

         </form>

       </DialogContent>

     </Dialog>


  )

  }