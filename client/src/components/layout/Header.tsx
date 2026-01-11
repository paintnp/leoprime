import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface HeaderProps {
  isConnected?: boolean;
  isRunning?: boolean;
}

export function Header({ isConnected = true, isRunning = false }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
      {/* Subtle glow line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={isRunning ? { rotate: 360 } : {}}
            transition={isRunning ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
            className="relative"
          >
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 rounded-xl blur-lg opacity-50" style={{ background: 'linear-gradient(135deg, oklch(0.65 0.25 290), oklch(0.70 0.22 330))' }} />
            <div className="relative neural-badge w-10 h-10 md:w-11 md:h-11 rounded-xl">
              <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
          </motion.div>
          <div>
            <h1 className="text-lg md:text-xl font-bold">
              <span className="gradient-text-static">LEO Prime</span>
            </h1>
            <p className="text-[10px] md:text-xs text-muted-foreground tracking-wide uppercase">
              Autonomous Agent OS
            </p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Running indicator */}
          <AnimatePresence>
            {isRunning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-card animate-neural-pulse"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs md:text-sm font-medium text-primary">
                  Agent Running
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile running indicator */}
          {isRunning && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="sm:hidden w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/50"
            />
          )}

          {/* Connection status */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-success" />
                <Badge variant="success" className="hidden md:inline-flex">Connected</Badge>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-destructive animate-pulse" />
                <Badge variant="error" className="hidden md:inline-flex">Offline</Badge>
              </>
            )}
          </div>

          {/* System clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {time.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
