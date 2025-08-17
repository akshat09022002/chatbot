import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAuthenticationStatus,
  useNhostClient,
  useSignOut,
  useUserData,
} from "@nhost/react";
import {
  createChat,
  getChats,
  getMessages,
  sendMessage,
  initateAction,
  deleteMessage,
} from "../lib/graphQL-config";
import { useSubscription } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const { signOut } = useSignOut();
  const user = useUserData();
  const navigate = useNavigate();
  const nhost = useNhostClient();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef(null);
  const { data, loading, error } = useSubscription(getMessages, {
    variables: { chat_id: activeChatId },
    skip: !activeChatId,
  });
  const {
    data: chatsData,
    loading: chatsLoading,
    error: chatsError,
  } = useSubscription(getChats);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate, isLoading]);

  useEffect(() => {
    // console.log("chatsData", chatsData);
    if (chatsData?.chats) setChats(chatsData?.chats);
  }, [chatsData, nhost]);

  useEffect(() => {
    // const fetchMessages = async () => {
    //   if (!activeChatId) return
    //   // const { data, error } = await nhost.graphql.request(getMessages, { chat_id: activeChatId })
    //   // if (!error) setMessages(data?.messages || [])
    // }
    // fetchMessages()
    if (data?.messages) setMessages(data?.messages);
  }, [data, nhost]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  useEffect(() => {
    // Close mobile sidebar when a chat is selected
    if (activeChatId) setIsSidebarOpen(false);
  }, [activeChatId]);

  const startNewChat = async () => {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setIsSidebarOpen(false);
    setIsBotTyping(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);

    try {
      let chatId = activeChatId;
      if (!chatId) {
        const { data, error } = await nhost.graphql.request(createChat, {
          title: input.trim(),
        });
        if (error) throw error;
        // console.log("create chat data", data);
        chatId = data?.insert_chats_one?.id;
        setActiveChatId(chatId);
      }

      // setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, role: 'user', content: input.trim() }])
      const currentInput = input.trim();
      setInput("");

      const { data, error } = await nhost.graphql.request(sendMessage, {
        chat_id: chatId,
        content: currentInput,
      });
      if (error) throw error;

      setIsBotTyping(true);
      const { data: initateActionData, error: initateActionError } =
        await nhost.graphql.request(initateAction, {
          chat_id: chatId,
          step: "user",
          context: currentInput,
        });
      // console.log("send message data", data);
      // console.log("initateAction data", initateActionData);

      if (initateActionError) {
        const { data: deleteMessageData, error: deleteMessageError } = await nhost.graphql.request(deleteMessage, {
          id: data?.insert_messages_one?.id,
        });
        if (deleteMessageError) throw deleteMessageError;
        // console.log("delete message data", deleteMessageData);
        throw initateActionError;
      }

      // // Poll messages briefly to simulate typing and fetch assistant reply
      // const pollUntil = Date.now() + 120000
      // while (Date.now() < pollUntil) {
      //   const { data, error } = await nhost.graphql.request(getMessages, { chat_id: chatId })
      //   if (!error) {
      //     const msgs = data?.messages || []
      //     setMessages(msgs)
      //     const hasAssistant = msgs.some((m) => m.role !== 'user')
      //     if (hasAssistant) break
      //   }
      //   await new Promise((r) => setTimeout(r, 1200))
      // }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
      setIsBotTyping(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  const sidebarVariants = {
    closed: { x: "-100%" },
    open: { x: 0 },
  };

  const overlayVariants = {
    closed: { opacity: 0, pointerEvents: "none" },
    open: { opacity: 1, pointerEvents: "auto" },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex max-h-[100vh] overflow-hidden"
    >
      {/* Desktop Sidebar */}
      <motion.aside
        variants={itemVariants}
        className="w-72 border-r border-white/10 p-4 hidden md:flex flex-col gap-3 bg-slate-900/50 backdrop-blur-xl overflow-hidden"
      >
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={startNewChat}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 px-4 py-3 text-sm font-medium shadow-lg hover:shadow-indigo-500/25"
        >
          ✨ New Chat
        </motion.button>
        
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {chats.map((c, index) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveChatId(c.id)}
              className={`w-[90%] text-left px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 overflow-hidden ${
                activeChatId === c.id
                  ? "bg-gradient-to-r from-white/20 to-white/10 border border-white/20 shadow-lg"
                  : ""
              }`}
            >
              <div className="text-sm font-medium truncate">{c.title}</div>
              <div className="text-xs text-slate-400 mt-1">
                {new Date(c.updated_at).toLocaleString()}
              </div>
            </motion.button>
          ))}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSignOut}
          className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 px-4 py-3 text-sm font-medium shadow-lg hover:shadow-red-500/25"
        >
           Sign out
        </motion.button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="closed"
        animate={isSidebarOpen ? "open" : "closed"}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 p-4 flex md:hidden flex-col gap-3 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-white">💬 Chats</div>
          
        </div>
        
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={startNewChat}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 px-4 py-3 text-sm font-medium shadow-lg"
        >
          ✨ New Chat
        </motion.button>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {chats.map((c, index) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveChatId(c.id)}
              className={`w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 overflow-hidden ${
                activeChatId === c.id
                  ? "bg-gradient-to-r from-white/20 to-white/10 border border-white/20"
                  : "hover:border hover:border-white/5"
              }`}
            >
              <div className="text-sm font-medium truncate">{c.title}</div>
              <div className="text-xs text-slate-400 mt-1">
                {new Date(c.updated_at).toLocaleString()}
              </div>
            </motion.button>
          ))}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSignOut}
          className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 px-4 py-3 text-sm font-medium shadow-lg"
        >
          Sign out
        </motion.button>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        variants={itemVariants}
        className="flex-1 flex flex-col bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm overflow-hidden"
      >
        {/* Header */}
        <motion.header
          className="border-b border-white/10 px-6 py-4 bg-white/5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 p-3 transition-all duration-200 hover:shadow-lg"
              onClick={() => setIsSidebarOpen((v) => !v)}
              aria-label="Open sidebar"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6H20M4 12H20M4 18H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </motion.button>
            
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent"
            >
              Hello{user?.displayName ? `, ${user.displayName}` : ""} 👋
            </motion.h1>
          </div>
        </motion.header>

        {/* Messages Container */}
        <motion.div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {/* Intro Banner for New Chats */}
          {messages.length === 0 && !isBotTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="max-w-2xl mx-auto text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl"
              >
                {/* Welcome Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <span className="text-3xl">🤖</span>
                </motion.div>

                {/* Welcome Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-4"
                >
                  Welcome to ChatBot! ✨
                </motion.h2>

                {/* Welcome Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-300 text-lg mb-8 leading-relaxed"
                >
                  Your AI-powered conversation companion that thinks before it speaks
                </motion.p>

                {/* How It Works Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-6"
                >
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                      How It Works
                    </h3>
                    
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-indigo-400 text-sm font-bold">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">Planning Phase</h4>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            I analyze your request and create a detailed plan using a feedback loop to ensure optimal understanding.
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-purple-400 text-sm font-bold">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">Output Generation</h4>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            Based on the refined plan, I generate a comprehensive and accurate response tailored to your needs.
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Note about Response Time */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-400">⏱️</span>
                      <span className="text-amber-300 font-medium">Response Time</span>
                    </div>
                    <p className="text-amber-200 text-sm">
                      Output generation may take a moment as I work through the two-step feedback loop to provide you with the best possible response.
                    </p>
                  </motion.div>

                  {/* Sidebar Access Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-400">💬</span>
                      <span className="text-blue-300 font-medium">Access Your Chats</span>
                    </div>
                    <p className="text-blue-200 text-sm">
                      You can access your recent conversations and start new chats using the sidebar. All your chat history is safely stored and easily accessible.
                    </p>
                  </motion.div>
                </motion.div>

                {/* Start Chatting CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="mt-8"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(99, 102, 241, 0.4)",
                        "0 0 0 10px rgba(99, 102, 241, 0)",
                        "0 0 0 0 rgba(99, 102, 241, 0)"
                      ]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="inline-block"
                  >
                    <div className="text-indigo-400 text-sm font-medium">
                      ↓ Start typing below to begin your conversation ↓
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Existing Messages */}
          {messages.map((m, index) => {
            const role = m.sender ?? m.role;
            const isUser = role === "user";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={`flex w-full ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className={`px-6 py-4 rounded-2xl max-w-[70%] lg:max-w-[50%] whitespace-pre-wrap break-words leading-relaxed shadow-lg overflow-hidden ${
                    isUser
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border border-indigo-400/30"
                      : "bg-gradient-to-r from-white/15 to-white/10 text-white border border-white/20 backdrop-blur-sm"
                  }`}
                >
                  {m.content}
                </motion.div>
              </motion.div>
            );
          })}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isBotTyping && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex w-full justify-start"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-white/15 to-white/10 border border-white/20 backdrop-blur-sm inline-flex gap-2"
                >
                  <motion.span
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                  <motion.span
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                  <motion.span
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Input Container */}
        <motion.div
          className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-sm w-full"
        >
          <div className="max-w-3xl mx-auto flex gap-4">
            <motion.input
              whileFocus={{ scale: 1.01 }}
              className="flex-1 rounded-xl bg-slate-900/60 border border-white/20 px-6 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all duration-200 shadow-lg"
              placeholder={
                activeChatId
                  ? "💬 Send a message..."
                  : "🚀 Send a message to start a new chat..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              disabled={isSending}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-slate-600 disabled:to-slate-700 transition-all duration-200 px-6 py-4 text-sm font-medium disabled:opacity-60 shadow-lg hover:shadow-indigo-500/25 disabled:shadow-none"
            >
              {isSending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                "Send"
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.main>
    </motion.div>
  );
}
