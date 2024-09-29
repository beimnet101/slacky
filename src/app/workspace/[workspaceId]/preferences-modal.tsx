import { Button } from "@/components/ui/button";
import{
 Dialog,
 DialogContent,
 DialogTrigger,
 DialogHeader,
 DialogTitle,
 DialogFooter,
 DialogClose,

} from"@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRemoveWorkspace } from "@/features/workspaces/api/use-remove-workspace copy";
import { useUpdateWorkspace } from "@/features/workspaces/api/use-update-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface PreferencesModalProps{
open:boolean;
setOpen:(open:boolean)=>void;
intialValue:string
};

export const PreferencesModal=({
open,
setOpen,
intialValue,


}:PreferencesModalProps)=>{


  const [ConfirmDialog, confirm] = useConfirm("Are you sure ?", "This action is irreversable");
 const router=useRouter();
 const workspaceId=useWorkspaceId();

 const[value,SetValue]=useState(intialValue);
 
 const{mutate:updateWorkspace,isPending:isUpdatingWorkspace}=useUpdateWorkspace();
 const{mutate:removeWorkspace,isPending:isRemovingWorkspace}=useRemoveWorkspace();
 const[editOpen,setEditOpen]=useState(false);


 const handleRemove= async()=>{
  const ok= await confirm();
  if(!ok) return;
 removeWorkspace({
id:workspaceId
},
 {
  onSuccess:()=>{
    router.replace("/");
    toast.success("workspace removed");
      
                  },
  onError:()=>{
      toast.error("failed to remove workspace");
  }
 })


 };




    const handleEdit=(e:React.FormEvent<HTMLFormElement>)=>{
             e.preventDefault();
          updateWorkspace({
            id:workspaceId,
        name:value,
    },{
    onSuccess:()=>{
        toast.success("workspace updated");
        setEditOpen(false);
                 },
    onError:()=>{
        toast.error("failed to update workspace");
    }

     }  
         

        );
    };

 return(
  <>
  <ConfirmDialog/>
 <Dialog open={open} onOpenChange={setOpen}>
   <DialogContent className="p-0 bg-gray-50 overflow-hidden">
    <DialogHeader className="p-4 border-b bg-white">
        <DialogTitle>{value}</DialogTitle>
        
    </DialogHeader>
       <div className="px-4 pb-4 flex flex-col gap-y-4">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
         <div className="px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
            <div className=" flex items-center justify-between">
                 <p className="text-sm font-semibold">
                    Workspace
                 </p>
                 <p className="text-sm text-[#1264a3] hover:underline font-semibold">
                    Edit
                 </p>

            </div>
            <p className="text-sm">
                {value}
            </p>

         </div>
         </DialogTrigger>
         <DialogContent className=" bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
          <DialogHeader>
              <DialogTitle>Rename this workspace</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEdit}>

             <Input 
               value={value}
               disabled={isUpdatingWorkspace}
               onChange={(e)=>SetValue((e.target.value))}
               required
               autoFocus
               minLength={3}
               maxLength={80}
               placeholder="workspace name "

             />
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" disabled={isUpdatingWorkspace}>
                    Cancel
                </Button>
            </DialogClose>
            <Button disabled={isUpdatingWorkspace} >Save</Button>
        </DialogFooter>

          </form>
         </DialogContent>
         </Dialog>
       <button
       disabled={isRemovingWorkspace}
       onClick={handleRemove}
       className="flex items-center gap-x-2 px-5 py-5 mb-0.2 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 text-rose-600"
         >
       <TrashIcon className="size-4"/>
       <p className="text-sm font-semibold">Delete workspace</p>
       </button>
 </div>

   </DialogContent>

 </Dialog>
 </>
);



};