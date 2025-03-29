"use client";

import { useFirebaseAuth } from "@/lib/useFirebaseAuth";
import { ServerUser } from "@/lib/auth-server";
import Loading from "./Loading";


type AuthButtonsProps = {
  user: ServerUser | null;
};

export default function AuthButtons({ user }: AuthButtonsProps) {
  const { loading, signInWithGoogle, signOut } = useFirebaseAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  if (user) {
    return (
      <button
        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
        onClick={handleSignOut}
        disabled={loading}
      >
        {loading ? <Loading size="small" color="white" /> : "Sign out"}
      </button>
    );
  }

  return (
    <button
      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
      onClick={handleSignIn}
      disabled={loading}
    >
      {loading ? <Loading size="small" color="white" /> : "Sign in with Google"}
    </button>
  );
}