"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useRef,
} from "react";
import NotificationItem from "@/components/notifications/notification-item";

// Notification type definition
export interface Notification {
  id: number;
  type: "error" | "info" | "success" | "warning";
  message: string;
}

// Context type definition
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: number) => void;
  // Add notification functions by type
  addErrorNotification: (message: string) => void;
  addInfoNotification: (message: string) => void;
  addSuccessNotification: (message: string) => void;
  addWarningNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idCounterRef = useRef(0); // Counter for generating unique IDs

  const addNotification = (notification: Omit<Notification, "id">) => {
    const timestamp = Date.now();
    const id = timestamp * 1000 + idCounterRef.current; // Combination of timestamp and counter
    idCounterRef.current = (idCounterRef.current + 1) % 1000; // Keep between 0-999

    setNotifications((prev) => [...prev, { id, ...notification }]);
  };

  // Implementation of typed notification functions
  const addErrorNotification = (message: string) => {
    addNotification({ type: "error", message });
  };

  const addInfoNotification = (message: string) => {
    addNotification({ type: "info", message });
  };

  const addSuccessNotification = (message: string) => {
    addNotification({ type: "success", message });
  };

  const addWarningNotification = (message: string) => {
    addNotification({ type: "warning", message });
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        addErrorNotification,
        addInfoNotification,
        addSuccessNotification,
        addWarningNotification,
      }}
    >
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

// Container to display notification messages on screen
interface NotificationContainerProps {
  notifications: Notification[];
  onRemoveNotification: (id: number) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemoveNotification,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => onRemoveNotification(notification.id)}
          duration={5000} // Auto-remove after 5 seconds
        />
      ))}
    </div>
  );
};
