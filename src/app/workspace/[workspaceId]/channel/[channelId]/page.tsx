
"use client"

import { useGetChannel } from "@/features/channels/api/use-get-channel";
import { useChannelId } from "@/hooks/use-channel-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Loader, TriangleAlert, Video } from "lucide-react";
import { Header } from "./header";
import { ChatInput } from "./chat-input";
import { useGetMessages } from "@/features/messages/api/use-get-messages";
import { MessageList } from "@/components/message-list";
import { useState, useEffect } from "react";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import { useMutation, useQuery } from "convex/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import dynamic from "next/dynamic";
import { useCurrentMember } from "@/features/members/api/use-current-member";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeConference = useQuery(api.activeConferences.getActive, { channelId });

  // Auto-join conference when ?join=1 is in the URL
  useEffect(() => {
    if (searchParams.get("join") === "1" && activeConference) {
      setInConference(true);
      // Remove the query param without re-render
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, activeConference]); // eslint-disable-line react-hooks/exhaustive-deps
  const startConference = useMutation(api.activeConferences.start);
  const endConference = useMutation(api.activeConferences.end);
  const createMessage = useMutation(api.messages.create);
  const { data: currentMember } = useCurrentMember({ workspaceId });

  const handleStartConference = async () => {
    await startConference({ channelId, workspaceId });
    setInConference(true);
    const joinUrl = `${window.location.origin}/workspace/${workspaceId}/channel/${channelId}?join=1`;
    const body = JSON.stringify({ ops: [{ insert: "📹 A video meeting has started.  " }, { insert: "Join meeting", attributes: { link: joinUrl } }, { insert: "\n" }] });
    await createMessage({ body, workspaceId, channelId }).catch(() => {});
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
        onStartConference={activeConference ? () => setInConference(true) : handleStartConference}
        hasActiveConference={!!activeConference}
        conferenceStartedBy={activeConference?.startedByName}
      />

      {/* Live conference banner */}
      {activeConference && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <div className="flex items-center gap-2">
              {/* Participant avatars */}
              <div className="flex -space-x-2">
                {(activeConference.participants ?? []).slice(0, 3).map((p, i) => (
                  <div
                    key={i}
                    className="size-6 rounded-full border-2 border-white bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden"
                    title={p.name}
                  >
                    {p.image
                      ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      : p.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {(activeConference.participants ?? []).length > 3 && (
                  <div className="size-6 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">
                    +{(activeConference.participants ?? []).length - 3}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-green-800">
                {inConference
                  ? `You're in the conference · ${activeConference.participants?.length ?? 1} participant${(activeConference.participants?.length ?? 1) !== 1 ? "s" : ""}`
                  : `${activeConference.startedByName} started a video conference · ${activeConference.participants?.length ?? 1} joined`}
              </span>
            </div>
          </div>
          {!inConference && (
            <button
              onClick={() => setInConference(true)}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
            >
              <Video className="size-3" />
              Join
            </button>
          )}
        </div>
      )}

      <MessageList
        channelName={channel.name}
        channelCreationTime={channel._creationTime}
        data={results}
        loadMore={loadMore}
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
        channelId={channelId}
      />
      <ChatInput placeholder={`Message # ${channel.name}`} />

      {inConference && currentUser && (
        <VideoConferenceModal
          roomName={`channel-${channelId}`}
          userName={currentUser.name ?? currentUser.email ?? "Member"}
          channelName={channel.name}
          channelId={channelId}
          workspaceId={workspaceId}
          onClose={handleLeaveConference}
        />
      )}
    </div>
  );
};

export default ChannelIdPage;
