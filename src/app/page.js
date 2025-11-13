"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";


export default function LandingPage() {
  const { isSignedIn, user } = useUser();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-100 via-white to-white flex flex-col">
      {/* Modern Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600">
              AI Mentors
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <span className="text-sm font-medium text-gray-600 hidden sm:block">
                  Hi, {user?.firstName}
                </span>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Your 24/7 Coding Companion
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
            Master Code with <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-500">
              AI Personalities
            </span>
          </h1>

          <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
            Chat with realistic AI versions of your favorite tech educators.
            Get code reviews, career advice, and debugging help in their unique style.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/select">
              <button className="group relative px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-semibold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto">
                Start Chatting
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          {!isSignedIn && (
            <p className="text-sm text-gray-400">
              Try it free (No login required for first 3 messages)
            </p>
          )}
        </div>
      </main>
    </div>
  );
}