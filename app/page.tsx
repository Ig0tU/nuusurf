"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatFeed from "./components/ChatFeed";
import AnimatedButton from "./components/AnimatedButton";
import { ThemeToggle } from "./components/ThemeToggle";
import { AgentAvatar } from "./components/AgentAvatar";
import Image from "next/image";
import posthog from "posthog-js";
import { 
  Sparkles, 
  Zap, 
  Brain, 
  Globe, 
  TrendingUp, 
  Search,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group">
      {children}
      <motion.span 
        className="absolute hidden group-hover:block w-auto px-3 py-2 min-w-max left-1/2 -translate-x-1/2 translate-y-3 glass-card text-white text-xs rounded-lg font-ppsupply z-50"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {text}
      </motion.span>
    </div>
  );
};

const FloatingParticle = ({ delay = 0 }: { delay?: number }) => {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <motion.div
      className="absolute w-1 h-1 bg-primary-400/30 rounded-full"
      initial={{ 
        x: Math.random() * dimensions.width,
        y: dimensions.height + 10,
        opacity: 0 
      }}
      animate={{
        y: -10,
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

export default function Home() {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle CMD+Enter to submit the form when chat is not visible
      if (!isChatVisible && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const form = document.querySelector("form") as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }

      // Handle CMD+K to focus input when chat is not visible
      if (!isChatVisible && (e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.querySelector(
          'input[name="message"]'
        ) as HTMLInputElement;
        if (input) {
          input.focus();
          toast.success("Input focused! Start typing your query.", {
            icon: "⌨️",
            duration: 2000,
          });
        }
      }

      // Handle ESC to close chat when visible
      if (isChatVisible && e.key === "Escape") {
        e.preventDefault();
        setIsChatVisible(false);
      }

      // Handle Space for voice input
      if (!isChatVisible && e.code === "Space" && e.ctrlKey) {
        e.preventDefault();
        toggleVoiceInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChatVisible, isListening]);

  const toggleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      toast.success("Voice input activated! Speak your query.", {
        icon: "🎤",
        duration: 3000,
      });
      // Simulate voice input for demo
      setTimeout(() => {
        setIsListening(false);
        toast.success("Voice input captured!", {
          icon: "✅",
          duration: 2000,
        });
      }, 3000);
    } else {
      setIsListening(false);
      toast.error("Voice input stopped.", {
        icon: "🔇",
        duration: 2000,
      });
    }
  };

  const startChat = useCallback(
    (finalMessage: string) => {
      setInitialMessage(finalMessage);
      setIsChatVisible(true);

      try {
        posthog.capture("submit_message", {
          message: finalMessage,
        });
        toast.success("Agent activated! Watch the magic happen.", {
          icon: "🚀",
          duration: 3000,
        });
      } catch (e) {
        console.error(e);
        toast.error("Something went wrong. Please try again.", {
          icon: "❌",
          duration: 3000,
        });
      }
    },
    [setInitialMessage, setIsChatVisible]
  );

  const exampleQueries = [
    {
      text: "Who is the top contributor to Stagehand?",
      query: "Who is the top GitHub contributor to Stagehand by Browserbase?",
      icon: <Brain className="w-4 h-4" />,
      gradient: "from-blue-500 to-purple-600"
    },
    {
      text: "How many wins do the 49ers have?",
      query: "How many wins do the 49ers have?",
      icon: <TrendingUp className="w-4 h-4" />,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      text: "What is Stephen Curry's PPG?",
      query: "What is Stephen Curry's PPG?",
      icon: <Zap className="w-4 h-4" />,
      gradient: "from-yellow-500 to-orange-600"
    },
    {
      text: "How much is NVIDIA stock?",
      query: "How much is NVIDIA stock?",
      icon: <Globe className="w-4 h-4" />,
      gradient: "from-purple-500 to-pink-600"
    }
  ];

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'glass-card text-white',
          duration: 3000,
        }}
      />
      
      <AnimatePresence mode="wait">
        {!isChatVisible ? (
          <motion.div 
            className="min-h-screen relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 mesh-gradient opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-accent-50/30 to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
            
            {/* Floating Particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <FloatingParticle key={i} delay={i * 0.5} />
            ))}

            {/* Mouse Follower */}
            <motion.div
              className="fixed w-6 h-6 bg-primary-400/20 rounded-full pointer-events-none z-50 mix-blend-difference"
              animate={{
                x: mousePosition.x - 12,
                y: mousePosition.y - 12,
              }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
            />

            {/* Top Navigation */}
            <motion.nav 
              className="relative z-10 flex justify-between items-center px-8 py-6 glass-card border-b border-white/10"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="flex items-center gap-4"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="relative">
                  <Image
                    src="/favicon.svg"
                    alt="Open Operator"
                    className="w-10 h-10 floating-element"
                    width={40}
                    height={40}
                  />
                  <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-lg animate-pulse" />
                </div>
                <div>
                  <h1 className="font-ppneue text-xl font-bold aurora-text">
                    Open Operator
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-ppsupply">
                    Next-Gen AI Web Agent
                  </p>
                </div>
              </motion.div>
              
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <motion.a
                  href="https://github.com/browserbase/open-operator"
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatedButton 
                    variant="glass" 
                    size="md"
                    className="flex items-center gap-2"
                  >
                    <Image
                      src="/github.svg"
                      alt="GitHub"
                      width={18}
                      height={18}
                    />
                    View GitHub
                  </AnimatedButton>
                </motion.a>
              </div>
            </motion.nav>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 min-h-[calc(100vh-100px)]">
              <motion.div 
                className="w-full max-w-4xl"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {/* Hero Section */}
                <div className="text-center mb-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mb-8"
                  >
                    <AgentAvatar 
                      state="idle" 
                      message="Ready to browse the web for you!"
                      confidence={0.95}
                    />
                  </motion.div>
                  
                  <motion.h1 
                    className="text-6xl md:text-7xl font-ppneue font-bold mb-6 aurora-text"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    AI Web Agent
                  </motion.h1>
                  
                  <motion.p 
                    className="text-xl md:text-2xl font-ppsupply text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                  >
                    Watch AI browse the web with unprecedented intelligence and precision.
                    <span className="block text-lg mt-2 text-primary-500 font-medium">
                      Powered by advanced reasoning and real-time adaptation.
                    </span>
                  </motion.p>
                </div>

                {/* Main Interface */}
                <motion.div 
                  className="glass-card rounded-3xl p-8 shadow-3xl border border-white/20 backdrop-blur-xl"
                  initial={{ y: 50, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  whileHover={{ y: -5 }}
                >
                  {/* Browser Window Header */}
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Tooltip text="Ready to amaze you! 🚀">
                        <motion.div 
                          className="w-4 h-4 rounded-full bg-emerald-500 shadow-neon-sm"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </Tooltip>
                      <Tooltip text="Powered by Browserbase 🅱️">
                        <motion.div 
                          className="w-4 h-4 rounded-full bg-yellow-500 shadow-neon-sm"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                        />
                      </Tooltip>
                      <Tooltip text="Built with Stagehand 🤘">
                        <motion.div 
                          className="w-4 h-4 rounded-full bg-red-500 shadow-neon-sm"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                        />
                      </Tooltip>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 font-ppsupply">
                        AI Web Browser Interface
                      </span>
                    </div>
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const input = e.currentTarget.querySelector(
                        'input[name="message"]'
                      ) as HTMLInputElement;
                      const message = (formData.get("message") as string).trim();
                      const finalMessage = message || input.placeholder;
                      startChat(finalMessage);
                    }}
                    className="mb-8"
                  >
                    <div className="relative group">
                      <motion.input
                        name="message"
                        type="text"
                        placeholder="What would you like me to discover on the web?"
                        className="w-full px-6 py-4 pr-32 glass text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ppsupply text-lg rounded-xl transition-all duration-300"
                        whileFocus={{ scale: 1.02 }}
                      />
                      
                      {/* Voice Input Button */}
                      <motion.button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={`absolute right-20 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-300 ${
                          isListening 
                            ? "bg-red-500 text-white shadow-neon" 
                            : "glass hover:bg-white/20 text-gray-600 dark:text-gray-400"
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </motion.button>

                      <AnimatedButton 
                        type="submit" 
                        variant="gradient"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        icon={<Sparkles className="w-4 h-4" />}
                      >
                        Launch
                      </AnimatedButton>
                    </div>
                    
                    {/* Keyboard Shortcuts */}
                    <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400 font-ppsupply">
                      <span>⌘+K to focus</span>
                      <span>⌘+Enter to submit</span>
                      <span>Ctrl+Space for voice</span>
                    </div>
                  </form>

                  {/* Example Queries */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exampleQueries.map((example, index) => (
                      <motion.button
                        key={index}
                        onClick={() => startChat(example.query)}
                        className="group p-4 glass hover:bg-white/20 transition-all duration-300 rounded-xl text-left border border-white/10 hover:border-white/30"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${example.gradient} text-white`}>
                            {example.icon}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-ppsupply group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {example.text}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${example.gradient} rounded-full`}
                            initial={{ width: 0 }}
                            whileHover={{ width: "100%" }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Footer */}
                <motion.div 
                  className="text-center mt-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.8 }}
                >
                  <p className="text-lg font-ppsupply text-gray-600 dark:text-gray-400">
                    Powered by{" "}
                    <motion.a
                      href="https://stagehand.dev"
                      className="aurora-text font-bold hover:underline"
                      whileHover={{ scale: 1.05 }}
                    >
                      🤘 Stagehand
                    </motion.a>{" "}
                    on{" "}
                    <motion.a
                      href="https://browserbase.com"
                      className="aurora-text font-bold hover:underline"
                      whileHover={{ scale: 1.05 }}
                    >
                      🅱️ Browserbase
                    </motion.a>
                  </p>
                </motion.div>
              </motion.div>
            </main>
          </motion.div>
        ) : (
          <ChatFeed
            initialMessage={initialMessage}
            onClose={() => setIsChatVisible(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
