import React from 'react';
import { motion } from 'framer-motion';
import { FileCode, FileText, FileType, Download, Copy, CheckCircle2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { copyToClipboard } from '../../lib/utils';

interface ArtifactInfo {
  projectId: string;
  name: string;
  type: string;
  preview: string;
}

interface ArtifactPanelProps {
  artifact: ArtifactInfo | null;
}

export function ArtifactPanel({ artifact }: ArtifactPanelProps) {
  const [copied, setCopied] = React.useState(false);

  if (!artifact) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-accent-cyan" />
            Generated Artifact
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileType className="w-12 h-12 text-foreground-subtle mb-4" />
          <p className="text-foreground-subtle text-center">
            Artifacts will appear here after the BUILD phase
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(artifact.preview);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguage = (type: string, name: string): string => {
    if (type === 'code') {
      if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript';
      if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript';
      if (name.endsWith('.py')) return 'python';
      if (name.endsWith('.rs')) return 'rust';
      if (name.endsWith('.go')) return 'go';
      return 'typescript';
    }
    return 'markdown';
  };

  const TypeIcon = artifact.type === 'code' ? FileCode : FileText;

  return (
    <Card variant="glow" className="h-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TypeIcon className="w-5 h-5 text-accent-cyan" />
          <CardTitle>Generated Artifact</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-accent-green" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Metadata */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="purple">{artifact.type.toUpperCase()}</Badge>
            <span className="font-mono text-sm text-foreground">{artifact.name}</span>
          </div>

          {/* Code preview */}
          <div className="rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
            <SyntaxHighlighter
              language={getLanguage(artifact.type, artifact.name)}
              style={oneDark}
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
              }}
              showLineNumbers
            >
              {artifact.preview}
            </SyntaxHighlighter>
          </div>

          {artifact.preview.length > 500 && (
            <p className="mt-2 text-xs text-foreground-subtle">
              Showing preview. Download for full content.
            </p>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
