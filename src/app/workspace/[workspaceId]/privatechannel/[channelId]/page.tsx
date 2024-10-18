/*
"use client"
import { useGetChannel } from "@/features/channels/api/use-get-channel";
import { useChannelId } from "@/hooks/use-channel-id";
import { Loader, TriangleAlert } from "lucide-react";
import { Header } from "./header";
import { ChatInput } from "./chat-input";
import { useGetMessages } from "@/features/messages/api/use-get-messages";
import { MessageList } from "@/components/message-list";
import { usePrivateChannelId } from "@/hooks/use-get-private-channel-id";




const ChannelIdPage = () => {

     const channelId = usePrivateChannelId();
     const { results, status, loadMore } = useGetMessages({ channelId });
     console.log({ results });

     const { data: channel, isLoading: channelLoading } = usePrivateChannelId({ id: channelId });
     if (channelLoading || status === "LoadingFirstPage") {

          return (
               <div className="h-full flex-1 flex items-center justify-center" >
                    <Loader className="animate-spin size-5 text-muted-foreground" />

               </div>
          )
     }


     if (!channel) {

          return (
               <div className="h-full flex-1 flex flex-col  gap-y-2  items-center justify-center" >
                    <TriangleAlert className="size-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground"> channel not found</span>
               </div>
          )
     }


     return (

          <div className="flex flex-col h-full">
               <Header title={channel.name} />
               <MessageList
                    channelName={channel.name}
                    channelCreationTime={channel._creationTime}
                    data={results}
                    loadMore={loadMore}
                    isLoadingMore={status === "LoadingMore"}
                    canLoadMore={status === "CanLoadMore"}
               />
               <ChatInput placeholder={`Message # ${channel.name}`} />
          </div>
     );

}
export default ChannelIdPage;*/