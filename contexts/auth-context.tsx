"use client";

import { createContext, useContext, ReactNode } from "react";
import { useFirebaseAuth } from "@/lib/firebase/useFirebaseAuth";

// Everything the auth hook exposes, shared by every component below it
type AuthContextType = ReturnType<typeof useFirebaseAuth>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Holds the single auth state of the app. Calling the hook per component would
 * give each of them its own loading flag, so a running operation could not
 * disable the others - and sign-out, upgrade and delete would race over the
 * same Firebase user and session cookie.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useFirebaseAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
