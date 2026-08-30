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
  useConnectionState,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { ConnectionState } from "livekit-client";
import { Loader, Users, X } from "lucide-react";

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
  const connectionState = useConnectionState();

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1d21] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`size-2 rounded-full ${connectionState === ConnectionState.Connected ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
          <span className="text-white font-semibold text-sm">
            {channelName ? `# ${channelName}` : "Conference"}
          </span>
          {connectionState !== ConnectionState.Connected && (
            <span className="text-xs text-yellow-400">Connecting...</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users className="size-4" />
            <span>{participants.length} participant{participants.length !== 1 ? "s" : ""}</span>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-hidden p-3">
        <GridLayout tracks={tracks} style={{ height: "100%" }}>
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
  const [leftIntentionally, setLeftIntentionally] = useState(false);
  const getToken = useAction(api.conferences.getToken);
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  useEffect(() => {
    if (!livekitUrl) {
      setError("LiveKit URL not configured — add NEXT_PUBLIC_LIVEKIT_URL to Vercel environment variables.");
      return;
    }
    getToken({ roomName, participantName: userName })
      .then(setToken)
      .catch(() => setError("Failed to get conference token. Check LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Convex."));
  }, [roomName, userName]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLeave = () => {
    setLeftIntentionally(true);
    onClose();
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1a1d21] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1a1d21] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
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
      onDisconnected={() => { if (leftIntentionally) onClose(); }}
      onError={(err) => setError(`Connection failed: ${err.message}. Make sure NEXT_PUBLIC_LIVEKIT_URL is set in Vercel.`)}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
    >
      <ConferenceRoom channelName={channelName} onClose={handleLeave} />
    </LiveKitRoom>
  );
};
