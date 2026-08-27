import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useGetMentionCount = ({ workspaceId }: { workspaceId: Id<"workspaces"> }) => {
  return useQuery(api.mentions.getUnreadCount, { workspaceId }) ?? 0;
};
