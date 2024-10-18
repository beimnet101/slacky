/*import { api } from "../../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";

type RequestType = {
  id: Id<"privateChannels">; // The ID of the private channel
  newName: string;           // The new name for the private channel
};

type ResponseType =  Id<"privateChannels"> | null; // Update the response type as per your needs

type Options = {
  onSuccess?: (data: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
};

export const useUpdatePrivateChannel = () => {
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null);
  const [data, setData] = useState<ResponseType>(null);

  const mutation = useMutation(api.privatechannel.updatePrivateChannel); // Ensure this matches the API

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

        setData(response); // Save the response data

        // Call onSuccess callback if provided in options
        options?.onSuccess?.(response);
        return response;
      } catch (error) {
        setError(error as Error);
        setStatus("error");

        options?.onError?.(error as Error);

        // Call onError callback if provided in options
        if (options?.throwError) {
          throw error;
        }
      } finally {
        setStatus("settled");

        options?.onSettled?.(); // Call onSettled callback regardless of success or error
      }
    },
    [mutation]
  );

  return { mutate, data, error, isPending, isError, isSuccess, isSettled };
};
*/