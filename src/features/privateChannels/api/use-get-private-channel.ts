/*import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetChannelProps {
   id: Id<"privateChannels">;

};
export const useGetPrivateChannel = ({
   id
}: UseGetChannelProps) => {


   const data = useQuery(api.privatechannel.getPrivateChannelById, { id });
   const isLoading = data === undefined;
   return { data, isLoading };
};*/