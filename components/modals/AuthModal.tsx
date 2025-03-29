"use client";

import { Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFirebaseAuth, AuthProvider } from "@/lib/useFirebaseAuth";
import Loading from "../icons/Loading";
import GoogleIcon from "../icons/GoogleIcon";
import UserIcon from "../icons/UserIcon";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuthButtonProps {
  provider: AuthProvider;
  loadingProvider: AuthProvider;
  isAuthLoading: boolean;
  onClick: () => Promise<void>;
  icon: React.ReactNode;
  text: string;
  className?: string;
}

/**
 * Reusable authentication button component
 */
const AuthButton = ({
  provider,
  loadingProvider,
  isAuthLoading,
  onClick,
  icon,
  text,
  className,
}: AuthButtonProps) => {
  const isLoading = loadingProvider === provider;

  return (
    <button
      onClick={onClick}
      disabled={isAuthLoading}
      className={`w-full flex items-center justify-center gap-3 rounded-lg px-4 py-3 shadow-md hover:shadow-lg transition-all duration-200 ${
        isAuthLoading && !isLoading ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {isLoading ? <Loading size="small" color="black" /> : icon}
      <span className="text-sm font-medium">{text}</span>
    </button>
  );
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const {
    loadingProvider,
    isAuthLoading,
    signInWithGoogle,
    signInAnonymously,
  } = useFirebaseAuth();
  const cancelButtonRef = useRef(null);

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      onClose();
    }
  };

  const handleAnonymousSignIn = async () => {
    const result = await signInAnonymously();
    if (result.success) {
      onClose();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-75"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 opacity-75 transition-opacity dark:bg-gray-900 dark:opacity-80" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                <div className="absolute right-0 top-0 pr-4 pt-4 block">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="px-4 pb-4 pt-5 sm:p-8">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100 text-center mb-6"
                      >
                        Sign In Options
                      </Dialog.Title>

                      <div className="mt-4 space-y-4">
                        <AuthButton
                          provider="google"
                          loadingProvider={loadingProvider}
                          isAuthLoading={isAuthLoading}
                          onClick={handleGoogleSignIn}
                          className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
                          icon={<GoogleIcon />}
                          text="Sign in with Google"
                        />

                        <AuthButton
                          provider="anonymous"
                          loadingProvider={loadingProvider}
                          isAuthLoading={isAuthLoading}
                          onClick={handleAnonymousSignIn}
                          className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                          icon={<UserIcon />}
                          text="Continue as Guest"
                        />
                      </div>

                      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        By continuing, you agree to the Terms of Service and
                        Privacy Policy
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
