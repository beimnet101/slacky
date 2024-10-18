
"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEditProfileModal } from "../store/use-edit-profile-modal";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import { useUpdateProfile } from "../api/use-update-profile";
import { Id } from "../../../../../convex/_generated/dataModel";

export const EditProfileModal = () => {
  const [open, setOpen] = useEditProfileModal();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  const { mutate: updateProfile, isPending: updateProfilePending } = useUpdateProfile();
  const [name, setName] = useState<string>("");
  const [profileImage, setProfileImage] = useState<File | null>(null);


  const currentUser = useCurrentUser();

  const handleClose = () => {
    setOpen(false);
    setName("");
    setProfileImage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const userId = currentUser.data?._id;
    if (!userId) {
      toast.error("User ID not found.");
      return;
    }

    try {
      let imageId: Id<"_storage"> | null = null;

      // Handle image upload if a new image is selected
      if (profileImage) {
        const url = await generateUploadUrl({}, { throwError: true });
        if (!url) {
          throw new Error("Failed to get upload URL");
        }

        const uploadResult = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": profileImage.type,
          },
          body: profileImage,
        });

        if (!uploadResult.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await uploadResult.json();
        if (!storageId) {
          throw new Error("Storage ID not found after upload");
        }

        imageId = storageId as Id<"_storage">;
      }

      const updatedProfileData = {
        id: userId,
        name: name,
        imageId: imageId,
      };

      await updateProfile(updatedProfileData, {
        onSuccess(data) {
          toast.success("Profile updated successfully!");
          handleClose();
          console.log("Updated profile:", data);
        },
        onError(error) {
          toast.error("Failed to update profile.");
          console.error(error);
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("Error updating profile.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-lg rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="flex flex-col space-y-2">
            <label className="text-gray-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Enter your name"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="profileImage" className="text-gray-700">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex justify-end mt-4">
            <Button type="button" onClick={handleClose} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfilePending} className="bg-[#5E2C5F] text-white">
              {updateProfilePending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
