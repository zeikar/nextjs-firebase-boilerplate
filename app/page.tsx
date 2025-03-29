import Image from "next/image";
import { ServerAuthInfo } from "@/components/ServerAuthInfo";
import { Metadata } from "next";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import GitHubIcon from "@/components/icons/GitHubIcon";

// Add SEO metadata
export const metadata: Metadata = {
  title: "Next.js 15 + Firebase Boilerplate",
  description:
    "Production-ready Next.js 15 + Firebase boilerplate with built-in authentication, server-side rendering, and TypeScript support for rapid application development",
  keywords: [
    "next.js",
    "next.js 15",
    "firebase",
    "authentication",
    "boilerplate",
    "react",
    "typescript",
    "rapid development",
    "production-ready",
    "developer-friendly",
  ],
  openGraph: {
    title: "Next.js 15 + Firebase Boilerplate",
    description:
      "Production-ready Next.js 15 + Firebase boilerplate with built-in authentication",
    url: "https://nextjs-firebase-starter.vercel.app/",
    siteName: "Next.js Firebase Boilerplate",
    images: [
      {
        url: "https://dogimg.vercel.app/api/og?url=https://nextjs-firebase-starter.vercel.app/",
        width: 1200,
        height: 630,
        alt: "Next.js 15 + Firebase Boilerplate",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js 15 + Firebase Boilerplate",
    description:
      "Production-ready Next.js 15 + Firebase boilerplate with built-in authentication",
    images: [
      "https://dogimg.vercel.app/api/og?url=https://nextjs-firebase-starter.vercel.app/",
    ],
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-between py-12 px-4 sm:px-6">
      {/* Header */}
      <header className="w-full max-w-4xl text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="flex flex-row items-center gap-6 mb-6">
            <Image
              className="dark:invert transition-transform hover:scale-105"
              src="/next.svg"
              alt="Next.js logo"
              width={140}
              height={30}
              priority
            />
            <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
              +
            </span>
            <Image
              className="dark:invert transition-transform hover:scale-105"
              src="/firebase.svg"
              alt="Firebase logo"
              width={140}
              height={30}
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-2">
            Next.js + Firebase Boilerplate
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Launch secure, scalable web applications in minutes, not days
          </p>
        </div>

        <div className="w-40 h-1.5 mx-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-10"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl">
        <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12 border border-gray-100 dark:border-gray-700 transform transition-all hover:shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Authentication Demo
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Try out Firebase authentication with Google or Anonymous login.
              Create an account, sign in, and explore the features.
            </p>

            <div className="flex justify-center">
              <ServerAuthInfo />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
              Authentication Features:
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                Server Side Auth
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                Sign In (Google + Anonymous)
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                Sign Out
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                Upgrade Account (Anonymous → Google)
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                Delete Account
              </li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
              Technical Features:
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                Next.js 15 (Latest)
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                Next.js App Router
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                Firebase Authentication
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                TypeScript Support
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                Tailwind CSS Styling
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                SEO Optimized
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                Responsive Design
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Next.js Firebase Boilerplate
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <a
              href="https://github.com/zeikar/nextjs-firebase-boilerplate"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-black dark:from-gray-700 dark:to-gray-900 text-white rounded-lg transition-all hover:scale-105"
            >
              <GitHubIcon />
              <span>View on GitHub</span>
            </a>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Contributions are always welcome!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
