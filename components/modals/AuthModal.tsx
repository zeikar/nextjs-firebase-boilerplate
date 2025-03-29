"use client";

import { Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFirebaseAuth } from "@/lib/useFirebaseAuth";
import Loading from "../Loading";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loading, signInWithGoogle, signInAnonymously } = useFirebaseAuth();
  const cancelButtonRef = useRef(null);

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    onClose();
  };

  const handleAnonymousSignIn = async () => {
    await signInAnonymously();
    onClose();
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
                        <button
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-3 rounded-lg bg-white dark:bg-gray-700 px-4 py-3 text-gray-700 dark:text-gray-200 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-600"
                        >
                          {loading ? (
                            <Loading size="small" color="black" />
                          ) : (
                            <>
                              <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                  fill="#4285F4"
                                />
                                <path
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                  fill="#34A853"
                                />
                                <path
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                  fill="#FBBC05"
                                />
                                <path
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                  fill="#EA4335"
                                />
                              </svg>
                              <span className="text-sm font-medium">
                                Sign in with Google
                              </span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleAnonymousSignIn}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-3 rounded-lg bg-gray-100 dark:bg-gray-600 px-4 py-3 text-gray-700 dark:text-gray-200 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          {loading ? (
                            <Loading size="small" color="black" />
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-500 dark:text-gray-300"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm font-medium">
                                Continue as Guest
                              </span>
                            </>
                          )}
                        </button>
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
