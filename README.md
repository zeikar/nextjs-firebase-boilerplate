# Next.js 15 + Firebase Boilerplate

![Next.js + Firebase](https://nextjs-firebase-starter.vercel.app/repository-open-graph-template.png)

Production-ready Next.js 15 + Firebase boilerplate with built-in authentication, server-side rendering, and TypeScript support for rapid application development. Launch secure, scalable web applications in minutes, not days.

## Features

### Authentication Features

- ✅ Server Side Authentication
- ✅ Sign In (Google + Anonymous)
- ✅ Upgrade Account (Anonymous → Google)
- ✅ Delete Account

### Technical Features

- ✅ Next.js 15 (App Router)
- ✅ Firebase Authentication
- ✅ TypeScript Support
- ✅ Tailwind CSS Styling
- ✅ SEO Optimized
- ✅ Responsive Design
- ✅ Notification System

## Demo

[Live Demo](https://nextjs-firebase-starter.vercel.app/)

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- Firebase account with a project created
- Firebase Admin SDK credentials

### Environment Variables

You can set up environment variables in two ways:

#### Option 1: Copy from example file (Recommended)

Copy the provided example file:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual Firebase configuration values.

#### Option 2: Create manually

Create a `.env.local` file in the root directory with the following variables:

```
# Firebase Admin SDK credentials (for server-side authentication)
FIREBASE_ADMIN_SERVICE_ACCOUNT={"type":"service_account","project_id":"YOUR_PROJECT_ID","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"YOUR_PRIVATE_KEY","client_email":"YOUR_CLIENT_EMAIL","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"YOUR_CLIENT_X509_CERT_URL","universe_domain":"googleapis.com"}

# Firebase Web SDK configuration (for client-side authentication)
NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG={"apiKey":"YOUR_API_KEY","authDomain":"YOUR_PROJECT_ID.firebaseapp.com","projectId":"YOUR_PROJECT_ID","storageBucket":"YOUR_PROJECT_ID.firebasestorage.app","messagingSenderId":"YOUR_MESSAGING_SENDER_ID","appId":"YOUR_APP_ID"}
```

> **IMPORTANT**: When setting up the `FIREBASE_ADMIN_SERVICE_ACCOUNT`, `NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG` environment variable, you must remove all line breaks from the JSON. The entire JSON content should be on a single line. Especially in the `private_key` field, line breaks can cause authentication errors. Always compress the JSON into one line before adding it to your `.env.local` file.

### Installation

1. Clone the repository

```bash
git clone https://github.com/zeikar/nextjs-firebase-boilerplate.git
cd nextjs-firebase-boilerplate
```

2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Setup

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup instructions

### Step 2: Enable Authentication

1. In your Firebase project console, go to "Authentication"
2. Click "Get started"
3. Enable Google and Anonymous sign-in methods

### Step 3: Generate Admin SDK Credentials

1. In your Firebase project settings, go to "Service accounts"
2. Click "Generate new private key"
3. Save the JSON file and use its contents for the `FIREBASE_ADMIN_SERVICE_ACCOUNT` environment variable

### Step 4: Get Web SDK Configuration

1. In your Firebase project settings, go to "General"
2. Under "Your apps", click the web app (create one if needed)
3. Copy the Firebase configuration object for the `NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG` environment variable

## Project Structure

```
app/                  - Next.js App Router pages
  page.tsx            - Homepage
  layout.tsx          - Root layout
  api/                - API routes for authentication
    auth/
      signin/         - Sign in functionality
      signout/        - Sign out functionality
      user/           - User data functionality
components/           - Reusable UI components
  auth/               - Authentication components
    AccountDeleteButton.tsx
    AccountUpgradeButton.tsx
    AuthButtons.tsx
    ServerAuthInfo.tsx
  common/             - Common UI components
  icons/              - Icon components
    GitHubIcon.tsx
    GoogleIcon.tsx
    Loading.tsx
    UserIcon.tsx
  layout/             - Layout components
  modals/             - Modal components
    AuthModal.tsx
  notifications/      - Notification components
    notification-item.tsx
contexts/             - React contexts
  notification-context.tsx
lib/                  - Utility functions and services
  firebase/           - Firebase related utilities
    admin.ts          - Firebase Admin SDK setup
    auth-server.ts    - Server-side auth utilities
    authService.ts    - Client-side auth service
    client.ts         - Firebase client SDK setup
    useFirebaseAuth.ts - Custom hook for Firebase auth
  utils/              - General utility functions
    firebaseErrors.ts - Firebase error handling
    useFirebaseErrorHandler.ts
public/               - Static files
types/                - TypeScript type definitions
```

## Key Features

### Server-Side Authentication

This boilerplate implements secure server-side authentication using Firebase Admin SDK, allowing you to verify user sessions on the server side and protect API routes.

### Authentication Modal

A ready-to-use authentication modal that supports Google Sign-in and Anonymous authentication, with the ability to upgrade anonymous accounts to permanent ones.

### Firebase Error Handling

Built-in error handling for Firebase authentication with user-friendly error messages.

### Notification System

A contextual notification system to display success/error messages to users.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

Contributions are always welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

© 2025 Next.js Firebase Boilerplate
