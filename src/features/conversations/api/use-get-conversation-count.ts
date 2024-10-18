import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api"; // Adjust path as necessary
import { Id } from "../../../../convex/_generated/dataModel";

// Define the props for the hook
interface UseGetMessagesCountForMemberProps {
  workspaceId: Id<"workspaces">; // ID of the workspace
  memberId: Id<"members">;       // ID of the member for whom to count messages
}

// Custom hook to fetch the count of messages for a specific member in a workspace
export const useMessageCount = ({
  workspaceId,
  memberId,
}: UseGetMessagesCountForMemberProps) => {
  // Fetch the total message count for the specified member in the workspace
  const messageCount = useQuery(api.messages.countMessagesInMemberConversations, {
    workspaceId,
    memberId,
  });

  
   return messageCount; // Total message count
  
};
