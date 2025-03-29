"use client";

import { useFirebaseAuth } from "@/lib/useFirebaseAuth";

export default function AuthButtons() {
  const { user, loading, signInWithGoogle, signOut } = useFirebaseAuth();
  const isAuthenticated = !!user;

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (isAuthenticated) {
    return (
      <>
        <div className="flex flex-col items-center sm:items-start mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Welcome, {user?.displayName || "User"}!
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </p>
        </div>
        <button
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </>
    );
  }

  return (
    <button
      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
      onClick={handleSignIn}
    >
      Sign in with Google
    </button>
  );
}
