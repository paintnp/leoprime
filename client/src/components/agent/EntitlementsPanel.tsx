import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Key, Database, Zap, CreditCard, DollarSign, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface EntitlementInfo {
  service: string;
  isActive: boolean;
  expiresAt: string;
}

interface EntitlementsPanelProps {
  entitlements: EntitlementInfo[];
}

const serviceIcons: Record<string, React.ElementType> = {
  voyage: Zap,
  mongodb: Database,
  cdp: CreditCard,
};

const serviceNames: Record<string, string> = {
  voyage: 'Voyage AI',
  mongodb: 'MongoDB Atlas',
  cdp: 'CDP AgentKit',
};

const serviceDescriptions: Record<string, string> = {
  voyage: 'Semantic embeddings & vector search',
  mongodb: 'Vector database operations',
  cdp: 'Cryptocurrency payments',
};

const servicePrices: Record<string, number> = {
  voyage: 0.50,
  mongodb: 0.50,
  cdp: 0.50,
};

export function EntitlementsPanel({ entitlements }: EntitlementsPanelProps) {
  const services = ['voyage', 'mongodb', 'cdp'];

  const getServiceStatus = (service: string) => {
    const ent = entitlements.find((e) => e.service === service);
    return ent ? { isActive: ent.isActive, expiresAt: ent.expiresAt } : null;
  };

  const unlockedCount = services.filter(s => getServiceStatus(s)?.isActive).length;
  const totalCost = unlockedCount * 0.50;

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="neural-badge neural-badge-gold w-8 h-8">
            <Key className="w-4 h-4 text-white" />
          </div>
          <span>Entitlements</span>
          {unlockedCount > 0 && (
            <Badge variant="success" className="ml-auto">
              {unlockedCount}/3 UNLOCKED
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Explanation banner */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border/50 mb-4">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-semibold">LEO Prime pays for capabilities it needs.</span>{' '}
            Services start LOCKED and are unlocked with real USDC payments on Base chain.
          </p>
          {totalCost > 0 && (
            <p className="text-xs text-success font-semibold mt-1">
              Total spent: ${totalCost.toFixed(2)} USDC
            </p>
          )}
        </div>

        {services.map((service, index) => {
          const status = getServiceStatus(service);
          const isUnlocked = status?.isActive ?? false;
          const Icon = serviceIcons[service];
          const price = servicePrices[service];

          return (
            <motion.div
              key={service}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-500',
                isUnlocked
                  ? 'border-success/50 bg-success/5 glow-success'
                  : 'border-border/50 bg-muted/30'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500',
                      isUnlocked
                        ? 'bg-success/20 shadow-lg shadow-success/20'
                        : 'bg-muted'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-colors duration-500',
                        isUnlocked ? 'text-success' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-foreground">
                      {serviceNames[service]}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {serviceDescriptions[service]}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <AnimatePresence mode="wait">
                    {isUnlocked ? (
                      <motion.div
                        key="unlocked"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        className="flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-success" />
                        <Badge variant="success" className="font-bold">
                          UNLOCKED
                        </Badge>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="locked"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <Badge variant="default">LOCKED</Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Price tag */}
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-mono",
                    isUnlocked ? "text-success" : "text-muted-foreground"
                  )}>
                    <DollarSign className="w-3 h-3" />
                    <span>{price.toFixed(2)} USDC</span>
                    {isUnlocked && <span className="text-success">✓ PAID</span>}
                  </div>
                </div>
              </div>

              {/* Progress bar for locked services */}
              {!isUnlocked && (
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-primary rounded-full" />
                </div>
              )}

              {/* Expiry info for unlocked services */}
              <AnimatePresence>
                {isUnlocked && status?.expiresAt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 pt-2 border-t border-success/20"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Access expires:</span>
                      <span className="text-success font-mono">
                        {new Date(status.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Call to action when all locked */}
        {unlockedCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-center"
          >
            <p className="text-sm text-foreground">
              <span className="text-primary font-semibold">Run a mission</span> to see LEO Prime
              autonomously pay for and unlock these services!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
