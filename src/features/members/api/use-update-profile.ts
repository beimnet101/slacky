import { api } from "../../../../convex/_generated/api"; // Adjust the path as necessary
import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";

type RequestType = {
  id: Id<"users">;    // User ID
  name: string;       // Name to update
  imageId: Id<"_storage">; // Expecting a storage ID for the image
};

type ResponseType = {
  id: Id<"users">;    // The ID of the updated user
  imageUrl: string  // Image URL after the update
};

type Options = {
  onSuccess?: (data: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
};

export const useUpdateProfile = () => {
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null);
  const [data, setData] = useState<ResponseType | null>(null);
  const mutation = useMutation(api.users.updateProfile);

  const isPending = useMemo(() => status === "pending", [status]);
  const isSuccess = useMemo(() => status === "success", [status]);
  const isError = useMemo(() => status === "error", [status]);
  const isSettled = useMemo(() => status === "settled", [status]);

  const mutate = useCallback(
    async (values: RequestType, options?: Options) => {
      try {
        setData(null);
        setError(null);
        setStatus("pending");

        const response = await mutation(values);

        // Check if response is not null before calling onSuccess
        if (response) {
          setStatus("success");
          setData(response);

          // Call onSuccess only if response is valid
          if (options?.onSuccess) {
            options.onSuccess(response);
          }
        }

        return response;
      } catch (error) {
        setError(error as Error);
        setStatus("error");

        if (options?.onError) options.onError(error as Error);
        if (options?.throwError) throw error;
      } finally {
        setStatus("settled");
        if (options?.onSettled) options.onSettled();
      }
    },
    [mutation]
  );


  return { mutate, data, error, isPending, isSuccess, isError, isSettled };
};
