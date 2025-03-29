import React from "react";
import { UserIcon as HeroUserIcon } from "@heroicons/react/24/solid";

interface UserIconProps {
  className?: string;
}

const UserIcon: React.FC<UserIconProps> = ({ className = "h-5 w-5 text-gray-500 dark:text-gray-300" }) => {
  return <HeroUserIcon className={className} />;
};

export default UserIcon;