import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Wallet,
  Zap,
  Lock,
  Unlock,
  ArrowRight,
  Sparkles,
  Database,
  Shield,
  Cpu,
  Globe,
  ChevronDown,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Floating orbs background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="floating-orb floating-orb-1" />
        <div className="floating-orb floating-orb-2" />
        <div className="floating-orb floating-orb-3" />
        <div className="absolute inset-0 neural-grid opacity-30" />
      </div>

      {/* Hero Section */}
      <section className="hero-section flex flex-col items-center justify-center px-4 md:px-6 relative">
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50 p-4 md:p-6">
          <div className="container mx-auto flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="neural-badge w-10 h-10">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text-static">LEO Prime</span>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onEnterApp}
              className="btn-outline-neural px-4 py-2 rounded-full text-sm touch-target"
            >
              Launch App
            </motion.button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto text-center max-w-5xl pt-24 md:pt-32 pb-16 md:pb-24">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <Sparkles className="w-4 h-4 text-neural-gold" />
            <span className="text-sm font-medium">World's First Self-Funding AI Agent</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-6"
          >
            <span className="gradient-text">The AI That</span>
            <br />
            <span className="text-foreground">Buys Its Own Tools</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            LEO Prime is an autonomous agent that <span className="text-primary font-semibold">discovers</span> what capabilities it needs,{' '}
            <span className="text-neural-pink font-semibold">pays</span> for them with real cryptocurrency,
            and <span className="text-success font-semibold">unlocks</span> new abilities to complete your goals.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={onEnterApp}
              className="btn-neural px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 touch-target group"
            >
              <span className="relative z-10">Start a Mission</span>
              <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#how-it-works"
              className="btn-outline-neural px-8 py-4 rounded-xl text-lg flex items-center gap-2 touch-target"
            >
              See How It Works
              <ChevronDown className="w-5 h-5" />
            </a>
          </motion.div>

          {/* Tech Stack Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {['GPT-5.2', 'CDP AgentKit', 'MongoDB Atlas', 'Voyage AI', 'Base Chain'].map((tech, i) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-full text-xs font-medium glass-card"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {tech}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </section>

      {/* What Makes LEO Prime Different */}
      <section id="how-it-works" className="py-24 md:py-32 px-4 md:px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Revolutionary AI Architecture</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The first AI agent that manages its own economy to acquire capabilities
            </p>
          </motion.div>

          {/* The Big Differentiator */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="feature-card mb-12 text-center"
          >
            <div className="neural-badge neural-badge-gold w-16 h-16 mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              What's Never Been Done Before?
            </h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
              Traditional AI agents are given all tools upfront. LEO Prime starts with <span className="text-primary font-semibold">zero capabilities</span> and a <span className="text-neural-cyan font-semibold">crypto wallet</span>.
              It analyzes your goal, identifies what tools it needs, and <span className="text-success font-semibold">purchases access</span> in real-time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <span className="px-4 py-2 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                ❌ Not pre-configured
              </span>
              <span className="px-4 py-2 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                ❌ Not manually provisioned
              </span>
              <span className="px-4 py-2 rounded-full bg-success/10 text-success border border-success/20">
                ✓ Self-sufficient & autonomous
              </span>
            </div>
          </motion.div>

          {/* Core Concepts */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Wallet,
                title: 'Agent Wallet',
                description: 'A real cryptocurrency wallet on Base chain. The agent controls USDC to pay for services it needs.',
                color: 'neural-badge-cyan',
                highlight: 'Real money, real transactions',
              },
              {
                icon: Lock,
                title: 'Entitlements',
                description: 'Services start LOCKED. The agent must purchase access to vector search, databases, or payment APIs.',
                color: 'neural-badge-pink',
                highlight: 'Pay-per-capability model',
              },
              {
                icon: Brain,
                title: 'Memories',
                description: 'Knowledge persists across runs. The agent builds expertise and recalls relevant context for new tasks.',
                color: 'neural-badge',
                highlight: 'Persistent neural memory',
              },
            ].map((concept, i) => (
              <motion.div
                key={concept.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="feature-card"
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`neural-badge ${concept.color} w-14 h-14 mb-6`}>
                  <concept.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{concept.title}</h3>
                <p className="text-muted-foreground mb-4">{concept.description}</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {concept.highlight}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Flow */}
      <section className="py-24 md:py-32 px-4 md:px-6 relative neural-bg">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">The Agent Flow</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch the agent think, decide, and act autonomously
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-4 md:gap-6">
            {[
              { phase: 'THINK', icon: Cpu, desc: 'Analyze goal & plan', color: 'from-violet-600 to-purple-700' },
              { phase: 'RETRIEVE', icon: Database, desc: 'Search memories', color: 'from-blue-600 to-cyan-600' },
              { phase: 'DECIDE', icon: Shield, desc: 'Unlock services', color: 'from-pink-600 to-rose-600' },
              { phase: 'BUILD', icon: Sparkles, desc: 'Generate artifact', color: 'from-amber-500 to-orange-600' },
              { phase: 'COMPLETE', icon: Unlock, desc: 'Mission success', color: 'from-emerald-500 to-green-600' },
            ].map((step, i) => (
              <motion.div
                key={step.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="glass-card glass-card-hover p-6 rounded-2xl text-center h-full">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                  >
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold font-mono text-sm mb-2">{step.phase}</h4>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-24 md:py-32 px-4 md:px-6 relative">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-8">
              <span className="gradient-text">The Future of AI Agents</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              Imagine AI that doesn't just follow instructions, but{' '}
              <span className="text-foreground font-semibold">negotiates for resources</span>,{' '}
              <span className="text-foreground font-semibold">manages budgets</span>, and{' '}
              <span className="text-foreground font-semibold">acquires new skills</span> when needed.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              {[
                { icon: Globe, text: 'Autonomous capability acquisition' },
                { icon: Wallet, text: 'Real crypto micropayments' },
                { icon: Brain, text: 'Persistent memory across sessions' },
                { icon: Shield, text: 'Self-managing entitlement system' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-4 glass-card rounded-xl"
                >
                  <div className="neural-badge w-10 h-10">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={onEnterApp}
              className="btn-neural px-10 py-5 rounded-xl text-xl font-semibold flex items-center gap-3 mx-auto touch-target group"
            >
              <span className="relative z-10">Experience LEO Prime</span>
              <ArrowRight className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 border-t border-border/30">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            <span className="gradient-text-static font-semibold">LEO Prime</span> &copy; {new Date().getFullYear()}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Built for the AI Agent Hackathon • Powered by OpenAI, CDP AgentKit & MongoDB Atlas
          </p>
        </div>
      </footer>
    </div>
  );
}
