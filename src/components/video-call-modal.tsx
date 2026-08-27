"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface VideoCallModalProps {
  callId: Id<"calls">;
  role: "caller" | "receiver";
  otherParty: { name?: string; image?: string };
  onClose: () => void;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

export const VideoCallModal = ({ callId, role, otherParty, onClose }: VideoCallModalProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const appliedCandidates = useRef<Set<string>>(new Set());
  const remoteDescSet = useRef(false);
  const pendingCandidates = useRef<string[]>([]);
  const offerCreated = useRef(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const callData = useQuery(api.calls.getCallById, { callId });
  const setOfferMutation = useMutation(api.calls.setOffer);
  const answerMutation = useMutation(api.calls.answer);
  const endMutation = useMutation(api.calls.end);
  const addIceMutation = useMutation(api.calls.addIceCandidate);

  const applyPendingCandidates = () => {
    const pc = pcRef.current;
    if (!pc || !remoteDescSet.current) return;
    for (const raw of pendingCandidates.current) {
      pc.addIceCandidate(new RTCIceCandidate(JSON.parse(raw))).catch(() => {});
    }
    pendingCandidates.current = [];
  };

  // Step 1: Setup local media + peer connection (once on mount)
  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
          setIsConnected(true);
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          addIceMutation({ callId, candidate: JSON.stringify(e.candidate.toJSON()), role });
        }
      };

      // Caller creates and stores the offer
      if (role === "caller" && !offerCreated.current) {
        offerCreated.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await setOfferMutation({ callId, offer: JSON.stringify(pc.localDescription) });
      }
    };

    setup().catch(console.error);

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2 (Receiver): Apply offer → create answer when offer arrives in Convex
  useEffect(() => {
    if (role !== "receiver" || !callData?.offer || !pcRef.current || remoteDescSet.current) return;
    remoteDescSet.current = true;

    const applyOffer = async () => {
      const pc = pcRef.current!;
      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(callData.offer!)));
      applyPendingCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await answerMutation({ callId, answer: JSON.stringify(pc.localDescription) });
    };

    applyOffer().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callData?.offer]);

  // Step 3 (Caller): Apply answer when it arrives in Convex
  useEffect(() => {
    if (role !== "caller" || !callData?.answer || !pcRef.current || remoteDescSet.current) return;
    if (pcRef.current.signalingState !== "have-local-offer") return;
    remoteDescSet.current = true;

    pcRef.current
      .setRemoteDescription(new RTCSessionDescription(JSON.parse(callData.answer)))
      .then(() => applyPendingCandidates())
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callData?.answer]);

  // Step 4: Apply remote ICE candidates (queue them if remote desc not set yet)
  useEffect(() => {
    if (!callData) return;
    const candidates = role === "caller"
      ? (callData.receiverCandidates ?? [])
      : (callData.callerCandidates ?? []);

    for (const raw of candidates) {
      if (appliedCandidates.current.has(raw)) continue;
      appliedCandidates.current.add(raw);

      if (!pcRef.current || !remoteDescSet.current) {
        pendingCandidates.current.push(raw);
      } else {
        pcRef.current.addIceCandidate(new RTCIceCandidate(JSON.parse(raw))).catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callData?.callerCandidates, callData?.receiverCandidates]);

  // Auto-close when call ends
  useEffect(() => {
    if (callData?.status === "ended" || callData?.status === "declined") {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      onClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callData?.status]);

  const handleEnd = async () => {
    await endMutation({ callId });
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    onClose();
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOff(c => !c);
  };

  const fallback = otherParty.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Avatar className="size-24">
              <AvatarImage src={otherParty.image} />
              <AvatarFallback className="text-3xl bg-purple-700 text-white">{fallback}</AvatarFallback>
            </Avatar>
            <p className="text-white text-xl font-semibold">{otherParty.name ?? "Unknown"}</p>
            <p className="text-gray-400 text-sm animate-pulse">
              {role === "caller" ? "Calling..." : "Connecting..."}
            </p>
          </div>
        )}

        <div className="absolute top-4 left-4 text-white text-sm font-medium drop-shadow">
          {otherParty.name}
        </div>

        {/* Local video PiP */}
        <div className="absolute bottom-24 right-4 w-36 h-28 rounded-xl overflow-hidden border-2 border-white/20 bg-gray-900 shadow-lg">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {isCameraOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="size-6 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/80 backdrop-blur-sm px-6 py-4 flex items-center justify-center gap-5">
        <button
          onClick={toggleMute}
          className={`size-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-red-600 hover:bg-red-700" : "bg-white/20 hover:bg-white/30"}`}
        >
          {isMuted ? <MicOff className="size-5 text-white" /> : <Mic className="size-5 text-white" />}
        </button>

        <button
          onClick={handleEnd}
          className="size-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
        >
          <PhoneOff className="size-6 text-white" />
        </button>

        <button
          onClick={toggleCamera}
          className={`size-12 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? "bg-red-600 hover:bg-red-700" : "bg-white/20 hover:bg-white/30"}`}
        >
          {isCameraOff ? <VideoOff className="size-5 text-white" /> : <Video className="size-5 text-white" />}
        </button>
      </div>
    </div>
  );
};
