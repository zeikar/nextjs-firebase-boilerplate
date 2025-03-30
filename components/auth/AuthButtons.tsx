"use client";

import { useState } from "react";
import { useFirebaseAuth } from "@/lib/firebase/useFirebaseAuth";
import { ServerUser } from "@/lib/firebase/auth-server";
import Loading from "../icons/Loading";
import AuthModal from "../modals/AuthModal";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";

type AuthButtonsProps = {
  user: ServerUser | null;
};

export default function AuthButtons({ user }: AuthButtonsProps) {
  const { loadingProvider, isAuthLoading, signOut } = useFirebaseAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (user) {
    return (
      <button
        className="rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 px-5 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-opacity-50 disabled:opacity-70"
        onClick={handleSignOut}
        disabled={isAuthLoading}
      >
        {loadingProvider === "signout" ? (
          <Loading size="small" color="red" />
        ) : (
          <ArrowRightEndOnRectangleIcon
            className="h-4.5 w-4.5"
            aria-hidden="true"
          />
        )}
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <>
      <button
        className="rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 px-5 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 disabled:opacity-70"
        onClick={handleOpenModal}
        disabled={isAuthLoading}
      >
        <span>Sign In</span>
      </button>

      <AuthModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
}
