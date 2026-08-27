import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const useCreateCanvas = () => {
  const mutation = useMutation(api.canvases.create);
  return { mutate: mutation };
};
