/*import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreatePrivateChannelModal } from "../store/use-create-private-channel-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCreatePrivateChannel } from "../api/use-create-private-channel"; // Correct mutation hook
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAddMemberToChannel } from "@/features/private-member/use-add-private-member"; // Import the custom hook

interface User {
  id: string;
  name: string;
}

interface CreatePrivateChannelModalProps {
  users: User[]; // Receive the list of users as a prop
}

// Custom hook to get memberId from URL parameters
export const usePrivateChannelMemberId = () => {
  const params = useParams();
  return params.memberId as Id<"privateChannelMembers">;
};

export const CreatePrivateChannelModal = ({ users }: CreatePrivateChannelModalProps) => {
  const router = useRouter();
  const [open, setOpen] = useCreatePrivateChannelModal();
  const workspaceId = useWorkspaceId();
  const { mutate: createChannel, isPending } = useCreatePrivateChannel();
  const { mutate: addMember, isPending: isAddingMember } = useAddMemberToChannel(); // Use the hook
  const [name, setName] = useState("");
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([]); // State for authorized users
  const memberId = usePrivateChannelMemberId(); // Retrieve memberId from the hook

  const handleClose = () => {
    setName("");
    setAuthorizedUsers([]); // Reset authorized users
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "-").toLowerCase();
    setName(value);
  };

  const handleUserSelection = (userId: string) => {
    setAuthorizedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || authorizedUsers.length === 0) {
      toast.error("Please provide a channel name and select users");
      return;
    }

    // Call the mutation to create the private channel
    try {
      const channelId = await createChannel({
        name, // Name of the channel
        workspaceId, // Current workspace ID
      });

      // Insert authorized users into the privateChannelMembers table
      await Promise.all(
        authorizedUsers.map((userId) =>
          addMember({
            channelId,
            memberId, // Ensure this is defined
            userId, // Selected user ID
          })
        )
      );

      toast.success("Private channel created");
      router.push(`/workspace/${workspaceId}/private-channel/${channelId}`);
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create private channel");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white rounded-lg shadow-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create a Private Channel</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            disabled={isPending}
            onChange={handleChange}
            required
            autoFocus
            minLength={3}
            maxLength={80}
            placeholder="e.g., plan-budget"
            className="border border-gray-300 rounded-md p-2"
          />

          <div>
            <h3 className="text-lg font-medium">Select Members:</h3>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-gray-500">No users available</p>
              ) : (
                users.map((user) => (
                  <label key={user.id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={authorizedUsers.includes(user.id)}
                      onChange={() => handleUserSelection(user.id)}
                    />
                    <span className="text-gray-700">{user.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || name.length < 3 || isAddingMember}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isPending || isAddingMember ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
*/