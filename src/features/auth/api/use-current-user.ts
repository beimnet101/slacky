import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
 export const useCurrentUser = () => {
    const data = useQuery(api.users.current); // Make sure this call is present
    const isLoading = data === undefined;

    return { data, isLoading };
    
};



