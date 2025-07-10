// pages/calendar.js

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserButton } from '@clerk/nextjs';
import {
  FiArrowLeft,
  FiGrid,
  FiClock,
  FiSettings,
  FiDownload,
  FiShare2,
} from 'react-icons/fi';
import { MdIosShare } from 'react-icons/md';

export default function SettingPage({ deferredPrompt, setDeferredPrompt }) {
  const router = useRouter();

  // PWA install state
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent;
    setIsAndroid(/Android/i.test(ua));
    setIsIOS(/iPhone|iPad|iPod/i.test(ua));
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) {
      alert(
        "Installation is not available. It may already be installed or your browser isn't supported."
      );
      return;
    }
    deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  const handleIOSInstall = () => setShowIOSModal(true);
  const closeIOSModal = () => setShowIOSModal(false);

  return (
    <div className="bg-neutral-950 text-white w-full min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 pt-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-neutral-800 transition"
        >
          <FiArrowLeft size={24} />
        </button>
      </header>

      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold text-purple-400 mb-2">
            A Note from the Developer 🙏
          </h2>
          <p className="text-neutral-400 leading-relaxed">
            Hi there! I'm the solo developer who built this app. My goal was to create a simple, beautiful tool to help us all be more mindful of our time.
          </p>
          <p className="text-neutral-400 leading-relaxed mt-4">
            The app is free and will always have its core features available to everyone. If you find it valuable and wish to support its ongoing development and server costs, you can leave a small tip.
          </p>
          <p className="text-neutral-400 leading-relaxed mt-4">
            A small tip helps keep the servers running and allows me to continue improving the app. Your support means a lot to me and helps ensure that this tool remains available for everyone.
          </p>
          <p className="text-neutral-400 leading-relaxed mt-4">
            If you want to be a monthly supporter, you will find this information in the link below as well. Remember to check the "Make this monthly" option.
          </p>
          <a
            href="https://coff.ee/aziotopicz"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block bg-purple-600 text-white font-bold py-3 px-6 rounded-full hover:bg-purple-700 transition-colors shadow-lg"
          >
            Leave a Tip
          </a>
          <p className="text-xs text-neutral-500 mt-4">
            This is completely optional and doesn't unlock any extra features. Thank you for your support!
          </p>
        </div>

        {/* ——— PWA Install Buttons ——— */}
        <div className="mt-6 px-2 space-y-4">
          {isAndroid && (
            <button
              onClick={handleAndroidInstall}
              className="w-full py-3 bg-green-500 text-white font-medium rounded-xl shadow-md hover:bg-green-600 flex items-center justify-center"
            >
              <FiDownload className="mr-2" size={20} />
              Install App
            </button>
          )}
          {isIOS && (
            <button
              onClick={handleIOSInstall}
              className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl shadow-md hover:bg-gray-800 flex items-center justify-center"
            >
              <FiShare2 className="mr-2" size={20} />
              How to Install on iOS
            </button>
          )}
        </div>

      </main>

      <footer className="flex items-center justify-center p-4 mt-auto">
        <div className="flex items-center gap-x-6 bg-neutral-900 rounded-full h-16 shadow-lg border border-neutral-800 px-6">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex justify-center items-center text-neutral-500 hover:text-white transition-colors h-full"
          >
            <FiClock size={26} />
          </button>
          <button className="flex justify-center items-center text-neutral-500 h-full">
            <FiGrid size={24} />
          </button>
          <button
            onClick={() => (window.location.href = '/settings')}
            className="flex justify-center items-center text-purple-400 hover:text-white transition-colors h-full"
          >
            <FiSettings size={24} />
          </button>
          <div className="h-8 border-l border-neutral-700" />
          <UserButton afterSignOutUrl="/" />
        </div>
      </footer>

      {/* ——— iOS Install Modal ——— */}
      {showIOSModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl p-6 w-11/12 max-w-sm">
            <h2 className="text-xl font-semibold mb-4">Add to Home Screen</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Tap the Share button <MdIosShare className="inline" />
              </li>
              <li>Select “Add to Home Screen.”</li>
              <li>Tap “Add” in the top-right corner.</li>
            </ol>
            <button
              onClick={closeIOSModal}
              className="mt-6 w-full py-2 border border-blue-600 text-blue-600 font-medium rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
