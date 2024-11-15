"use client";
import React from "react"; // Ensure this line is included

import { CreateWorkspaceModal } from "@/features/workspaces/components/create-workspace-modal";
import { useEffect, useState } from "react";
import { CreateChannelModal } from "@/features/channels/components/create-channel-modal";
import { EditProfileModal } from "@/features/members/components/editProfile";
//import {  EditProfileModal } from "@/features/members/components/editProfile";
export const Modals = () => {

  const [mounted, setMounted] = useState(false);
  useEffect(() => {

    setMounted(true);
  }, []);
  if (!mounted) return null

  return (

    <>
      <CreateChannelModal />
      <CreateWorkspaceModal />
      <EditProfileModal />

    </>
  )



}