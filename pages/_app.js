import "@/styles/globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);


  // --> THIS EFFECT NOW HANDLES ALL PWA SETUP <--
  useEffect(() => {
    // 1. REGISTER THE SERVICE WORKER
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Service Worker registration successful:', registration.scope);
          },
          (err) => {
            console.error('Service Worker registration failed:', err);
          }
        );
      });
    }

    // 2. LISTEN FOR THE INSTALL PROMPT
    const handler = (e) => {
      e.preventDefault();
      console.log("✅ 'beforeinstallprompt' event fired and captured.");
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Pass the state and setter down to all pages
  pageProps.deferredPrompt = deferredPrompt;
  pageProps.setDeferredPrompt = setDeferredPrompt;

  return (
    <ClerkProvider  {...pageProps}>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>

      </SignedIn>

      <Component {...pageProps} />
    </ClerkProvider>
  );
}