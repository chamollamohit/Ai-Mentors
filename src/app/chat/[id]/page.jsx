"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
    Send,
    ArrowLeft,
    User,
    Bot,
    Loader2,
    PlusCircle,
    Menu,
    Lock,
    MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { PERSONAS, FREE_LIMIT } from "@/lib/constants";

export default function ChatPage() {
    const { id: chatId } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isSignedIn, user } = useUser();

    // -- State --
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Sidebar & History
    const [chatHistory, setChatHistory] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Guest Limit
    const [guestMsgCount, setGuestMsgCount] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const bottomRef = useRef(null);

    // 1. INITIALIZE CHAT
    useEffect(() => {
        const initChat = async () => {
            if (chatId === "new") {
                const personaKey = searchParams.get("persona");
                const persona = PERSONAS[personaKey] || PERSONAS["hitesh"];
                setSelectedPersona(persona);
                setMessages([{ role: "assistant", content: persona.greeting }]);
            } else {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/conversations/${chatId}`);
                    const data = await res.json();

                    if (data.messages) {
                        // Default fallback if persona isn't saved in msg
                        setSelectedPersona(PERSONAS["hitesh"]);
                        setMessages(data.messages);
                    }
                } catch (e) {
                    console.error("Failed to load chat", e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        initChat();
        setSidebarOpen(false);
    }, [chatId, searchParams]);

    // 2. LOAD SIDEBAR HISTORY
    useEffect(() => {
        if (isSignedIn) {
            fetch("/api/conversations")
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) setChatHistory(data);
                });
        }
    }, [isSignedIn, chatId]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // --- HANDLERS ---
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!input.trim() || isLoading) return;

        if (!isSignedIn) {
            if (guestMsgCount >= FREE_LIMIT) {
                setShowLoginModal(true);
                return;
            }
            setGuestMsgCount((prev) => prev + 1);
        }

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const activeId = chatId === "new" ? null : chatId;
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    persona: selectedPersona.name,
                    conversationId: activeId,
                }),
            });

            const data = await res.json();

            if (chatId === "new" && data.conversationId) {
                router.replace(`/chat/${data.conversationId}`);
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Error connecting to AI." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!selectedPersona)
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        );

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* SIDEBAR */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-30 w-72 bg-gray-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full p-4">
                    <div className="flex items-center justify-between mb-6 pl-2">
                        <div className="font-bold text-lg text-gray-700 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />{" "}
                            Chats
                        </div>
                        <button
                            onClick={() => router.push("/select")}
                            className="p-2 hover:bg-gray-200 rounded-lg text-gray-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() =>
                            router.push(
                                `/chat/new?persona=${selectedPersona.id}`
                            )
                        }
                        className="flex items-center gap-2 w-full p-3 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm rounded-xl transition-all text-gray-600 font-medium mb-6"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>New Conversation</span>
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-thin">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pl-2">
                            History
                        </div>
                        {chatHistory.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => router.push(`/chat/${chat.id}`)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg text-sm transition-all truncate border border-transparent",
                                    chatId === chat.id
                                        ? "bg-white shadow-md border-gray-100 text-indigo-600 font-medium"
                                        : "text-gray-600 hover:bg-gray-200/50"
                                )}
                            >
                                {chat.title}
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-200">
                        {isSignedIn ? (
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200/50 transition">
                                <UserButton afterSignOutUrl="/" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-medium text-gray-700 truncate">
                                        {user?.fullName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Free Plan
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-indigo-50 p-4 rounded-xl">
                                <SignInButton mode="modal">
                                    <button className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg">
                                        Login to save
                                    </button>
                                </SignInButton>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* MOBILE OVERLAY */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* RIGHT SIDE: CHAT AREA */}
            <div
                className={cn(
                    "flex-1 flex flex-col relative bg-white/50",
                    selectedPersona.chatBg
                )}
            >
                {/* Header */}
                <header className="flex-none h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <img
                                src={selectedPersona.avatar}
                                alt="Avatar"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                            />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm leading-tight">
                                {selectedPersona.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                                Always active
                            </p>
                        </div>
                    </div>
                    {!isSignedIn && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                            <span className="text-xs font-medium text-gray-600">
                                {FREE_LIMIT - guestMsgCount} free messages
                            </span>
                        </div>
                    )}
                </header>

                {/* MESSAGES LIST */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.map((msg, idx) => {
                            const isUser = msg.role === "user";
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500",
                                        isUser ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex gap-4 max-w-[85%] md:max-w-[75%]",
                                            isUser
                                                ? "flex-row-reverse"
                                                : "flex-row"
                                        )}
                                    >
                                        {/* AVATAR */}
                                        <div className="flex-shrink-0 mt-1">
                                            {isUser ? (
                                                isSignedIn && user?.imageUrl ? (
                                                    <img
                                                        src={user.imageUrl}
                                                        alt="Me"
                                                        className="w-8 h-8 rounded-full border border-gray-200 shadow-sm object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                )
                                            ) : (
                                                <img
                                                    src={selectedPersona.avatar}
                                                    alt="Mentor"
                                                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm object-cover"
                                                />
                                            )}
                                        </div>

                                        {/* BUBBLE CONTENT - FIXED MARKDOWN */}
                                        <div
                                            className={cn(
                                                "p-4 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm",
                                                isUser
                                                    ? cn(
                                                          selectedPersona.userBubble,
                                                          "text-white rounded-tr-none shadow-md"
                                                      )
                                                    : cn(
                                                          selectedPersona.botBubble,
                                                          "text-gray-800 rounded-tl-none"
                                                      )
                                            )}
                                        >
                                            {isUser ? (
                                                msg.content
                                            ) : (
                                                /* --- FIX APPLIED HERE --- */
                                                <div className="prose prose-sm max-w-none wrap-break-word">
                                                    <ReactMarkdown>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* LOADING STATE */}
                        {isLoading && (
                            <div className="flex w-full justify-start animate-pulse">
                                <div className="flex gap-4">
                                    <img
                                        src={selectedPersona.avatar}
                                        className="w-8 h-8 rounded-full mt-1 opacity-50 grayscale"
                                        alt="Loading..."
                                    />
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center h-12">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                </div>

                {/* Input Area */}
                <footer className="flex-none p-4 md:p-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative flex items-end gap-2 bg-white p-2 rounded-[24px] border border-gray-200 shadow-lg shadow-gray-100 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                                placeholder={
                                    isSignedIn
                                        ? "Type a message..."
                                        : `Type a message (${
                                              FREE_LIMIT - guestMsgCount
                                          } left)...`
                                }
                                disabled={isLoading}
                                className="w-full max-h-32 min-h-[50px] p-3 bg-transparent border-0 focus:ring-0 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "p-3 rounded-full text-white shadow-md transition-all mb-1 mr-1 focus:outline-none",
                                    !input.trim()
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : cn(
                                              "bg-linear-to-r hover:scale-105 hover:shadow-lg",
                                              selectedPersona.gradient
                                          )
                                )}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </footer>

                {/* Login Modal */}
                {showLoginModal && !isSignedIn && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
                            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Limit Reached
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                                You&apos;ve used your 3 free messages. Sign in
                                to continue!
                            </p>
                            <div className="space-y-3">
                                <SignUpButton mode="modal">
                                    <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition">
                                        Create Free Account
                                    </button>
                                </SignUpButton>
                                <button
                                    onClick={() => setShowLoginModal(false)}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
