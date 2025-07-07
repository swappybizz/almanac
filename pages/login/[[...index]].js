// pages/login/[[...index]].js
import { SignIn } from "@clerk/nextjs";
import { FiClock, FiGrid } from "react-icons/fi";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      {/* Animated Purple Glow */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[340px] bg-purple-600/30 rounded-full blur-3xl z-0 animate-pulse-slow"
        style={{ filter: "blur(96px)" }}
      />

      {/* Top Brand */}
      <div className="z-10 flex flex-col items-center mt-20">
        <h1 className="text-5xl font-bold text-white tracking-tight flex items-center gap-3 animate-fadein-slow">
          Time Dalo
          <FiClock className="text-purple-500" size={32} />
        </h1>
        <p className="mt-4 text-lg text-neutral-300 font-medium animate-fadein-delay">
          Log yout Time & Export to Excel
          <FiGrid className="inline ml-2 text-purple-500" size={22} />
        </p>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex flex-col items-center justify-center z-10">
        <div className="w-full max-w-sm mt-10 rounded-2xl bg-neutral-900 border border-neutral-800 p-8 animate-cardpop">
          <SignIn path="/login" routing="path" />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-neutral-400 text-sm z-10">
        &copy; {new Date().getFullYear()} Almanac – Tidssporing & prosjekthåndtering
      </footer>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeinSlow {
          from { opacity: 0; transform: translateY(60px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeinDelay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes cardpop {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fadein      { animation: fadein 1s cubic-bezier(.6,.2,.1,1) forwards; }
        .animate-fadein-slow { animation: fadeinSlow 1.2s cubic-bezier(.6,.2,.1,1) 0.1s forwards; }
        .animate-fadein-delay{ animation: fadeinDelay 2s cubic-bezier(.6,.2,.1,1) 0.8s forwards; opacity: 0; }
        .animate-cardpop     { animation: cardpop 1s cubic-bezier(.6,.2,.1,1) 0.3s forwards; }
        .animate-pulse-slow  { animation: pulseGlow 7s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
