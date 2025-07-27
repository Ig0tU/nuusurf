
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Brain, Eye, Zap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface AgentAvatarProps {
  state: "idle" | "thinking" | "browsing" | "acting" | "success" | "error" | "loading";
  message?: string;
  confidence?: number;
}

export function AgentAvatar({ state, message, confidence = 0.8 }: AgentAvatarProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (state === "thinking" || state === "browsing") {
      const interval = setInterval(() => {
        const newParticle = {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          y: Math.random() * 100,
        };
        setParticles(prev => [...prev.slice(-5), newParticle]);
      }, 500);

      return () => clearInterval(interval);
    } else {
      setParticles([]);
    }
  }, [state]);

  const getStateConfig = () => {
    switch (state) {
      case "idle":
        return {
          icon: Brain,
          color: "text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          glowColor: "rgba(156, 163, 175, 0.3)",
          animation: "float",
        };
      case "thinking":
        return {
          icon: Brain,
          color: "text-blue-500",
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          glowColor: "rgba(59, 130, 246, 0.5)",
          animation: "pulse-slow",
        };
      case "browsing":
        return {
          icon: Eye,
          color: "text-green-500",
          bgColor: "bg-green-100 dark:bg-green-900/30",
          glowColor: "rgba(34, 197, 94, 0.5)",
          animation: "bounce-slow",
        };
      case "acting":
        return {
          icon: Zap,
          color: "text-yellow-500",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          glowColor: "rgba(234, 179, 8, 0.5)",
          animation: "wiggle",
        };
      case "success":
        return {
          icon: CheckCircle,
          color: "text-emerald-500",
          bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
          glowColor: "rgba(16, 185, 129, 0.5)",
          animation: "glow",
        };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-red-500",
          bgColor: "bg-red-100 dark:bg-red-900/30",
          glowColor: "rgba(239, 68, 68, 0.5)",
          animation: "wiggle",
        };
      case "loading":
        return {
          icon: Loader2,
          color: "text-primary-500",
          bgColor: "bg-primary-100 dark:bg-primary-900/30",
          glowColor: "rgba(249, 115, 22, 0.5)",
          animation: "spin",
        };
      default:
        return {
          icon: Brain,
          color: "text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          glowColor: "rgba(156, 163, 175, 0.3)",
          animation: "float",
        };
    }
  };

  const config = getStateConfig();
  const Icon = config.icon;

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Avatar Container */}
      <div className="relative">
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-full blur-lg opacity-60"
          style={{ backgroundColor: config.glowColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main Avatar */}
        <motion.div
          className={`relative w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center shadow-lg border-2 border-white/20`}
          animate={{
            y: state === "idle" ? [0, -8, 0] : 0,
            rotate: state === "acting" ? [0, 5, -5, 0] : 0,
          }}
          transition={{
            duration: state === "idle" ? 3 : 0.5,
            repeat: state === "idle" ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          <Icon 
            className={`w-8 h-8 ${config.color} ${state === "loading" ? "animate-spin" : ""}`}
          />

          {/* Confidence Ring */}
          {confidence > 0 && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="2"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r="30"
                fill="none"
                stroke={config.color.replace("text-", "")}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 30}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - confidence) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
          )}
        </motion.div>

        {/* Thinking Particles */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 bg-blue-400 rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ 
                scale: [0, 1, 0],
                y: -20,
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Status Message */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <div className="glass-card px-4 py-2 rounded-lg max-w-xs">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {message}
              </p>
              {confidence > 0 && (
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <motion.div
                      className={`h-full rounded-full ${config.color.replace("text-", "bg-")}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* State Indicator */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className={`w-2 h-2 rounded-full ${config.color.replace("text-", "bg-")} animate-pulse`} />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
          {state}
        </span>
      </motion.div>
    </div>
  );
}
