"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { PERSONAS } from "@/lib/constants";

export default function SelectionPage() {
    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col">
            <header className="px-6 h-16 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-10">
                <Link
                    href="/"
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back</span>
                </Link>
                <UserButton />
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="max-w-5xl w-full space-y-10">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Choose Your Mentor
                        </h1>
                        <p className="text-gray-500">
                            Select an AI persona to start a new session.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(PERSONAS).map(([key, persona]) => (
                            <Link
                                href={`/chat/new?persona=${key}`}
                                key={key}
                                className="block h-full"
                            >
                                <div
                                    className={cn(
                                        "group h-full relative bg-white rounded-3xl p-1 border border-gray-200",
                                        "hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 cursor-pointer"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative h-full bg-white rounded-[20px] p-8 flex flex-col items-center text-center z-10">
                                        <div className="relative mb-6">
                                            <div
                                                className={cn(
                                                    "absolute -inset-2 bg-gradient-to-r rounded-full opacity-0 group-hover:opacity-70 blur-md transition duration-500",
                                                    persona.gradient
                                                )}
                                            />
                                            <img
                                                src={persona.avatar}
                                                alt={persona.name}
                                                className="relative w-28 h-28 rounded-full border-4 border-white shadow-sm object-cover"
                                            />
                                            <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
                                            {persona.name}
                                        </h3>

                                        <p className="text-gray-500 leading-relaxed mb-8 flex-1">
                                            {persona.description}
                                        </p>

                                        <div className="w-full py-3 rounded-xl bg-gray-50 group-hover:bg-indigo-50 text-gray-600 group-hover:text-indigo-600 font-semibold transition-colors flex items-center justify-center gap-2">
                                            <MessageCircle className="w-5 h-5" />
                                            Start Conversation
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
