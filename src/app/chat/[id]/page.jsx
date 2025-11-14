"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    Send,
    ArrowLeft,
    User,
    Loader2,
    PlusCircle,
    Menu,
    Lock,
    MessageSquare,
    Trash2,
    Copy,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { PERSONAS, FREE_LIMIT } from "@/lib/constants";
import Image from "next/image";

const CodeBlock = ({ language, value }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="w-full my-4 overflow-hidden rounded-lg border border-gray-200 bg-[#282a36]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/10 border-b border-white/10">
                <span className="text-xs font-medium text-gray-300 lowercase">
                    {language}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                    title="Copy code"
                >
                    {isCopied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <div className="overflow-x-auto">
                <SyntaxHighlighter
                    style={dracula}
                    language={language}
                    PreTag="div"
                    customStyle={{
                        margin: 0,
                        padding: "1rem",
                        background: "transparent",
                        fontSize: "0.85rem",
                    }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export default function ChatPage() {
    const { id: chatId } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isSignedIn, user } = useUser();

    const [selectedPersona, setSelectedPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [chatHistory, setChatHistory] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [guestMsgCount, setGuestMsgCount] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const bottomRef = useRef(null);

    // 1. INITIALIZE CHAT
    useEffect(() => {
        const initChat = async () => {
            const personaKey = searchParams.get("persona");
            const persona = PERSONAS[personaKey] || PERSONAS["hitesh"];
            setSelectedPersona(persona);

            if (chatId === "new") {
                const guestStorageKey = `guest-chat-${persona.id}`;
                const guestChatHistory = localStorage.getItem(guestStorageKey);

                if (isSignedIn && guestChatHistory) {
                    const messages = JSON.parse(guestChatHistory);
                    setMessages(messages);
                    setGuestMsgCount(Math.floor(messages.length / 2));
                } else if (guestChatHistory) {
                    const messages = JSON.parse(guestChatHistory);
                    const guestMessageCount = messages.filter(
                        (msg) => msg.role === "user"
                    );

                    setMessages([...messages]);
                    setGuestMsgCount(guestMessageCount.length);
                } else {
                    setMessages([
                        { role: "assistant", content: persona.greeting },
                    ]);
                }
            } else {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/conversations/${chatId}`);
                    const data = await res.json();

                    if (data.messages) {
                        const dbPersonaName = data.persona;
                        const foundPersona = Object.values(PERSONAS).find(
                            (p) => p.name === dbPersonaName
                        );
                        setSelectedPersona(foundPersona || PERSONAS["hitesh"]);
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
    }, [chatId, searchParams, isSignedIn]);

    // 2. LOAD SIDEBAR
    useEffect(() => {
        if (isSignedIn) {
            fetch("/api/conversations")
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) setChatHistory(data);
                });
        }
    }, [isSignedIn, chatId]);

    //  Remove Chat History from LocalStorage if user logged in
    useEffect(() => {
        if (isSignedIn && selectedPersona) {
            localStorage.removeItem(`guest-chat-${selectedPersona.id}`);
        }
    }, [isSignedIn, selectedPersona]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // --- HANDLERS ---
    const handleDeleteChat = async (e, chatIdToDelete) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this chat?")) return;

        setChatHistory((prev) =>
            prev.filter((chat) => chat.id !== chatIdToDelete)
        );

        try {
            await fetch(`/api/conversations/${chatIdToDelete}`, {
                method: "DELETE",
            });
            if (chatId === chatIdToDelete) {
                router.push(
                    `/chat/new?persona=${selectedPersona?.id || "hitesh"}`
                );
            }
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Could not delete chat.");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        try {
            if (!isSignedIn) {
                if (guestMsgCount >= FREE_LIMIT) {
                    setShowLoginModal(true);
                    return;
                }
            }
            setIsLoading(true);

            const userMessage = { role: "user", content: input };
            const newHistory = [...messages, userMessage]; // Full history

            setMessages(newHistory);
            setInput("");

            const activeId = chatId === "new" ? null : chatId;
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newHistory,
                    persona: selectedPersona.name,
                    conversationId: activeId,
                }),
            });

            const data = await res.json();

            if (chatId === "new" && data.conversationId) {
                router.replace(`/chat/${data.conversationId}`);
                if (isSignedIn) {
                    fetch("/api/conversations")
                        .then((r) => r.json())
                        .then(setChatHistory);
                }
            }
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply },
            ]);

            if (!isSignedIn) {
                const finalHistory = [
                    ...newHistory,
                    { role: "assistant", content: data.reply },
                ];
                setGuestMsgCount((prev) => prev + 1);
                localStorage.setItem(
                    `guest-chat-${selectedPersona.id}`,
                    JSON.stringify(finalHistory)
                );
            }
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
        <div className="flex h-[100dvh] overflow-hidden bg-white">
            {/* SIDEBAR */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-30 w-72 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full p-4">
                    <div className="flex items-center justify-between mb-6 pl-2">
                        <div className="font-bold text-lg flex items-center gap-2 text-white">
                            <MessageSquare className="w-5 h-5 text-indigo-400" />{" "}
                            Chats
                        </div>
                        <button
                            onClick={() => router.push("/select")}
                            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"
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
                        className="flex items-center gap-2 w-full p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition mb-6"
                    >
                        <PlusCircle className="w-5 h-5" />{" "}
                        <span>New Conversation</span>
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-thin">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pl-2">
                            History
                        </div>
                        {chatHistory.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => router.push(`/chat/${chat.id}`)}
                                className={cn(
                                    "group relative flex items-center justify-between w-full p-3 rounded-lg text-sm transition-all cursor-pointer",
                                    chatId === chat.id
                                        ? "bg-gray-800 text-white"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                )}
                            >
                                <span className="truncate pr-6">
                                    {chat.title}
                                </span>
                                <button
                                    onClick={(e) =>
                                        handleDeleteChat(e, chat.id)
                                    }
                                    className="absolute right-2 p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-800">
                        {isSignedIn ? (
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition">
                                <UserButton />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm text-gray-300 truncate">
                                        {user?.fullName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Free Plan
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-indigo-900/50 p-4 rounded-xl">
                                <SignInButton mode="modal">
                                    <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg">
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
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* RIGHT SIDE: CHAT AREA */}
            <div
                className={cn(
                    "flex-1 flex flex-col relative bg-white/50 min-w-0",
                    selectedPersona.chatBg
                )}
            >
                <header className="flex-none h-16 px-4 md:px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <Image
                                src={selectedPersona.avatar}
                                alt="Avatar"
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm"
                                width={50}
                                height={50}
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm leading-tight">
                                {selectedPersona.name}
                            </h3>
                            <p className="text-[10px] md:text-xs text-gray-500">
                                Always active
                            </p>
                        </div>
                    </div>
                    {!isSignedIn && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
                            <span className="text-[10px] md:text-xs font-medium text-gray-600">
                                {FREE_LIMIT - guestMsgCount} left
                            </span>
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
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
                                            "flex gap-3 md:gap-4 max-w-[90%] md:max-w-[80%]",
                                            isUser
                                                ? "flex-row-reverse"
                                                : "flex-row"
                                        )}
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            {isUser ? (
                                                isSignedIn && user?.imageUrl ? (
                                                    <Image
                                                        src={user.imageUrl}
                                                        alt="Me"
                                                        className="w-8 h-8 rounded-full border border-gray-200 shadow-sm object-cover"
                                                        height={50}
                                                        width={50}
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                )
                                            ) : (
                                                <Image
                                                    src={selectedPersona.avatar}
                                                    alt="Mentor"
                                                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm object-cover"
                                                    width={50}
                                                    height={50}
                                                />
                                            )}
                                        </div>

                                        <div
                                            className={cn(
                                                "p-3 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm overflow-hidden min-w-0",
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
                                                <div className="prose prose-sm max-w-none w-full wrap-break-word dark:prose-invert">
                                                    <ReactMarkdown
                                                        components={{
                                                            code({
                                                                node,
                                                                inline,
                                                                className,
                                                                children,
                                                                ...props
                                                            }) {
                                                                const match =
                                                                    /language-(\w+)/.exec(
                                                                        className ||
                                                                            ""
                                                                    );
                                                                return !inline &&
                                                                    match ? (
                                                                    <CodeBlock
                                                                        language={
                                                                            match[1]
                                                                        }
                                                                        value={String(
                                                                            children
                                                                        ).replace(
                                                                            /\n$/,
                                                                            ""
                                                                        )}
                                                                    />
                                                                ) : (
                                                                    <code
                                                                        className={cn(
                                                                            "bg-black/10 text-red-600 rounded px-1 py-0.5 text-sm font-mono",
                                                                            className
                                                                        )}
                                                                        {...props}
                                                                    >
                                                                        {
                                                                            children
                                                                        }
                                                                    </code>
                                                                );
                                                            },
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {isLoading && (
                            <div className="flex w-full justify-start animate-pulse">
                                <div className="flex gap-4">
                                    <Image
                                        src={selectedPersona.avatar}
                                        className="w-8 h-8 rounded-full mt-1 opacity-50 grayscale"
                                        alt="Loading..."
                                        width={40}
                                        height={40}
                                    />
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center h-12">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                </div>

                <footer className="flex-none p-3 md:p-6 bg-white/80 backdrop-blur-sm md:bg-transparent">
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
                                    user
                                        ? `Type a message....`
                                        : `Only ${
                                              FREE_LIMIT - guestMsgCount
                                          } message remaining`
                                }
                                disabled={isLoading}
                                className="w-full max-h-32 min-h-[44px] p-2 md:p-3 bg-transparent border-0 focus:ring-0 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none text-sm md:text-base"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "p-2 md:p-3 rounded-full text-white shadow-md transition-all mb-1 mr-1 focus:outline-none shrink-0",
                                    !input.trim()
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : cn(
                                              "bg-linear-to-r hover:scale-105 hover:shadow-lg",
                                              selectedPersona.gradient
                                          )
                                )}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 md:w-5 md:h-5" />
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
