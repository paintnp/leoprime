import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return then.toLocaleDateString();
}

/**
 * Format a duration in milliseconds to a human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format a wallet address for display
 */
export function formatAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a currency amount
 */
export function formatCurrency(amount: number, currency = 'USDC'): string {
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get state color based on agent state
 */
export function getStateColor(state: string): string {
  const colors: Record<string, string> = {
    THINK: 'text-accent-purple',
    RETRIEVE: 'text-accent-cyan',
    DECIDE: 'text-accent-orange',
    PAY: 'text-yellow-500',
    VERIFY: 'text-blue-500',
    UNLOCK: 'text-accent-green',
    BUILD: 'text-pink-500',
    COMPLETE: 'text-accent-green',
    ERROR: 'text-accent-red',
  };
  return colors[state] || 'text-foreground-muted';
}

/**
 * Get state background color
 */
export function getStateBgColor(state: string): string {
  const colors: Record<string, string> = {
    THINK: 'bg-accent-purple/10',
    RETRIEVE: 'bg-accent-cyan/10',
    DECIDE: 'bg-accent-orange/10',
    PAY: 'bg-yellow-500/10',
    VERIFY: 'bg-blue-500/10',
    UNLOCK: 'bg-accent-green/10',
    BUILD: 'bg-pink-500/10',
    COMPLETE: 'bg-accent-green/10',
    ERROR: 'bg-accent-red/10',
  };
  return colors[state] || 'bg-foreground-muted/10';
}

/**
 * Get state icon name
 */
export function getStateIcon(state: string): string {
  const icons: Record<string, string> = {
    THINK: 'Brain',
    RETRIEVE: 'Search',
    DECIDE: 'Scale',
    PAY: 'CreditCard',
    VERIFY: 'CheckCircle',
    UNLOCK: 'Unlock',
    BUILD: 'Hammer',
    COMPLETE: 'CheckCircle2',
    ERROR: 'XCircle',
  };
  return icons[state] || 'Circle';
}
