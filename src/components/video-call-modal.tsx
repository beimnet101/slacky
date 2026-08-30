"use client";
import { useEffect, useRef, useState, useCallback } from "react";
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
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [iceState, setIceState] = useState<RTCIceConnectionState>("new");
  const [pcReady, setPcReady] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const callData = useQuery(api.calls.getCallById, { callId });
  const getIceServersAction = useAction(api.calls.getIceServers);
  const setOfferMutation = useMutation(api.calls.setOffer);
  const answerMutation = useMutation(api.calls.answer);
  const endMutation = useMutation(api.calls.end);
  const addIceMutation = useMutation(api.calls.addIceCandidate);

  /** Reveal controls and restart the hide timer */
  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  // Start hide timer once connected
  useEffect(() => {
    if (isConnected) {
      revealControls();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isConnected, revealControls]);

  /** Apply any candidates that arrived before remote description was set */
  const flushPending = () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const raw of pendingCandidates.current) {
      pc.addIceCandidate(new RTCIceCandidate(JSON.parse(raw))).catch(() => {});
    }
    pendingCandidates.current = [];
  };

  // ─── Step 1: Get media + create PC ──────────────────────────────────────────
  useEffect(() => {
    let alive = true;

    (async () => {
      const [stream, servers] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }),
        getIceServersAction({}).catch(() => FALLBACK_ICE_SERVERS),
      ]);
      if (!alive) { stream.getTracks().forEach((t: MediaStreamTrack) => t.stop()); return; }

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: servers });
      pcRef.current = pc;

      stream.getTracks().forEach((track: MediaStreamTrack) => pc.addTrack(track, stream));

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
        await setOfferMutation({ callId, offer: JSON.stringify(pc.localDescription) });
      }

      if (alive) setPcReady(true);
    })().catch(console.error);

    return () => {
      alive = false;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Step 2 (Receiver): Apply offer → create & store answer ─────────────────
  useEffect(() => {
    if (role !== "receiver" || !callData?.offer || !pcReady || !pcRef.current || remoteDescSet.current) return;
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

  // ─── Step 3 (Caller): Apply answer ──────────────────────────────────────────
  useEffect(() => {
    if (role !== "caller" || !callData?.answer || !pcReady || !pcRef.current || remoteDescSet.current) return;
    if (pcRef.current.signalingState !== "have-local-offer") return;
    remoteDescSet.current = true;
    pcRef.current
      .setRemoteDescription(new RTCSessionDescription(JSON.parse(callData.answer)))
      .then(() => flushPending())
      .catch(console.error);
  }, [callData?.answer, pcReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Step 4: Apply remote ICE candidates ────────────────────────────────────
  useEffect(() => {
    if (!callData || !pcReady) return;
    const candidates = role === "caller"
      ? (callData.receiverCandidates ?? [])
      : (callData.callerCandidates ?? []);

    for (const raw of candidates) {
      if (appliedCandidates.current.has(raw)) continue;
      appliedCandidates.current.add(raw);
      if (!remoteDescSet.current) {
        pendingCandidates.current.push(raw);
      } else {
        pcRef.current?.addIceCandidate(new RTCIceCandidate(JSON.parse(raw))).catch(() => {});
      }
    }
  }, [callData?.callerCandidates, callData?.receiverCandidates, pcReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-close when call ends ──────────────────────────────────────────────
  useEffect(() => {
    if (callData?.status === "ended" || callData?.status === "declined") {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      onClose();
    }
  }, [callData?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Call duration timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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
    <div
      className="fixed inset-0 z-50 bg-black select-none"
      onClick={revealControls}
    >
      {/* Remote video — truly fills the whole screen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Calling / connecting overlay */}
      {!isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60">
          <Avatar className="size-24">
            <AvatarImage src={otherParty.image} />
            <AvatarFallback className="text-3xl bg-purple-700 text-white">{fallback}</AvatarFallback>
          </Avatar>
          <p className="text-white text-xl font-semibold">{otherParty.name ?? "Unknown"}</p>
          <p className="text-gray-300 text-sm animate-pulse">
            {iceState === "failed" ? "Connection failed" :
             iceState === "disconnected" ? "Reconnecting..." :
             role === "caller" ? "Calling..." : "Connecting..."}
          </p>
        </div>
      )}

      {/* Top bar — name + timer, always visible */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <span className="text-white font-semibold drop-shadow">{otherParty.name}</span>
        {isConnected && (
          <span className="bg-black/50 text-white text-sm px-2 py-1 rounded-full font-mono">
            {formatDuration(callDuration)}
          </span>
        )}
      </div>

      {/* Local PiP — bottom-right, sits above controls */}
      <div className="absolute bottom-32 right-4 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/30 bg-gray-900 shadow-xl">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {isCameraOff && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <VideoOff className="size-6 text-gray-400" />
          </div>
        )}
        <div className="absolute bottom-1.5 left-0 right-0 text-center">
          <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">You</span>
        </div>
      </div>

      {/* Controls — overlay at bottom, auto-hide after 4s */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        <div className="bg-gradient-to-t from-black/80 to-transparent pt-10 pb-8 flex items-center justify-center gap-5">
          <button
            onClick={(e) => { e.stopPropagation(); toggleMute(); revealControls(); }}
            className={`size-14 rounded-full flex items-center justify-center transition-colors shadow-md ${
              isMuted ? "bg-red-600 hover:bg-red-700" : "bg-white/25 hover:bg-white/40"
            }`}
          >
            {isMuted ? <MicOff className="size-6 text-white" /> : <Mic className="size-6 text-white" />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); toggleScreenShare(); revealControls(); }}
            className={`size-14 rounded-full flex items-center justify-center transition-colors shadow-md ${
              isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : "bg-white/25 hover:bg-white/40"
            }`}
          >
            <Monitor className="size-6 text-white" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleEnd(); }}
            className="size-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-xl"
          >
            <PhoneOff className="size-7 text-white" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); toggleCamera(); revealControls(); }}
            className={`size-14 rounded-full flex items-center justify-center transition-colors shadow-md ${
              isCameraOff ? "bg-red-600 hover:bg-red-700" : "bg-white/25 hover:bg-white/40"
            }`}
          >
            {isCameraOff ? <VideoOff className="size-6 text-white" /> : <Video className="size-6 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
};
