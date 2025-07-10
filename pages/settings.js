// pages/calendar.js

import { useRouter } from 'next/router';
import { UserButton } from '@clerk/nextjs';


import {
    FiArrowLeft,
    FiGrid,
    FiClock,
    FiSettings,

} from 'react-icons/fi';




export default function SettingPage() {
    const router = useRouter();

    return (
        <div className="bg-neutral-950 text-white w-full min-h-screen flex flex-col">
            <header className="flex items-center justify-between px-4 pt-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-neutral-800 transition">
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
                    </p>                    <p className="text-neutral-400 leading-relaxed mt-4">
                        If you want to be a monthly supporter, you will finf this information in the link below as well, remeber to check the "Make this montly" Option.
                    </p>
                    {/* The Compliant Tip Button */}
                    <a
                        href="https://coff.ee/aziotopicz"
                        target="_blank" // CRITICAL: This opens the link in an external browser
                        rel="noopener noreferrer" // Good practice for security
                        className="mt-6 inline-block bg-purple-600 text-white font-bold py-3 px-6 rounded-full hover:bg-purple-700 transition-colors shadow-lg"
                    >
                        Leave a Tip
                    </a>

                    <p className="text-xs text-neutral-500 mt-4">
                        This is completely optional and doesn't unlock any extra features. Thank you for your support!
                    </p>
                </div>

                {/* The Clerk User Profile Section */}
                <div>
                    <h2 className="text-lg font-semibold text-neutral-300 px-2 mb-4">
                        Account
                    </h2>
                </div>

            </main>

            <footer className="flex items-center justify-center p-4 mt-auto">
                <div className="flex items-center gap-x-6 bg-neutral-900 rounded-full h-16 shadow-lg border border-neutral-800 px-6">
                    {/* Button 1 */}
                    <button
                        onClick={() => (window.location.href = '/')}
                        className="flex justify-center items-center text-neutral-500 hover:text-white transition-colors h-full">
                        <FiClock size={26} />
                    </button>

                    {/* Button 2 */}
                    <button

                        className="flex justify-center items-center text-neutral-500 h-full"

                    >
                        <FiGrid size={24} />
                    </button>
                    <button
                        onClick={() => (window.location.href = '/settings')}
                        className="flex justify-center items-center text-purple-400  hover:text-white transition-colors h-full"
                    >
                        <FiSettings size={24} />
                    </button>

                    {/* Divider */}
                    <div className="h-8 border-l border-neutral-700" />

                    {/* User Button */}
                    <div>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </footer>

        </div>
    );
}
