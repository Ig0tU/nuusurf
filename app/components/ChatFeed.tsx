"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { useWindowSize } from "usehooks-ts";
import Image from "next/image";
import { useAtom } from "jotai/react";
import { contextIdAtom } from "../atoms";
import { AgentAvatar } from "./AgentAvatar";
import { ThemeToggle } from "./ThemeToggle";
import AnimatedButton from "./AnimatedButton";
import posthog from "posthog-js";
import { X, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
interface ChatFeedProps {
  initialMessage?: string;
  onClose: () => void;
  url?: string;
}

export interface BrowserStep {
  text: string;
  reasoning: string;
  tool: "GOTO" | "ACT" | "EXTRACT" | "OBSERVE" | "CLOSE" | "WAIT" | "NAVBACK";
  instruction: string;
  stepNumber?: number;
}

interface AgentState {
  sessionId: string | null;
  sessionUrl: string | null;
  steps: BrowserStep[];
  isLoading: boolean;
}

export default function ChatFeed({ initialMessage, onClose }: ChatFeedProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;
  const initializationRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAgentFinished, setIsAgentFinished] = useState(false);
  const [contextId, setContextId] = useAtom(contextIdAtom);
  const agentStateRef = useRef<AgentState>({
    sessionId: null,
    sessionUrl: null,
    steps: [],
    isLoading: false,
  });

  const [uiState, setUiState] = useState<{
    sessionId: string | null;
    sessionUrl: string | null;
    steps: BrowserStep[];
  }>({
    sessionId: null,
    sessionUrl: null,
    steps: [],
  });

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (
      uiState.steps.length > 0 &&
      uiState.steps[uiState.steps.length - 1].tool === "CLOSE"
    ) {
      setIsAgentFinished(true);
      fetch("/api/session", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: uiState.sessionId,
        }),
      });
    }
  }, [uiState.sessionId, uiState.steps]);

  useEffect(() => {
    scrollToBottom();
  }, [uiState.steps, scrollToBottom]);

  useEffect(() => {
    console.log("useEffect called");
    const initializeSession = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      if (initialMessage && !agentStateRef.current.sessionId) {
        setIsLoading(true);
        try {
          const sessionResponse = await fetch("/api/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              contextId: contextId,
            }),
          });
          const sessionData = await sessionResponse.json();

          if (!sessionData.success) {
            throw new Error(sessionData.error || "Failed to create session");
          }

          setContextId(sessionData.contextId);

          agentStateRef.current = {
            ...agentStateRef.current,
            sessionId: sessionData.sessionId,
            sessionUrl: sessionData.sessionUrl.replace(
              "https://www.browserbase.com/devtools-fullscreen/inspector.html",
              "https://www.browserbase.com/devtools-internal-compiled/index.html"
            ),
          };

          setUiState({
            sessionId: sessionData.sessionId,
            sessionUrl: sessionData.sessionUrl.replace(
              "https://www.browserbase.com/devtools-fullscreen/inspector.html",
              "https://www.browserbase.com/devtools-internal-compiled/index.html"
            ),
            steps: [],
          });

          const response = await fetch("/api/agent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              goal: initialMessage,
              sessionId: sessionData.sessionId,
              action: "START",
            }),
          });

          const data = await response.json();
          posthog.capture("agent_start", {
            goal: initialMessage,
            sessionId: sessionData.sessionId,
            contextId: sessionData.contextId,
          });

          if (data.success) {
            const newStep = {
              text: data.result.text,
              reasoning: data.result.reasoning,
              tool: data.result.tool,
              instruction: data.result.instruction,
              stepNumber: 1,
            };

            agentStateRef.current = {
              ...agentStateRef.current,
              steps: [newStep],
            };

            setUiState((prev) => ({
              ...prev,
              steps: [newStep],
            }));

            // Continue with subsequent steps
            while (true) {
              // Get next step from LLM
              const nextStepResponse = await fetch("/api/agent", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  goal: initialMessage,
                  sessionId: sessionData.sessionId,
                  previousSteps: agentStateRef.current.steps,
                  action: "GET_NEXT_STEP",
                }),
              });

              const nextStepData = await nextStepResponse.json();

              if (!nextStepData.success) {
                throw new Error("Failed to get next step");
              }

              // Add the next step to UI immediately after receiving it
              const nextStep = {
                ...nextStepData.result,
                stepNumber: agentStateRef.current.steps.length + 1,
              };

              agentStateRef.current = {
                ...agentStateRef.current,
                steps: [...agentStateRef.current.steps, nextStep],
              };

              setUiState((prev) => ({
                ...prev,
                steps: agentStateRef.current.steps,
              }));

              // Break after adding the CLOSE step to UI
              if (nextStepData.done || nextStepData.result.tool === "CLOSE") {
                break;
              }

              // Execute the step
              const executeResponse = await fetch("/api/agent", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  sessionId: sessionData.sessionId,
                  step: nextStepData.result,
                  action: "EXECUTE_STEP",
                }),
              });

              const executeData = await executeResponse.json();

              posthog.capture("agent_execute_step", {
                goal: initialMessage,
                sessionId: sessionData.sessionId,
                contextId: sessionData.contextId,
                step: nextStepData.result,
              });

              if (!executeData.success) {
                throw new Error("Failed to execute step");
              }

              if (executeData.done) {
                break;
              }
            }
          }
        } catch (error) {
          console.error("Session initialization error:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeSession();
  }, [initialMessage]);

  // Spring configuration for smoother animations
  const springConfig = {
    type: "spring",
    stiffness: 350,
    damping: 30,
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        ...springConfig,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  const getAgentState = () => {
    if (isAgentFinished) return "success";
    if (isLoading) return "loading";
    if (uiState.steps.length === 0) return "thinking";
    
    const lastStep = uiState.steps[uiState.steps.length - 1];
    switch (lastStep.tool) {
      case "GOTO": return "browsing";
      case "ACT": return "acting";
      case "EXTRACT": return "thinking";
      case "OBSERVE": return "browsing";
      default: return "thinking";
    }
  };

  const getCurrentMessage = () => {
    if (isAgentFinished) return "Task completed successfully!";
    if (isLoading) return "Processing your request...";
    if (uiState.steps.length === 0) return "Analyzing your goal...";
    
    const lastStep = uiState.steps[uiState.steps.length - 1];
    return lastStep.text;
  };

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 mesh-gradient opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-accent-50/20 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />

      {/* Top Navigation */}
      <motion.nav 
        className="relative z-10 flex justify-between items-center px-8 py-6 glass-card border-b border-white/10"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4">
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
              AI Agent in Action
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <AgentAvatar 
            state={getAgentState()}
            message={getCurrentMessage()}
            confidence={0.92}
          />
          <ThemeToggle />
          <AnimatedButton
            onClick={() => {
              onClose();
              toast.success("Session closed. Ready for your next query!", {
                icon: "👋",
                duration: 3000,
              });
            }}
            variant="glass"
            size="md"
            icon={<X className="w-4 h-4" />}
          >
            Close
          </AnimatedButton>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 min-h-[calc(100vh-100px)]">
        <motion.div
          className={`w-full glass-card rounded-3xl shadow-3xl border border-white/20 backdrop-blur-xl overflow-hidden transition-all duration-500 ${
            isFullscreen ? "max-w-none h-[calc(100vh-8rem)]" : "max-w-7xl"
          }`}
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Browser Window Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-neon-sm animate-pulse" />
              <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-neon-sm animate-pulse" />
              <div className="w-4 h-4 rounded-full bg-red-500 shadow-neon-sm animate-pulse" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 font-ppsupply">
                AI Browser Session - {initialMessage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 glass hover:bg-white/20 rounded-lg transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </motion.button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row h-full">
            {/* Browser View */}
            {uiState.sessionUrl && !isAgentFinished && (
              <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-white/10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-full h-full min-h-[400px] lg:min-h-[600px] rounded-xl overflow-hidden shadow-2xl"
                >
                  <iframe
                    src={uiState.sessionUrl}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    title="AI Browser Session"
                  />
                </motion.div>
              </div>
            )}

            {/* Completion View */}
            {isAgentFinished && (
              <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-white/10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-full h-full min-h-[400px] lg:min-h-[600px] rounded-xl glass-card flex flex-col items-center justify-center text-center p-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    className="mb-6"
                  >
                    <AgentAvatar 
                      state="success" 
                      message="Mission accomplished!"
                      confidence={1.0}
                    />
                  </motion.div>
                  <h3 className="text-2xl font-ppneue font-bold aurora-text mb-4">
                    Task Completed Successfully!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-ppsupply mb-6 max-w-md">
                    The AI agent has successfully completed your request: 
                    <span className="block mt-2 font-medium text-primary-600 dark:text-primary-400">
                      "{initialMessage}"
                    </span>
                  </p>
                  <AnimatedButton
                    onClick={onClose}
                    variant="gradient"
                    size="lg"
                    icon={<RotateCcw className="w-5 h-5" />}
                  >
                    Start New Session
                  </AnimatedButton>
                </motion.div>
              </div>
            )}

            {/* Chat Panel */}
            <div className="lg:w-[450px] p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-ppneue font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Agent Activity
                </h3>
                <div className="h-px bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" />
              </div>
              
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto space-y-4 pr-2"
                style={{ maxHeight: isFullscreen ? "calc(100vh - 20rem)" : "500px" }}
              >
                {/* Goal Display */}
                {initialMessage && (
                  <motion.div
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    className="glass-card p-4 rounded-xl border border-primary-200/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 font-ppsupply">
                        Goal
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-ppsupply">
                      {initialMessage}
                    </p>
                  </motion.div>
                )}

                {/* Steps */}
                {uiState.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    className="glass-card p-4 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 font-ppsupply">
                        Step {step.stepNumber}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        step.tool === "GOTO" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        step.tool === "ACT" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        step.tool === "EXTRACT" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                        step.tool === "OBSERVE" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}>
                        {step.tool}
                      </span>
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 font-ppsupply mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {step.text}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-ppsupply">
                      <span className="font-semibold">Reasoning: </span>
                      {step.reasoning}
                    </p>
                  </motion.div>
                ))}

                {/* Loading State */}
                {isLoading && (
                  <motion.div
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    className="glass-card p-4 rounded-xl border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 font-ppsupply">
                        Agent is processing...
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
}
