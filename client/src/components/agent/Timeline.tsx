import { motion, AnimatePresence } from 'framer-motion';
import { StateCard } from './StateCard';
import type { AgentEvent, AgentState } from '@shared/types/index';

interface TimelineProps {
  events: AgentEvent[];
  currentState: AgentState | null;
}

export function Timeline({ events, currentState }: TimelineProps) {
  // Filter and process state change events
  const stateEvents = events
    .filter((e) => e.type === 'state_change')
    .map((e, index, arr) => {
      const data = e.data as { currentState: AgentState; previousState: AgentState | null; payload?: Record<string, unknown> };
      const isActive = index === arr.length - 1 && currentState === data.currentState && currentState !== 'COMPLETE' && currentState !== 'ERROR';
      const isCompleted = index < arr.length - 1 || currentState === 'COMPLETE';

      return {
        id: `${e.runId}-${e.timestamp}-${index}`,
        state: data.currentState,
        timestamp: e.timestamp,
        isActive,
        isCompleted,
        payload: data.payload,
        index,
      };
    });

  if (stateEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-foreground-muted">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg font-medium"
        >
          Waiting for agent to start...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {stateEvents.map((event) => (
          <StateCard
            key={event.id}
            state={event.state}
            timestamp={event.timestamp}
            isActive={event.isActive}
            isCompleted={event.isCompleted}
            payload={event.payload}
            index={event.index}
          />
        ))}
      </AnimatePresence>

      {/* Progress line */}
      <div className="absolute left-[2.25rem] top-0 bottom-0 w-0.5 bg-border -z-10" />
    </div>
  );
}
