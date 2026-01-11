import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import type { RetrievedMemory } from '@shared/types/index';

interface MemoryPanelProps {
  memories: RetrievedMemory[];
}

export function MemoryPanel({ memories }: MemoryPanelProps) {
  if (memories.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent-cyan" />
            Retrieved Memories
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Sparkles className="w-8 h-8 text-foreground-subtle mb-3" />
          <p className="text-foreground-subtle text-center">
            Memories will appear here after the RETRIEVE phase
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent-cyan" />
          Retrieved Memories ({memories.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {memories.map((memory, index) => (
          <motion.div
            key={memory.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 bg-background-tertiary rounded-lg border border-border"
          >
            {/* Similarity score bar */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-foreground-subtle">
                {(memory.score * 100).toFixed(1)}%
              </span>
              <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${memory.score * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-accent-cyan to-accent-purple"
                />
              </div>
            </div>

            {/* Memory text */}
            <p className="text-sm text-foreground-muted line-clamp-3">
              {memory.text}
            </p>

            {/* Metadata */}
            {memory.metadata && Object.keys(memory.metadata).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(memory.metadata).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-1.5 py-0.5 text-xs bg-background rounded text-foreground-subtle"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
