import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, StopCircle, Sparkles, Rocket } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface MissionControlProps {
  onStartRun: (goal: string) => void;
  onCancelRun: () => void;
  isRunning: boolean;
}

const DEMO_GOALS = [
  'Build a TypeScript function that validates email addresses and returns detailed error messages',
  'Create a React component for displaying real-time cryptocurrency prices',
  'Generate a MongoDB aggregation pipeline for analyzing user engagement metrics',
  'Design a REST API specification for a task management system',
];

export function MissionControl({ onStartRun, onCancelRun, isRunning }: MissionControlProps) {
  const [goal, setGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim() && !isRunning) {
      onStartRun(goal.trim());
    }
  };

  const handleDemoClick = (demoGoal: string) => {
    setGoal(demoGoal);
  };

  const handleRunDemo = () => {
    const randomGoal = DEMO_GOALS[Math.floor(Math.random() * DEMO_GOALS.length)];
    setGoal(randomGoal);
    onStartRun(randomGoal);
  };

  return (
    <Card variant="glow" className="relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-neural-pink/5 pointer-events-none" />
      <div className="absolute inset-0 neural-grid pointer-events-none opacity-30" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <div className="neural-badge neural-badge-cyan w-8 h-8">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="gradient-text-static">Mission Control</span>
        </CardTitle>
        {!isRunning && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunDemo}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Run Demo
          </Button>
        )}
      </CardHeader>

      <CardContent className="relative space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Enter your goal for the agent... (e.g., 'Build a function that validates email addresses')"
              disabled={isRunning}
              className="min-h-[120px]"
            />

            <div className="flex items-center gap-3">
              {isRunning ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={onCancelRun}
                  className="flex items-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop Agent
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!goal.trim()}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Agent
                </Button>
              )}

              {isRunning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-primary"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                  />
                  <span className="text-sm font-medium text-foreground">Agent is running...</span>
                </motion.div>
              )}
            </div>
          </div>
        </form>

        {/* Demo goal suggestions */}
        {!isRunning && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-3">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_GOALS.map((demoGoal, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDemoClick(demoGoal)}
                  className="px-3 py-2 text-xs text-foreground bg-muted/50 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted transition-all text-left"
                >
                  {demoGoal.length > 60 ? demoGoal.substring(0, 60) + '...' : demoGoal}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
