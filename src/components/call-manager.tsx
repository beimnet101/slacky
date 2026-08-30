"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useGetActiveCall } from "@/features/calls/api/use-get-active-call";
import { VideoCallModal } from "./video-call-modal";
import { IncomingCallNotification } from "./incoming-call-notification";

interface CallManagerProps {
  workspaceId: Id<"workspaces">;
}

export const CallManager = ({ workspaceId }: CallManagerProps) => {
  const [accepted, setAccepted] = useState(false);
  const activeCall = useGetActiveCall({ workspaceId });
  const declineMutation = useMutation(api.calls.decline);
  const endMutation = useMutation(api.calls.end);

  // undefined = still loading (don't reset state), null = no active call
  if (activeCall === undefined) return null;
  if (activeCall === null) {
    if (accepted) setAccepted(false);
    return null;
  }

  const otherParty = {
    name: activeCall.otherParty.name ?? undefined,
    image: activeCall.otherParty.image ?? undefined,
  };

  // Show video modal for: caller (ringing/active), receiver who accepted, or any active call
  const showVideoModal =
    activeCall.role === "caller" ||
    activeCall.status === "active" ||
    (activeCall.role === "receiver" && accepted);

  if (showVideoModal) {
    return (
      <VideoCallModal
        callId={activeCall._id}
        role={activeCall.role}
        otherParty={otherParty}
        onClose={() => {
          endMutation({ callId: activeCall._id });
          setAccepted(false);
        }}
      />
    );
  }

  // Show incoming call notification for receiver who hasn't accepted yet
  if (activeCall.role === "receiver" && activeCall.status === "ringing" && !accepted) {
    return (
      <IncomingCallNotification
        callerName={otherParty.name}
        callerImage={otherParty.image}
        onAccept={() => setAccepted(true)}
        onDecline={async () => {
          await declineMutation({ callId: activeCall._id });
          setAccepted(false);
        }}
      />
    );
  }

  return null;
};
