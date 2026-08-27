import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useGetMentions = ({ workspaceId }: { workspaceId: Id<"workspaces"> }) => {
  const data = useQuery(api.mentions.list, { workspaceId });
  return { data: data ?? [], isLoading: data === undefined };
};
