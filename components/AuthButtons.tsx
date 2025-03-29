"use client";

import { useState } from "react";
import { useFirebaseAuth } from "@/lib/useFirebaseAuth";
import { ServerUser } from "@/lib/auth-server";
import Loading from "./Loading";
import AuthModal from "./modals/AuthModal";
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
        className="rounded-lg border border-solid border-transparent transition-all duration-200 flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 text-white gap-2 hover:shadow-lg font-medium text-sm sm:text-base h-10 sm:h-12 px-5 sm:px-6 sm:w-auto"
        onClick={handleSignOut}
        disabled={isAuthLoading}
      >
        {loadingProvider === "signout" ? (
          <Loading size="small" color="white" />
        ) : (
          <>
            <ArrowRightEndOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
            <span>Sign Out</span>
          </>
        )}
      </button>
    );
  }

  return (
    <>
      <button
        className="rounded-lg border border-solid border-transparent transition-all duration-200 flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white gap-2 hover:shadow-lg hover:translate-y-[-2px] font-medium text-sm sm:text-base h-10 sm:h-12 px-5 sm:px-6 sm:w-auto"
        onClick={handleOpenModal}
        disabled={isAuthLoading}
      >
        <span>Sign In</span>
      </button>

      <AuthModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
}
