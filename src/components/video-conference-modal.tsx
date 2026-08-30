"use client";
import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  ControlBar,
  useParticipants,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Loader, Users } from "lucide-react";

interface VideoConferenceModalProps {
  roomName: string;
  userName: string;
  channelName?: string;
  onClose: () => void;
}

function ConferenceRoom({ channelName, onClose }: { channelName?: string; onClose: () => void }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  const participants = useParticipants();

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1d21] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white font-semibold text-sm">
            {channelName ? `# ${channelName}` : "Conference"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Users className="size-4" />
          <span>{participants.length} participant{participants.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-hidden p-3">
        <GridLayout
          tracks={tracks}
          style={{ height: "100%" }}
        >
          <ParticipantTile />
        </GridLayout>
      </div>

      {/* Audio renderer (hidden) */}
      <RoomAudioRenderer />

      {/* Controls */}
      <div className="border-t border-white/10 py-3 flex items-center justify-center">
        <ControlBar
          variation="minimal"
          controls={{
            microphone: true,
            camera: true,
            screenShare: true,
            leave: true,
            chat: false,
          }}
          onLeave={onClose}
        />
      </div>
    </div>
  );
}

export const VideoConferenceModal = ({
  roomName,
  userName,
  channelName,
  onClose,
}: VideoConferenceModalProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const getToken = useAction(api.conferences.getToken);
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

  useEffect(() => {
    getToken({ roomName, participantName: userName })
      .then(setToken)
      .catch(() => setError("Failed to join conference"));
  }, [roomName, userName]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1a1d21] flex items-center justify-center">
        <div className="text-center text-white space-y-3">
          <p className="text-red-400">{error}</p>
          <button onClick={onClose} className="text-sm underline text-gray-400">Close</button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1a1d21] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader className="size-8 animate-spin text-purple-400" />
          <p className="text-sm text-gray-400">Joining conference...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={livekitUrl}
      onDisconnected={onClose}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
    >
      <ConferenceRoom channelName={channelName} onClose={onClose} />
    </LiveKitRoom>
  );
};
