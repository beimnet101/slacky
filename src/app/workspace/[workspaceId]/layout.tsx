
"use client"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"


import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { usePanel } from "@/hooks/use-panel";
import React from "react";
import { Loader } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useChannelId } from "@/hooks/use-channel-id";
import { Thread } from "@/features/messages/components/thread";
interface workspaceIdLayoutProps {
    children: React.ReactNode;

};

const workspaceIdLayout = ({ children }: workspaceIdLayoutProps) => {
    const { parentMessageId, onClose } = usePanel();
    const showPanel = !!parentMessageId;


    return (
        <div className="h-full ">

            <Toolbar />
            <div className=" flex h-[calc(100vh-40px)]">
                <Sidebar />

                <ResizablePanelGroup
                    direction="horizontal"
                    autoSaveId="bw-workspacelayout"
                >
                    <ResizablePanel
                        defaultSize={20}
                        minSize={11}
                        className="bg-[#5E2C5F]"
                    >
                        <WorkspaceSidebar />
                        <div>
                            channels sidebar
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />


                    <ResizablePanel minSize={20}>
                        {children}
                    </ResizablePanel>
                    {showPanel && (
                        <>
                            <ResizableHandle withHandle />
                            <ResizablePanel minSize={20} defaultSize={29}>
                                {parentMessageId ? (
                                    <Thread
                                        messageId={parentMessageId as Id<"messages">}
                                        onClose={onClose}

                                    />
                                ) : (

                                    <div className="flex h-full items-center justify-center">
                                        <Loader className="size-5 animate-spin text-muted-foreground" />
                                    </div>

                                )}

                            </ResizablePanel>

                        </>

                    )}

                </ResizablePanelGroup>

            </div>


        </div>
    );



}
export default workspaceIdLayout;