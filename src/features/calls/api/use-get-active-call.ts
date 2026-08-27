import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useGetActiveCall = ({ workspaceId }: { workspaceId: Id<"workspaces"> }) => {
  return useQuery(api.calls.getActiveCall, { workspaceId });
};
