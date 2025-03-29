import { getServerUser, ServerUser } from "@/lib/auth-server";
import AuthButtons from "./AuthButtons";

type ServerAuthInfoProps = {
  user: ServerUser | null;
};

// Client component that receives server data
function AuthContent({ user }: ServerAuthInfoProps) {
  if (user) {
    return (
      <div className="flex flex-col items-center sm:items-start mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Welcome, {user.displayName || "User"}!
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
        <AuthButtons user={user} />
      </div>
    );
  }

  return <AuthButtons user={null} />;
}

// Server component
export async function ServerAuthInfo() {
  const user = await getServerUser();

  return <AuthContent user={user} />;
}
