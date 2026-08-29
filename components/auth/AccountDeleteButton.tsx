"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import Loading from "../icons/Loading";
import { useAuth } from "@/contexts/auth-context";

export default function AccountDeleteButton() {
  const { loadingProvider, isAuthLoading, deleteAccount } = useAuth();

  const handleDeleteAccount = async () => {
    // Deleting is irreversible and nothing on the server can undo it.
    if (
      !window.confirm(
        "Delete your account permanently? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteAccount();
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const isDeleting = loadingProvider === "delete";

  return (
    <button
      className="rounded-lg bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-300/50 disabled:opacity-70"
      onClick={handleDeleteAccount}
      disabled={isAuthLoading}
    >
      {isDeleting ? (
        <Loading size="small" color="red" />
      ) : (
        <TrashIcon className="h-4.5 w-4.5" aria-hidden="true" />
      )}
      <span>Delete Account</span>
    </button>
  );
}
