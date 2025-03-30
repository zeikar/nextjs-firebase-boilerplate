"use client";

import { ArrowUpCircleIcon } from "@heroicons/react/24/outline";
import Loading from "../icons/Loading";
import { useFirebaseAuth } from "@/lib/firebase/useFirebaseAuth";

export default function AccountUpgradeButton() {
  const { loadingProvider, linkWithGoogle } = useFirebaseAuth();

  const handleUpgradeAccount = async () => {
    try {
      await linkWithGoogle();
    } catch (error) {
      console.error("Error upgrading account:", error);
    }
  };

  const isLoading = loadingProvider === "link";

  return (
    <button
      className="rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-opacity-50 disabled:opacity-70"
      onClick={handleUpgradeAccount}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loading size="small" color="green" />
      ) : (
        <ArrowUpCircleIcon className="h-4.5 w-4.5" aria-hidden="true" />
      )}
      <span>Upgrade Account</span>
    </button>
  );
}
