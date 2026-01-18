# Firebase Integration Plan

This document outlines the steps to transition the Cognitive Scaffolding Engine to a full-stack application using Firebase.

## 1. Installation

We will install the Firebase SDK to interact with Firebase services.

```bash
npm install firebase
```

## 2. Configuration (`src/lib/firebase.ts`)

We will create a centralized configuration file to initialize the Firebase app.

**File:** `src/lib/firebase.ts`

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
```

## 3. Environment Variables

You need to create a `.env.local` file in the root directory. Grab these values from the **Firebase Console** -> **Project Settings** -> **General** -> **Your Apps** (Web).

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 4. Authentication Strategy

We will implement an `AuthProvider` to manage user state globally.

*   **File:** `src/context/AuthContext.tsx`
*   **Roles:** We will store a `role` field ('teacher' | 'student') in a standard `users` collection in Firestore to differentiate user types.

## 5. Firestore Database Structure

We will migrate `src/lib/assignments.ts` to a Firestore collection.

### Collection: `assignments`
Documents in this collection will replace the static array.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | string | Title of the text |
| `content` | string | HTML/Markdown content |
| `themeImageKeyword` | string | Keyword for Unsplash image |
| `author` | string | (Optional) Author name |

### Collection: `users`
| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | string | Matches Auth UID |
| `email` | string | User email |
| `role` | string | 'student' OR 'teacher' |
| `createdAt` | timestamp | Account creation time |

## 6. Migration Steps

1.  **Install SDK**: Run `npm install firebase`.
2.  **Setup Keys**: User adds keys to `.env.local`.
3.  **Create Config**: Create `src/lib/firebase.ts`.
4.  **Create Auth Context**: Implement React Context for Auth.
5.  **Refactor App**: Wrap `layout.tsx` with `AuthProvider`.
6.  **Migrate Data**: Create a simple admin script or manually add the existing "Cognitive Scaffolding Engine" assignment to Firestore.
7.  **Fetch Data**: Update `page.tsx` to fetch assignments from Firestore instead of `src/lib/assignments.ts`.
