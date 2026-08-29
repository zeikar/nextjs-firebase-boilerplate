import React, { useCallback, useEffect, useRef, useState } from "react";
import { Notification } from "@/contexts/notification-context";
import {
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface NotificationItemProps {
  notification: Notification;
  onRemove?: () => void;
  duration?: number; // Auto-dismiss duration (ms)
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRemove,
  duration = 5000, // Default 5 seconds
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // Set icons and styles
  const getTypeStyles = () => {
    switch (notification.type) {
      case "error":
        return {
          bg: "bg-red-50 dark:bg-red-950 border-l-4 border-red-500",
          icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
          title: "Error",
        };
      case "success":
        return {
          bg: "bg-green-50 dark:bg-green-950 border-l-4 border-green-500",
          icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
          title: "Success",
        };
      case "warning":
        return {
          bg: "bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500",
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />,
          title: "Warning",
        };
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500",
          icon: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
          title: "Info",
        };
    }
  };

  const { bg, icon, title } = getTypeStyles();

  // Keep the latest callback reachable without depending on it: the parent
  // passes a new inline arrow on every render, and depending on it would
  // restart this notification's timer whenever another one appears.
  const onRemoveRef = useRef(onRemove);
  const removalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onRemoveRef.current = onRemove;
  });

  // One dismissal path for the timer and the close button alike: play the exit
  // animation, then remove exactly once however it was triggered.
  const dismiss = useCallback(() => {
    if (removalRef.current) {
      return;
    }

    setIsVisible(false);
    removalRef.current = setTimeout(() => {
      onRemoveRef.current?.();
    }, 300); // Remove after animation completes
  }, []);

  // Handle appearance and disappearance animations
  useEffect(() => {
    // Flip the class in a frame of its own, so the enter transition runs
    const enterFrame = requestAnimationFrame(() => setIsVisible(true));

    // Update progress bar
    const interval = setInterval(() => {
      setProgress((prev) => Math.max(prev - 100 / (duration / 100), 0));
    }, 100);

    // Auto-dismiss
    const timer = setTimeout(dismiss, duration);

    return () => {
      cancelAnimationFrame(enterFrame);
      clearInterval(interval);
      clearTimeout(timer);

      if (removalRef.current) {
        clearTimeout(removalRef.current);
        removalRef.current = null;
      }
    };
  }, [duration, dismiss]);

  return (
    <div
      className={`max-w-xs w-screen ${bg} shadow-lg rounded-lg pointer-events-auto mb-3 transform transition-all duration-300 ease-in-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="relative overflow-hidden rounded-lg">
        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-gray-300/50 dark:bg-gray-500/50"
          style={{ width: `${progress}%`, transition: "width 100ms linear" }}
        />

        <div className="p-4">
          <div className="flex items-start">
            <div className="shrink-0">{icon}</div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {notification.message}
              </p>
            </div>
            <div className="ml-4 shrink-0 flex">
              <button
                onClick={dismiss}
                className="inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
