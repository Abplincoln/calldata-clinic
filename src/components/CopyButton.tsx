import React, { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
  ariaLabel?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  ariaLabel,
  className = 'btn-copy',
}) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(false);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setError(false);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleCopy}
      aria-label={ariaLabel || `Copy ${text}`}
      title="Copy to clipboard"
    >
      {copied ? 'Copied!' : error ? 'Copy failed' : label}
    </button>
  );
};
