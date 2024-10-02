import {useQuery} from "convex/react";
import{ api} from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface useGetWorkSpaceProps{

    id:Id<"workspaces">
}

// Define your query
 export const useGetWorkSpaceInfo=({id}:useGetWorkSpaceProps)=>{
 const data=useQuery(api.workspaces.getInfoById,{id});
 const isLoading=data===undefined;
 return{ data, isLoading};

 }