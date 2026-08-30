
"use client"

import { useGetChannel } from "@/features/channels/api/use-get-channel";
import { useChannelId } from "@/hooks/use-channel-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Loader, TriangleAlert, Video, Users } from "lucide-react";
import { Header } from "./header";
import { ChatInput } from "./chat-input";
import { useGetMessages } from "@/features/messages/api/use-get-messages";
import { MessageList } from "@/components/message-list";
import { useState } from "react";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import dynamic from "next/dynamic";

const VideoConferenceModal = dynamic(
  () => import("@/components/video-conference-modal").then(m => m.VideoConferenceModal),
  { ssr: false }
);

const ChannelIdPage = () => {
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  const { results, status, loadMore } = useGetMessages({ channelId });
  const { data: channel, isLoading: channelLoading } = useGetChannel({ id: channelId });
  const { data: currentUser } = useCurrentUser();
  const [inConference, setInConference] = useState(false);

  const activeConference = useQuery(api.conferences.getActive, { channelId });
  const startConference = useMutation(api.conferences.start);
  const endConference = useMutation(api.conferences.end);

  const handleStartConference = async () => {
    await startConference({ channelId, workspaceId });
    setInConference(true);
  };

  const handleLeaveConference = async () => {
    setInConference(false);
    // Only delete the record if this user started it
    if (activeConference) {
      await endConference({ channelId });
    }
  };

  if (channelLoading || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex-1 flex items-center justify-center">
        <Loader className="animate-spin size-5 text-muted-foreground" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="h-full flex-1 flex flex-col gap-y-2 items-center justify-center">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">channel not found</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title={channel.name}
        onStartConference={handleStartConference}
      />

      {/* Live conference banner */}
      {activeConference && !inConference && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-800">
              {activeConference.startedByName} started a video conference
            </span>
          </div>
          <button
            onClick={() => setInConference(true)}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          >
            <Video className="size-3" />
            Join
          </button>
        </div>
      )}

      {activeConference && inConference && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-800">You are in a live conference</span>
        </div>
      )}

      <MessageList
        channelName={channel.name}
        channelCreationTime={channel._creationTime}
        data={results}
        loadMore={loadMore}
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
      />
      <ChatInput placeholder={`Message # ${channel.name}`} />

      {inConference && currentUser && (
        <VideoConferenceModal
          roomName={`channel-${channelId}`}
          userName={currentUser.name ?? currentUser.email ?? "Member"}
          channelName={channel.name}
          onClose={handleLeaveConference}
        />
      )}
    </div>
  );
};

export default ChannelIdPage;
