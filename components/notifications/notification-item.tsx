import React, { useEffect, useState } from "react";
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
          bg: "bg-red-50 border-l-4 border-red-500",
          icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
          title: "Error",
        };
      case "success":
        return {
          bg: "bg-green-50 border-l-4 border-green-500",
          icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
          title: "Success",
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-l-4 border-amber-500",
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />,
          title: "Warning",
        };
      default:
        return {
          bg: "bg-blue-50 border-l-4 border-blue-500",
          icon: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
          title: "Info",
        };
    }
  };

  const { bg, icon, title } = getTypeStyles();

  // Handle appearance and disappearance animations
  useEffect(() => {
    setIsVisible(true);

    // Update progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) return 0;
        return prev - 100 / (duration / 100);
      });
    }, 100);

    // Auto-dismiss
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onRemove?.();
      }, 300); // Remove after animation completes
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [duration, onRemove]);

  return (
    <div
      className={`max-w-xs w-screen ${bg} shadow-lg rounded-lg pointer-events-auto mb-3 transform transition-all duration-300 ease-in-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="relative overflow-hidden rounded-lg">
        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-gray-300 bg-opacity-50"
          style={{ width: `${progress}%`, transition: "width 100ms linear" }}
        />

        <div className="p-4">
          <div className="flex items-start">
            <div className="shrink-0">{icon}</div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{title}</p>
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
            </div>
            <div className="ml-4 shrink-0 flex">
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => onRemove?.(), 300);
                }}
                className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
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
