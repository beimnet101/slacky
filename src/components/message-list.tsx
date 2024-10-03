import { GetMessagesReturnType } from "@/features/messages/api/use-get-messages";
import { format, formatDate, isToday, isYesterday } from "date-fns";

interface MessageListProps {
    memberName?: string;
    memberImage?: string;
    channalName?: string;
    channelCreationTime?: number;
    variant?: "channel" | "thread" | "conversation";
    data: GetMessagesReturnType | undefined;
    loadMore: () => void;
    isLoadingMore: boolean;
    canLoadMore: boolean;
};


const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
        return "Today";
    }
    if (isYesterday(date)) {
        return "Yesterday";
    }
    return format(date, "EEEE,MMMM,d");


}


export const MessageList = ({

    memberName,
    memberImage,
    channalName,
    channelCreationTime,
    variant = "channel",
    data,
    loadMore,
    isLoadingMore,
    canLoadMore,

}: MessageListProps) => {
    const groupedMessage = data?.reduce(
        (groups, messages) => {
            const date = new Date(messages._creationTime);
            const dataKey = format(date, "yyyy-MM-dd");
            if (!groups[dataKey]) {
                groups[dataKey] = []
            }
            groups[dataKey].unshift(messages);
            return groups;


        }, {} as Record<string, typeof data>
    )
    return (
        <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
            {Object.entries(groupedMessage || {}).map(([datekey, messages]) => (
                <div key={datekey}>
                    <div className="text-center my-2 relative">
                        {/* Separator line */}
                        <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                        {/* Date label */}
                        <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                            {formatDateLabel(datekey)}
                        </span>
                    </div>

                    {messages.map((message, index) => (
                        <div key={message._id}>
                            {JSON.stringify(message)}

                           
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}