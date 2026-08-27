"use client";
import { Phone, PhoneOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface IncomingCallNotificationProps {
  callerName?: string;
  callerImage?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallNotification = ({
  callerName,
  callerImage,
  onAccept,
  onDecline,
}: IncomingCallNotificationProps) => {
  const avatarFallback = callerName?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#1a1d21] border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4 min-w-[280px] max-w-[320px]">
      <Avatar className="size-12 flex-shrink-0">
        <AvatarImage src={callerImage} />
        <AvatarFallback className="bg-purple-700 text-white text-lg">{avatarFallback}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{callerName ?? "Unknown"}</p>
        <p className="text-gray-400 text-xs animate-pulse">is calling...</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onAccept}
          className="size-10 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center transition-colors"
          title="Accept"
        >
          <Phone className="size-4 text-white" />
        </button>
        <button
          onClick={onDecline}
          className="size-10 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
          title="Decline"
        >
          <PhoneOff className="size-4 text-white" />
        </button>
      </div>
    </div>
  );
};
