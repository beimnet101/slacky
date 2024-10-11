import { api } from "../../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { useCallback, useMemo } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
type RequestType = {
  id: Id<"members">;
  role: "admin" | "member";
}
type ResponseType = Id<"members"> | null;
type Options = {
  onSuccess?: (data: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;


};


export const useUpdateMember = () => {
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null);
  const [data, setData] = useState<ResponseType>(null);
  const mutation = useMutation(api.members.update);
  const isPending = useMemo(() => status === "pending", [status]);
  const isSuccess = useMemo(() => status === "success", [status]);
  const isError = useMemo(() => status === "error", [status]);
  const isSettled = useMemo(() => status === "settled", [status]);
  const mutate = useCallback(async (values: RequestType, options?: Options) => {
    try {
      setData(null);
      setError(null);
      setStatus("pending");

      const response = await mutation(values);

      // Call onSuccess callback if provided in options
      options?.onSuccess?.(response);
      return response
    } catch (error) {
      options?.onError?.(error as Error);

      // Call onError callback if provided in options
      if (options?.throwError) {
        throw error;
      }
    } finally {
      setStatus("settled");

      options?.onSettled?.();

      // Call onSettled callback regardless of success or error

    }
  }, [mutation]);

  return { mutate, data, error, isPending, isError, isSuccess, isSettled };
};

