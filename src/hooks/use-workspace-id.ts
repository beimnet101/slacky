import { useParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
export const useWorkspaceId = () => {



  const params = useParams();


  return params.workspaceId as Id<"workspaces">;
}