import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Search,
  Scale,
  CreditCard,
  CheckCircle,
  Unlock,
  Hammer,
  CheckCircle2,
  XCircle,
  Circle,
} from 'lucide-react';
import { cn, getStateColor, getStateBgColor, formatRelativeTime } from '../../lib/utils';
import type { AgentState } from '@shared/types/index';

const icons: Record<string, React.ElementType> = {
  THINK: Brain,
  RETRIEVE: Search,
  DECIDE: Scale,
  PAY: CreditCard,
  VERIFY: CheckCircle,
  UNLOCK: Unlock,
  BUILD: Hammer,
  COMPLETE: CheckCircle2,
  ERROR: XCircle,
};

interface StateCardProps {
  state: AgentState;
  timestamp?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  payload?: Record<string, unknown>;
  index: number;
}

export function StateCard({
  state,
  timestamp,
  isActive = false,
  isCompleted = false,
  payload,
  index,
}: StateCardProps) {
  const Icon = icons[state] || Circle;
  const stateDescriptions: Record<string, string> = {
    THINK: 'Analyzing goal and creating execution plan...',
    RETRIEVE: 'Searching semantic memory with Voyage AI...',
    DECIDE: 'Evaluating required services and entitlements...',
    PAY: 'Processing USDC payment via CDP AgentKit...',
    VERIFY: 'Verifying transaction on Base network...',
    UNLOCK: 'Activating service entitlements...',
    BUILD: 'Generating artifact with GPT-5.2...',
    COMPLETE: 'Execution complete!',
    ERROR: 'An error occurred during execution.',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={cn(
        'relative flex gap-4 p-4 rounded-xl border transition-all duration-300',
        isActive && 'border-accent-cyan/50 shadow-glow animate-pulse-glow',
        isCompleted && 'border-accent-green/30',
        !isActive && !isCompleted && 'border-border bg-background-secondary'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
          getStateBgColor(state)
        )}
      >
        <Icon className={cn('w-5 h-5', getStateColor(state))} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('font-semibold font-mono text-sm', getStateColor(state))}>
            {state}
          </span>
          {timestamp && (
            <span className="text-xs text-foreground-subtle">
              {formatRelativeTime(timestamp)}
            </span>
          )}
          {isActive && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-xs text-accent-cyan font-medium"
            >
              ACTIVE
            </motion.span>
          )}
          {isCompleted && (
            <span className="text-xs text-accent-green font-medium">DONE</span>
          )}
        </div>

        <p className="text-sm text-foreground-muted">
          {stateDescriptions[state]}
        </p>

        {/* Payload */}
        {payload && Object.keys(payload).length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-3 p-3 bg-background-tertiary rounded-lg overflow-hidden"
          >
            <pre className="text-xs text-foreground-muted font-mono overflow-x-auto">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </motion.div>
        )}
      </div>

      {/* Status indicator */}
      <div
        className={cn(
          'absolute top-4 right-4 w-2 h-2 rounded-full',
          isActive && 'bg-accent-cyan animate-pulse',
          isCompleted && 'bg-accent-green',
          !isActive && !isCompleted && 'bg-foreground-subtle'
        )}
      />
    </motion.div>
  );
}
