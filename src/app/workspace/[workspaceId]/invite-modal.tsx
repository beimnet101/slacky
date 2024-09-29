
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { CopyIcon, RefreshCcw } from "lucide-react";
import { useNewJoinCode } from "@/features/workspaces/api/use-new-join-code";
import { DialogClose } from "@radix-ui/react-dialog";
import { useConfirm } from "@/hooks/use-confirm";
  
 interface InviteModalProps{
open:boolean;
setOpen :(open:boolean)=>void;
name:string;
joinCode:string;
 };
 


export const InviteModal=({
open,
setOpen,
name,
joinCode,
}:InviteModalProps)=>{
    const{mutate,isPending}=useNewJoinCode();
    const workspaceId=useWorkspaceId();
    const[ConfirmDialog,confirm]=useConfirm("Are you sure?","This will deactivate the current invite code and generate a new one");
     
    
    const handleNewCode=async()=>{
        const ok=await confirm();
        if(!ok) return;
   mutate(
    {
   workspaceId,
        
    },{
        onSuccess: () => {
            setTimeout(() => {
                toast.success("New join code generated"),{

                    style:{
                        background:'white'
                    },
                    duration: 3000,
                };
            }, 1000); // Delay of 1 second
        },
        onError: () => {
            setTimeout(() => {
                toast.error("Failed to generate new join code"),{

                style:{
                    background:'white'
                },
                duration: 3000,

        }
    }, 1000); // Delay of 1 second
        }
    }
    
   )

     }
    
    const handleCopy=()=>{

    const inviteLink=`${window.location.origin}/join/${workspaceId}`;
      navigator.clipboard
      .writeText(inviteLink)
      .then(()=>
        toast.success("Invite link copied to clipboard"));

    }
 return(
 <>
 <ConfirmDialog/>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-white">
        <DialogHeader>
            <DialogTitle>
                Invite peopele to your {name}
            </DialogTitle>

            <DialogDescription>
                Use the code below to invite people to your workspace
            </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-y-4 items-center justify-center py-10">
           <p className="text-4xl font-bold tracking-widest  uppercase ">
            {joinCode}
           </p> 
            <Button
            onClick={handleCopy}
             variant="ghost"
             size="sm"
            >
                copy link   
                <CopyIcon className="size-4 ml-2"/>            
            </Button>

        </div>
          <div className="flex items-center justify-between w-full">
             <Button
             disabled={isPending}
              onClick={handleNewCode}
              variant="outline"

             >
                New Code
              <RefreshCcw className="size-4 ml-2"/>
             </Button>
             <DialogClose asChild>
                <Button>
                    close

                </Button>

             </DialogClose>
          </div>

      </DialogContent>

    </Dialog>
    </>
 )


}