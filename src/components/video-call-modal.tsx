"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Monitor } from "lucide-react";

interface VideoCallModalProps {
  callId: Id<"calls">;
  role: "caller" | "receiver";
  otherParty: { name?: string; image?: string };
  onClose: () => void;
}

const FALLBACK_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const VideoCallModal = ({ callId, role, otherParty, onClose }: VideoCallModalProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const appliedCandidates = useRef<Set<string>>(new Set());
  const remoteDescSet = useRef(false);
  const pendingCandidates = useRef<string[]>([]);

  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [iceState, setIceState] = useState<RTCIceConnectionState>("new");
  // pcReady becomes true after PC is created — used as effect dependency
  // so signaling effects re-fire once the PC exists
  const [pcReady, setPcReady] = useState(false);

  const callData = useQuery(api.calls.getCallById, { callId });
  const getIceServersAction = useAction(api.calls.getIceServers);
  const setOfferMutation = useMutation(api.calls.setOffer);
  const answerMutation = useMutation(api.calls.answer);
  const endMutation = useMutation(api.calls.end);
  const addIceMutation = useMutation(api.calls.addIceCandidate);

  /** Apply any candidates that arrived before remote description was set */
  const flushPending = () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const raw of pendingCandidates.current) {
      pc.addIceCandidate(new RTCIceCandidate(JSON.parse(raw))).catch(() => {});
    }
    pendingCandidates.current = [];
  };

  // ─── Step 1: Get media + create PC (fetches ICE servers first) ──────────
  useEffect(() => {
    let alive = true;

    (async () => {
      const [stream, servers] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }),
        getIceServersAction({}).catch(() => FALLBACK_ICE_SERVERS),
      ]);
      if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: servers });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
          setIsConnected(true);
        }
      };

      pc.oniceconnectionstatechange = () => {
        setIceState(pc.iceConnectionState);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          addIceMutation({ callId, candidate: JSON.stringify(e.candidate.toJSON()), role });
        }
      };

      if (role === "caller") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        // Store the offer in Convex so receiver can pick it up
        await setOfferMutation({ callId, offer: JSON.stringify(pc.localDescription) });
      }

      // Signal to signaling effects that the PC is now ready
      if (alive) setPcReady(true);
    })().catch(console.error);

    return () => {
      alive = false;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Step 2 (Receiver): Apply offer → create & store answer ───────────────
  // Depends on BOTH callData.offer AND pcReady so it fires correctly even if
  // the offer was already in Convex before the PC finished being created.
  useEffect(() => {
    if (
      role !== "receiver" ||
      !callData?.offer ||
      !pcReady ||
      !pcRef.current ||
      remoteDescSet.current
    ) return;

    remoteDescSet.current = true;

    (async () => {
      const pc = pcRef.current!;
      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(callData.offer!)));
      flushPending();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await answerMutation({ callId, answer: JSON.stringify(pc.localDescription) });
    })().catch(console.error);
  }, [callData?.offer, pcReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Step 3 (Caller): Apply answer when receiver stores it ────────────────
  // Same pattern — depend on pcReady so it retries if answer arrived first.
  useEffect(() => {
    if (
      role !== "caller" ||
      !callData?.answer ||
      !pcReady ||
      !pcRef.current ||
      remoteDescSet.current
    ) return;
    if (pcRef.current.signalingState !== "have-local-offer") return;

    remoteDescSet.current = true;
    pcRef.current
      .setRemoteDescription(new RTCSessionDescription(JSON.parse(callData.answer)))
      .then(() => flushPending())
      .catch(console.error);
  }, [callData?.answer, pcReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Step 4: Apply remote ICE candidates ──────────────────────────────────
  useEffect(() => {
    if (!callData || !pcReady) return;
    const candidates =
      role === "caller"
        ? (callData.receiverCandidates ?? [])
        : (callData.callerCandidates ?? []);

    for (const raw of candidates) {
      if (appliedCandidates.current.has(raw)) continue;
      appliedCandidates.current.add(raw);

      if (!remoteDescSet.current) {
        // Queue until remote description is set
        pendingCandidates.current.push(raw);
      } else {
        pcRef.current
          ?.addIceCandidate(new RTCIceCandidate(JSON.parse(raw)))
          .catch(() => {});
      }
    }
  }, [callData?.callerCandidates, callData?.receiverCandidates, pcReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-close when call ends ────────────────────────────────────────────
  useEffect(() => {
    if (callData?.status === "ended" || callData?.status === "declined") {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      onClose();
    }
  }, [callData?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isConnected]);

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const toggleScreenShare = async () => {
    const pc = pcRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      screenTrackRef.current?.stop();
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        await sender?.replaceTrack(cameraTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        await sender?.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
        screenTrack.onended = () => {
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack) {
            const s = pc.getSenders().find(s => s.track?.kind === "video");
            s?.replaceTrack(camTrack);
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
          }
          setIsScreenSharing(false);
        };
      } catch {
        // user cancelled or permission denied
      }
    }
  };

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
      {/* Remote video */}
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
              {iceState === "failed" ? "Connection failed" :
               iceState === "disconnected" ? "Reconnecting..." :
               role === "caller" ? "Calling..." : "Connecting..."}
            </p>
          </div>
        )}

        <div className="absolute top-4 left-4 text-white text-sm font-medium drop-shadow">
          {otherParty.name}
        </div>

        {isConnected && (
          <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-2 py-1 rounded-full font-mono">
            {formatDuration(callDuration)}
          </div>
        )}

        {/* Local PiP */}
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
          className={`size-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-red-600 hover:bg-red-700" : "bg-white/20 hover:bg-white/30"
          }`}
        >
          {isMuted ? <MicOff className="size-5 text-white" /> : <Mic className="size-5 text-white" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`size-12 rounded-full flex items-center justify-center transition-colors ${
            isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : "bg-white/20 hover:bg-white/30"
          }`}
        >
          <Monitor className="size-5 text-white" />
        </button>

        <button
          onClick={handleEnd}
          className="size-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
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
