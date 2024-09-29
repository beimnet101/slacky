import { useParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
export const useChannelId = () => {


    const params = useParams();
    return params.channelId as Id<"channels">;
};