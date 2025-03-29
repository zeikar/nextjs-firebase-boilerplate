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
  const showFirebaseError = (error: any, fallbackMessage?: string) => {
    const errorMessage = getFirebaseErrorMessage(error);
    addErrorNotification(errorMessage || fallbackMessage || 'An error occurred.');
    return errorMessage;
  };

  /**
   * Handle Firebase operation with appropriate notifications
   * @param operation Promise-returning function to execute
   * @param successMessage Message to show on success
   * @param errorMessage Optional custom error message
   * @returns Result of the operation
   */
  const handleFirebaseOperation = async <T>(
    operation: () => Promise<T>, 
    successMessage: string,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      const result = await operation();
      addSuccessNotification(successMessage);
      return result;
    } catch (error: any) {
      showFirebaseError(error, errorMessage);
      return null;
    }
  };

  return {
    showFirebaseError,
    handleFirebaseOperation,
    showSuccessMessage: addSuccessNotification,
    showInfoMessage: addInfoNotification,
    showWarningMessage: addWarningNotification
  };
};