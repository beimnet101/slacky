import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useGetCanvases = ({ workspaceId }: { workspaceId: Id<"workspaces"> }) => {
  const data = useQuery(api.canvases.list, { workspaceId });
  return { data, isLoading: data === undefined };
};
