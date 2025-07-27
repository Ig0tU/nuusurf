"use client";

import { motion } from "framer-motion";
import { ButtonHTMLAttributes, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useWindowSize } from "usehooks-ts";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "glass" | "neon" | "gradient" | "minimal" | "legacy";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
  glowEffect?: boolean;
  rippleEffect?: boolean;
}

export default function AnimatedButton({
  children,
  className = "",
  variant = "legacy",
  size = "md",
  isLoading = false,
  icon,
  glowEffect = true,
  rippleEffect = true,
  disabled,
  onClick,
  type = "button",
  ...props
}: AnimatedButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (rippleEffect && !disabled && !isLoading && variant !== "legacy") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  // Legacy button for backward compatibility
  if (variant === "legacy") {
    return (
      <motion.button
        type={type}
        onClick={handleClick}
        className={`absolute right-2 top-1 px-4 py-2 bg-[#FF3B00] hover:bg-[#FF2200] text-white font-medium transition-colors rounded ${className} group`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17
        }}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className="flex items-center gap-1 font-ppsupply">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {children}
              {!isMobile && (
                <>
                  <span className="text-sm opacity-50 group-hover:opacity-100 transition-opacity">⌘+</span>
                  <div className="w-3 h-3 rounded-full opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg viewBox="0 0 18 19">
                      <path 
                        d="M2.40088 13.2758H13.6766C15.2909 13.2758 16.5995 11.9672 16.5995 10.353V1M5.121 9.55976L1.40088 13.2799L5.121 17" 
                        stroke="currentColor" 
                        fill="none" 
                        strokeWidth="1.5" 
                        strokeLinecap="square" 
                        strokeLinejoin="bevel"
                      />
                    </svg>
                  </div>
                </>
              )}
            </>
          )}
        </span>
      </motion.button>
    );
  }

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary: "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl",
    glass: "glass text-white hover:bg-white/20 shadow-glass",
    neon: "bg-transparent border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-white shadow-neon-sm hover:shadow-neon",
    gradient: "bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white hover:scale-105 shadow-lg hover:shadow-2xl",
    minimal: "bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/10 border border-gray-200 dark:border-gray-700",
    legacy: "", // handled above
  };

  const baseClasses = `
    relative overflow-hidden font-medium rounded-lg transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${glowEffect ? "glow-on-hover" : ""}
    ${className}
  `;

  return (
    <motion.button
      type={type}
      className={baseClasses}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}

      {/* Shimmer Effect */}
      {variant === "gradient" && (
        <div className="absolute inset-0 shimmer-effect">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12" />
        </div>
      )}

      {/* Content */}
      <div className="relative flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && (
              <motion.div
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                {icon}
              </motion.div>
            )}
            <span>{children}</span>
            {variant === "gradient" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Glow Effect for Neon Variant */}
      {variant === "neon" && (
        <div className="absolute inset-0 rounded-lg bg-neon-blue/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </motion.button>
  );
}
