"use client";

import { useNotification } from "@/contexts/notification-context";
import { getFirebaseErrorMessage } from "./firebaseErrors";

/**
 * Hook for handling Firebase errors with notifications
 */
export const useFirebaseErrorHandler = () => {
  const { addErrorNotification, addSuccessNotification, addInfoNotification, addWarningNotification } = useNotification();

  /**
   * Show Firebase error as notification
   * @param error Firebase error object
   * @param fallbackMessage Optional fallback message if error cannot be parsed
   */
  const showFirebaseError = (error: unknown, fallbackMessage?: string) => {
    const errorMessage = getFirebaseErrorMessage(error);
    addErrorNotification(errorMessage || fallbackMessage || 'An error occurred.');
    return errorMessage;
  };

  return {
    showFirebaseError,
    showErrorMessage: addErrorNotification,
    showSuccessMessage: addSuccessNotification,
    showInfoMessage: addInfoNotification,
    showWarningMessage: addWarningNotification
  };
};