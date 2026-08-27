"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface VideoCallModalProps {
  callId: Id<"calls">;
  role: "caller" | "receiver";
  otherParty: { name?: string; image?: string };
  onClose: () => void;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const VideoCallModal = ({ callId, role, otherParty, onClose }: VideoCallModalProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const appliedCandidatesRef = useRef<Set<string>>(new Set());

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const callData = useQuery(api.calls.getCallById, { callId });
  const answerMutation = useMutation(api.calls.answer);
  const endMutation = useMutation(api.calls.end);
  const addIceCandidate = useMutation(api.calls.addIceCandidate);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
  }, []);

  const handleEnd = useCallback(async () => {
    await endMutation({ callId });
    cleanup();
    onClose();
  }, [callId, endMutation, cleanup, onClose]);

  useEffect(() => {
    if (!callData) return;
    if (callData.status === "ended" || callData.status === "declined") {
      cleanup();
      onClose();
    }
  }, [callData?.status, cleanup, onClose]);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsConnected(true);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addIceCandidate({
            callId,
            candidate: JSON.stringify(event.candidate),
            role,
          });
        }
      };

      if (role === "caller") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        // offer is already stored in Convex via initiate mutation
      } else {
        // receiver: apply offer then answer
        if (callData?.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(callData.offer)));
          const answerDesc = await pc.createAnswer();
          await pc.setLocalDescription(answerDesc);
          await answerMutation({ callId, answer: JSON.stringify(answerDesc) });
        }
      }
    };

    start().catch(console.error);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, callId]);

  // Apply answer for caller when it arrives
  useEffect(() => {
    if (role !== "caller" || !callData?.answer || !pcRef.current) return;
    const pc = pcRef.current;
    if (pc.signalingState === "have-local-offer") {
      pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(callData.answer))).catch(console.error);
    }
  }, [role, callData?.answer]);

  // Apply ICE candidates
  useEffect(() => {
    if (!pcRef.current || !callData) return;
    const pc = pcRef.current;
    const candidates = role === "caller"
      ? callData.receiverCandidates ?? []
      : callData.callerCandidates ?? [];

    for (const raw of candidates) {
      if (appliedCandidatesRef.current.has(raw)) continue;
      appliedCandidatesRef.current.add(raw);
      try {
        pc.addIceCandidate(new RTCIceCandidate(JSON.parse(raw))).catch(console.error);
      } catch {}
    }
  }, [role, callData?.callerCandidates, callData?.receiverCandidates]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((m) => !m);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOff((c) => !c);
  };

  const avatarFallback = otherParty.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Remote video */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Avatar className="size-24">
              <AvatarImage src={otherParty.image} />
              <AvatarFallback className="text-3xl bg-purple-700 text-white">{avatarFallback}</AvatarFallback>
            </Avatar>
            <p className="text-white text-xl font-semibold">{otherParty.name ?? "Unknown"}</p>
            <p className="text-gray-400 text-sm animate-pulse">
              {role === "caller" ? "Calling..." : "Connecting..."}
            </p>
          </div>
        )}

        {/* Other party name overlay */}
        <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1.5">
          <p className="text-white text-sm font-medium">{otherParty.name ?? "Unknown"}</p>
        </div>

        {/* Local video (PiP) */}
        <div className="absolute bottom-24 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/20 bg-gray-900">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isCameraOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="size-6 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/80 backdrop-blur-sm px-6 py-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`size-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-red-600 hover:bg-red-700" : "bg-white/20 hover:bg-white/30"
          }`}
        >
          {isMuted ? <MicOff className="size-5 text-white" /> : <Mic className="size-5 text-white" />}
        </button>

        <button
          onClick={handleEnd}
          className="size-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
        >
          <PhoneOff className="size-6 text-white" />
        </button>

        <button
          onClick={toggleCamera}
          className={`size-12 rounded-full flex items-center justify-center transition-colors ${
            isCameraOff ? "bg-red-600 hover:bg-red-700" : "bg-white/20 hover:bg-white/30"
          }`}
        >
          {isCameraOff ? <VideoOff className="size-5 text-white" /> : <Video className="size-5 text-white" />}
        </button>
      </div>
    </div>
  );
};
