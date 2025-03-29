import Image from "next/image";
import { ServerAuthInfo } from "@/components/ServerAuthInfo";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-between py-12 px-4 sm:px-6">
      {/* Header */}
      <header className="w-full max-w-4xl text-center">
        <div className="flex flex-col items-center mb-8">
          <Image
            className="mb-4 dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={140}
            height={30}
            priority
          />
          <Image
            className="mb-4 dark:invert"
            src="/firebase.svg"
            alt="Firebase logo"
            width={140}
            height={30}
            priority
          />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-2">
            Next.js + Firebase Boilerplate
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            A starter template with authentication and serverless functions
          </p>
        </div>

        <div className="w-24 h-1 mx-auto bg-blue-500 rounded-full mb-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl">
        <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Authentication Demo
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sign in with your Google account to test the Firebase
              authentication
            </p>

            <div className="flex justify-center">
              <ServerAuthInfo />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
              Features included:
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300 mr-2">
                  ✓
                </span>
                Next.js App Router
              </li>
              <li className="flex items-center">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300 mr-2">
                  ✓
                </span>
                Firebase Authentication
              </li>
              <li className="flex items-center">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300 mr-2">
                  ✓
                </span>
                Client and Server Auth
              </li>
              <li className="flex items-center">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300 mr-2">
                  ✓
                </span>
                Tailwind CSS Styling
              </li>
              <li className="flex items-center">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300 mr-2">
                  ✓
                </span>
                TypeScript Support
              </li>
              <li className="flex items-center">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300 mr-2">
                  ✓
                </span>
                Responsive Design
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <a
            href="#"
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg p-6 transition-all duration-200 border border-gray-100 dark:border-gray-700"
          >
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2">
              Documentation
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Learn how to use and customize this boilerplate for your next
              project
            </p>
          </a>

          <a
            href="#"
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg p-6 transition-all duration-200 border border-gray-100 dark:border-gray-700"
          >
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2">
              Examples
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              View example implementations and use cases for this starter
              template
            </p>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Next.js Firebase Boilerplate
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <span className="sr-only">GitHub</span>
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
