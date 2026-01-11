import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Copy, ExternalLink, CheckCircle2, AlertCircle, TrendingDown, ArrowDownRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { walletApi } from '../../lib/api';
import { formatAddress, formatCurrency, copyToClipboard } from '../../lib/utils';
import type { WalletInfo } from '@shared/types/index';

interface PaymentInfo {
  txHash: string;
  amount: number;
  currency: string;
  purpose: string;
  explorerUrl: string;
}

interface WalletPanelProps {
  payments: PaymentInfo[];
}

export function WalletPanel({ payments }: WalletPanelProps) {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [balanceChange, setBalanceChange] = useState<number | null>(null);

  // Fetch wallet info and track balance changes
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const info = await walletApi.getInfo();
        if (walletInfo && info.balance !== walletInfo.balance) {
          setPreviousBalance(walletInfo.balance);
          setBalanceChange(info.balance - walletInfo.balance);
          // Clear the change indicator after 3 seconds
          setTimeout(() => setBalanceChange(null), 3000);
        }
        setWalletInfo(info);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchWallet();
    // Poll for balance updates every 5 seconds when there are payments happening
    const interval = setInterval(fetchWallet, 5000);
    return () => clearInterval(interval);
  }, [payments.length]); // Re-run when payments change

  const handleCopyAddress = async () => {
    if (walletInfo?.address) {
      const success = await copyToClipboard(walletInfo.address);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="neural-badge neural-badge-cyan w-8 h-8">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span>Agent Wallet</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-xl border border-destructive/30">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : walletInfo ? (
          <>
            {/* Demo Mode Banner */}
            {(walletInfo as any).demoMode && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl flex items-center gap-2 text-xs text-warning">
                <AlertCircle className="w-4 h-4" />
                <span>Demo Mode - Payments are simulated</span>
              </div>
            )}

            {/* Wallet Address */}
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Address</span>
                <Badge variant="info">{walletInfo.network}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-foreground bg-muted px-2 py-1 rounded">
                  {formatAddress(walletInfo.address, 8)}
                </code>
                <button
                  onClick={handleCopyAddress}
                  className="p-2 hover:bg-muted rounded-lg transition-colors touch-target"
                  aria-label="Copy address"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Balance with animation */}
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 relative overflow-hidden">
              <span className="text-xs text-muted-foreground font-medium">Balance</span>
              <div className="flex items-baseline gap-2">
                <motion.div
                  key={walletInfo.balance}
                  initial={{ scale: 1 }}
                  animate={balanceChange ? { scale: [1, 1.1, 1] } : {}}
                  className="text-3xl font-bold text-foreground tabular-nums"
                >
                  {formatCurrency(walletInfo.balance, walletInfo.currency)}
                </motion.div>
                {/* Balance change indicator */}
                <AnimatePresence>
                  {balanceChange !== null && balanceChange < 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-1 text-sm text-destructive font-semibold"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      {formatCurrency(Math.abs(balanceChange), walletInfo.currency)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Spent indicator */}
              {totalSpent > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <TrendingDown className="w-3 h-3 text-neural-pink" />
                  <span className="text-muted-foreground">
                    Spent this session:{' '}
                    <span className="text-neural-pink font-semibold">
                      ${totalSpent.toFixed(2)} USDC
                    </span>
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        )}

        {/* Transactions */}
        <AnimatePresence>
          {payments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-border/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">
                  Transactions
                </h4>
                <Badge variant="info">{payments.length} payment{payments.length !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {payments.map((payment, index) => (
                  <motion.div
                    key={payment.txHash}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-success/5 rounded-xl border border-success/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{payment.purpose}</span>
                      <Badge variant="success">CONFIRMED</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-neural-cyan tabular-nums">
                        -{formatCurrency(payment.amount, payment.currency)}
                      </span>
                      <a
                        href={payment.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-muted"
                      >
                        <code className="font-mono">{formatAddress(payment.txHash, 4)}</code>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {payments.length === 0 && walletInfo && (
          <div className="p-4 rounded-xl border border-dashed border-border/50 bg-muted/20 text-center">
            <p className="text-xs text-muted-foreground">
              No transactions yet. When LEO Prime pays for services, they'll appear here with{' '}
              <span className="text-primary font-semibold">BaseScan</span> links.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
