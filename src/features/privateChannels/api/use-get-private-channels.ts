/*import { useQuery } from "convex/react";
import{api} from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetChannelsProps{
workspaceId:Id<"workspaces">;

};
 export const useGetPrivateChannels=({
    workspaceId
 }:UseGetChannelsProps)=>{


 const data=useQuery(api.privatechannel.getPrivateChannels,{workspaceId});
 const isLoading=data===undefined;
 return {data ,isLoading};
 };*/