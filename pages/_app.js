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

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.userAgent) {
      // Detect mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // Listen for the beforeinstallprompt event
        window.addEventListener("beforeinstallprompt", (e) => {
          e.preventDefault();
          setDeferredPrompt(e); // Save the event for later use
          console.log("Install prompt saved for mobile.");
        });
      }
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show the install prompt
      const choiceResult = await deferredPrompt.userChoice;
      console.log("User choice:", choiceResult);
      setDeferredPrompt(null); // Clear the saved prompt after user action
    }
  };

  return (
    <ClerkProvider  {...pageProps}>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        {/* <UserButton /> */}
      </SignedIn>
      {/* Conditionally show the install button for mobile */}
      {/* {deferredPrompt && (
        <button
        className="text-xs border-2 border-blue-500 bg-gray-900 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600"
          onClick={handleInstallClick}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1000,

          }}
        >
        Install App for best experience
        </button>
      )} */}
      <Component {...pageProps} />
    </ClerkProvider>
  );
}