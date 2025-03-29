import { getServerUser, ServerUser } from "@/lib/auth-server";
import AuthButtons from "./AuthButtons";
import AccountUpgradeButton from "./AccountUpgradeButton";
import AccountDeleteButton from "./AccountDeleteButton";
import UserIcon from "./icons/UserIcon";

type ServerAuthInfoProps = {
  user: ServerUser | null;
};

// Client component that receives server data
function AuthContent({ user }: ServerAuthInfoProps) {
  // Check if user is anonymous (no email typically means anonymous user)
  const isAnonymousUser = user?.email === "";

  if (user) {
    return (
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300">
        {/* User Image - with improved styling */}
        <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border-2 border-indigo-100 dark:border-indigo-900 shadow-inner">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User profile"}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserIcon className="h-8 w-8 text-indigo-400 dark:text-indigo-300" />
          )}
        </div>

        {/* User Info and Buttons with improved layout */}
        <div className="flex flex-col items-center sm:items-start">
          <div className="mb-3 text-center sm:text-left">
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {user.displayName || "User"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email || `Anonymous User (${user.uid.substring(0, 6)})`}
              {isAnonymousUser && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs rounded-full">
                  Temporary
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-start gap-2 w-full">
            {/* Show upgrade button for anonymous users */}
            {isAnonymousUser && <AccountUpgradeButton />}

            {/* Other buttons */}
            <AuthButtons user={user} />

            {/* Delete account button for all users */}
            <AccountDeleteButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 flex flex-col items-center min-w-[240px]">
      <div className="text-center mb-4">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
          Welcome
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sign in to get started
        </p>
      </div>
      <AuthButtons user={null} />
    </div>
  );
}

// Server component
export async function ServerAuthInfo() {
  const user = await getServerUser();

  return <AuthContent user={user} />;
}
