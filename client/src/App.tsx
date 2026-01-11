import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingPage } from './components/landing/LandingPage';
import { Header } from './components/layout/Header';
import { MissionControl } from './components/dashboard/MissionControl';
import { Timeline } from './components/agent/Timeline';
import { MemoryPanel } from './components/agent/MemoryPanel';
import { WalletPanel } from './components/agent/WalletPanel';
import { EntitlementsPanel } from './components/agent/EntitlementsPanel';
import { ArtifactPanel } from './components/agent/ArtifactPanel';
import { useAgentStream } from './hooks/useAgentStream';
import { healthApi } from './lib/api';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import {
  AlertCircle,
  CheckCircle2,
  Activity,
  Zap,
  Brain,
  CreditCard,
  Unlock,
  ArrowLeft,
} from 'lucide-react';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const {
    isRunning,
    runId,
    currentState,
    events,
    memories,
    payments,
    entitlements,
    artifact,
    error,
    startRun,
    cancelRun,
  } = useAgentStream();

  // Health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthApi.check();
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show landing page
  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating orbs */}
        <div className="floating-orb floating-orb-1" />
        <div className="floating-orb floating-orb-2" />
        <div className="floating-orb floating-orb-3" />

        {/* Neural grid pattern */}
        <div className="absolute inset-0 neural-grid opacity-20" />

        {/* Scan line effect */}
        <div className="absolute inset-0 scan-line" />
      </div>

      {/* Header */}
      <Header isConnected={isConnected} isRunning={isRunning} />

      {/* Back to landing button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setShowLanding(true)}
        className="fixed top-20 left-4 md:left-6 z-40 flex items-center gap-2 px-3 py-2 rounded-full glass-card text-sm font-medium hover:bg-muted/50 transition-colors touch-target"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </motion.button>

      {/* Main content */}
      <main className="relative container mx-auto px-4 md:px-6 pt-28 md:pt-32 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Left column - Mission Control & Timeline */}
          <div className="lg:col-span-7 space-y-4 md:space-y-6">
            {/* Mission Control */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <MissionControl
                onStartRun={startRun}
                onCancelRun={cancelRun}
                isRunning={isRunning}
              />
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="relative min-h-[350px] md:min-h-[400px]">
                <CardHeader>
                  <CardTitle>
                    <div className="neural-badge w-8 h-8 mr-2">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    Agent Timeline
                    {currentState && (
                      <Badge
                        variant={
                          currentState === 'ERROR'
                            ? 'error'
                            : currentState === 'COMPLETE'
                            ? 'success'
                            : 'info'
                        }
                        className="ml-2"
                      >
                        {currentState}
                      </Badge>
                    )}
                  </CardTitle>
                  {runId && (
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      Run: {runId.substring(0, 8)}...
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  <Timeline events={events} currentState={currentState} />

                  {/* Error display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3"
                      >
                        <div className="neural-badge w-8 h-8" style={{ background: 'linear-gradient(135deg, oklch(0.60 0.25 25), oklch(0.50 0.22 15))' }}>
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-destructive">Error Encountered</p>
                          <p className="text-sm text-muted-foreground mt-1">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Completion message */}
                  <AnimatePresence>
                    {currentState === 'COMPLETE' && !error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-4 p-4 bg-success/10 border border-success/30 rounded-xl flex items-start gap-3 glow-success"
                      >
                        <div className="neural-badge neural-badge-success w-10 h-10">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-success text-lg">
                            Mission Complete!
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            The autonomous agent has successfully completed all tasks.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right column - Panels */}
          <div className="lg:col-span-5 space-y-4 md:space-y-6">
            {/* Wallet */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <WalletPanel payments={payments} />
            </motion.div>

            {/* Entitlements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <EntitlementsPanel entitlements={entitlements} />
            </motion.div>

            {/* Memories */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <MemoryPanel memories={memories} />
            </motion.div>

            {/* Artifact */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <ArtifactPanel artifact={artifact} />
            </motion.div>
          </div>
        </div>

        {/* Footer stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border/30"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <StatCard
              icon={<Zap className="w-5 h-5 text-white" />}
              value={events.length}
              label="Events Processed"
              color="violet"
            />
            <StatCard
              icon={<Brain className="w-5 h-5 text-white" />}
              value={memories.length}
              label="Memories Retrieved"
              color="pink"
            />
            <StatCard
              icon={<CreditCard className="w-5 h-5 text-white" />}
              value={payments.length}
              label="Payments Made"
              color="cyan"
            />
            <StatCard
              icon={<Unlock className="w-5 h-5 text-white" />}
              value={entitlements.length}
              label="Services Unlocked"
              color="gold"
            />
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/30 py-6 md:py-8 bg-card/50">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="gradient-text-static font-semibold">LEO Prime</span> &copy;{' '}
            {new Date().getFullYear()} - An Autonomous Agent That Acquires Its Own Tools
          </p>
          <p className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-2 flex-wrap">
            <span>Powered by</span>
            <Badge variant="default" className="text-[10px]">MongoDB Atlas</Badge>
            <Badge variant="default" className="text-[10px]">Voyage AI</Badge>
            <Badge variant="default" className="text-[10px]">OpenAI GPT-5.2</Badge>
            <Badge variant="default" className="text-[10px]">CDP AgentKit</Badge>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Stat card component with neural theme
function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'violet' | 'pink' | 'cyan' | 'gold';
}) {
  const colorConfig = {
    violet: {
      badge: 'neural-badge',
      text: 'text-primary',
    },
    pink: {
      badge: 'neural-badge neural-badge-pink',
      text: 'text-neural-pink',
    },
    cyan: {
      badge: 'neural-badge neural-badge-cyan',
      text: 'text-neural-cyan',
    },
    gold: {
      badge: 'neural-badge neural-badge-gold',
      text: 'text-neural-gold',
    },
  };

  const config = colorConfig[color];

  return (
    <div className="relative p-4 md:p-5 rounded-xl glass-card glass-card-hover group">
      {/* Icon */}
      <div className={`${config.badge} w-10 h-10 md:w-12 md:h-12 mb-3`}>
        {icon}
      </div>

      {/* Value */}
      <p className={`text-2xl md:text-3xl font-bold ${config.text} tabular-nums`}>
        {value}
      </p>

      {/* Label */}
      <p className="text-xs md:text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default App;
