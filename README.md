# Next.js 16 + Firebase Boilerplate

![Next.js + Firebase](https://nextjs-firebase-starter.vercel.app/repository-open-graph-template.png)

Production-ready Next.js 16 + Firebase boilerplate with built-in authentication, server-side rendering, and TypeScript support for rapid application development. Launch secure, scalable web applications in minutes, not days.

## Features

### Authentication Features

- ✅ Server Side Authentication
- ✅ Sign In (Google + Anonymous)
- ✅ Upgrade Account (Anonymous → Google)
- ✅ Delete Account

### Technical Features

- ✅ Next.js 16 (App Router)
- ✅ Firebase Authentication
- ✅ TypeScript Support
- ✅ Tailwind CSS Styling
- ✅ SEO Optimized
- ✅ Responsive Design
- ✅ Notification System
- ✅ Tested with Vitest, verified in CI

## Demo

[Live Demo](https://nextjs-firebase-starter.vercel.app/)

## Getting Started

### Prerequisites

- Node.js 20.9.0 or later (required by Next.js 16)
- Firebase account with a project created
- Firebase Admin SDK credentials

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

### Environment Variables

Copy the example file and fill in your own values:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | yes | Service account JSON from Step 3, used server-side to verify sessions and manage users |
| `NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG` | yes | Web app config from Step 4, used by the browser SDK |
| `SITE_URL` | no | Public URL of the deployment, used for metadata, `robots.txt` and the sitemap. Falls back to the Vercel production domain, then `http://localhost:3000` |

> **IMPORTANT**: both JSON values must be on a **single line**, with no line breaks - the `private_key` field in particular. Line breaks inside the JSON cause authentication errors.

## Installation

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

Other scripts: `npm test` (run the test suite), `npm run test:watch` (re-run on change), `npm run test:coverage` (coverage report), `npm run lint` (ESLint), `npm run build` (production build), `npm start` (serve the build).

## Project Structure

```
app/                       - Next.js App Router
  layout.tsx               - Root layout, notification + auth providers
  page.tsx                 - Homepage
  robots.ts, sitemap.ts    - SEO routes
  globals.css              - Tailwind entry point
  api/auth/
    signin/                - Exchanges an ID token for a session cookie
    signout/               - Revokes the session and clears the cookie
    user/                  - Reads the current user, deletes the account
components/
  auth/                    - Sign in/out, upgrade and delete controls
  icons/                   - Icon components
  modals/AuthModal.tsx     - Sign-in modal
  notifications/           - Notification item
contexts/
  auth-context.tsx         - Single auth state for the whole app
  notification-context.tsx - Notification state and container
lib/
  firebase/
    admin.ts               - Firebase Admin SDK setup
    auth-server.ts         - Session verification for server code
    authService.ts         - Client calls to the auth API routes
    client.ts              - Firebase Web SDK setup
    session.ts             - Cookie name, lifetime, freshness rule
    useFirebaseAuth.ts     - Auth operations and loading state
  utils/
    firebaseErrors.ts      - Error classification and messages
    request-origin.ts      - Same-origin guard for auth routes
    useFirebaseErrorHandler.ts
  site.ts                  - Public site URL
public/                    - Static files
__tests__/
  helpers/                 - Shared test doubles
  lib/                     - Origin guard, session rules, error mapping
  api/                     - Auth routes, with the Admin SDK mocked
.github/workflows/         - Lint, test and build on push and PR
```

## Key Features

### Server-Side Authentication

Sign-in exchanges a Firebase ID token for an `httpOnly` session cookie (2 weeks), which server components and route handlers verify with the Admin SDK. `getServerUser()` returns the current user for rendering; `getServerSession()` additionally distinguishes an unusable cookie from a Firebase outage, so a route handler can answer `503` instead of claiming the caller is signed out.

### Session Security

The auth routes assume a hostile caller:

- **Same-origin only** - the state-changing routes (sign-in, sign-out, delete) reject requests whose `Origin` does not match the deployment; sign-in and deletion additionally require a JSON content type, so a cross-site form cannot sign a victim into an attacker's account.
- **Fresh tokens only** - a session cookie is minted only from an ID token whose sign-in happened in the last 5 minutes, so a leaked ID token cannot be traded for a two-week session. Re-minting is exempt when the browser already holds a valid session for the same user, which is what the anonymous -> Google upgrade does: it grants no access the caller does not already have.
- **Sign-out revokes everywhere** - signing out calls `revokeRefreshTokens`, which invalidates every session of that user on every device. Firebase cannot revoke a single session cookie, so a copied cookie would otherwise stay valid; if revocation fails the API reports it instead of claiming success.
- **Deletion needs re-authentication** - deleting an account requires a confirmation and a freshly minted ID token (a Google popup re-auth for permanent accounts), because Admin-side deletion bypasses Firebase's own `requires-recent-login` rule.

`GET /api/auth/user` is included as a worked example of a protected route handler; the UI itself reads the user on the server.

### Authentication Modal

A ready-to-use authentication modal that supports Google Sign-in and Anonymous authentication, with the ability to upgrade anonymous accounts to permanent ones.

### Firebase Error Handling

Built-in error handling for Firebase authentication with user-friendly error messages.

### Notification System

A contextual notification system to display success/error messages to users.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Set `FIREBASE_ADMIN_SERVICE_ACCOUNT` and `NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG` in the project's environment variables, and add your Firebase auth domain to the authorized domains list in the Firebase console. `SITE_URL` is optional on Vercel: the production domain is picked up automatically.

If you forked this repository, delete `public/google*.html` - it verifies the original author's Search Console property, not yours.

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
