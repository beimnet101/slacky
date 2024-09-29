
"use client"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
  } from "@/components/ui/resizable"
  

import { Sidebar } from "./sidebar";
import {Toolbar} from "./toolbar";
import { WorkspaceSidebar } from "./workspace-sidebar";


interface workspaceIdLayoutProps{
children:React.ReactNode;

};

const workspaceIdLayout=({children}:workspaceIdLayoutProps)=>{


return(
    <div className="h-full ">
      
    <Toolbar/>
    <div className=" flex h-[calc(100vh-40px)]">
        <Sidebar/>

        <ResizablePanelGroup
         direction="horizontal"
         autoSaveId="bw-workspacelayout"
        >
            <ResizablePanel 
            defaultSize={20}
            minSize={11}
            className="bg-[#5E2C5F]"
            >
                <WorkspaceSidebar/>
                <div>
                    channels sidebar
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle/>

          
            <ResizablePanel minSize={20}>
               {children}
            </ResizablePanel>
      
        </ResizablePanelGroup>
    
    </div>


    </div>
);



}
export default workspaceIdLayout