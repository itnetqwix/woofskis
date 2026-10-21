'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Facebook, Mail, MessageCircle, MessageSquare, Link2 } from 'lucide-react';
import {
  buildSmsShareHref,
  buildVideoShareMessage,
  buildVideoShareText,
  isPublicSharePageUrl,
} from '@/features/judging/lib/share-url';
import {
  shareWithNativeTarget,
  shouldUseDesktopShareFallback,
} from '@/features/judging/lib/share-target';

export interface ShareSheetProps {
  open: boolean;
  url: string;
  title: string;
  onOpenChange: (open: boolean) => void;
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the selection fallback.
  }
  try {
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}

export function ShareSheet({ open, url, title, onOpenChange }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const [manualValue, setManualValue] = useState('');

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setMessageCopied(false);
      setManual(false);
      setManualValue('');
    }
  }, [open]);

  // Handle Escape key to close drawer
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open || typeof document === 'undefined') return null;

  const text = buildVideoShareMessage(title, url);
  const shareText = buildVideoShareText(title);
  const publicPage = isPublicSharePageUrl(url);
  const openExternal = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
  };
  const showManual = (value: string) => {
    setManual(true);
    setManualValue(value);
  };

  const actions = [
    {
      id: 'copy',
      label: copied ? 'Copied' : 'Copy Link',
      icon: copied ? Check : Link2,
      onClick: async () => {
        if (!publicPage) {
          showManual(url);
          return;
        }
        const ok = await copyText(url);
        setCopied(ok);
        setMessageCopied(false);
        if (!ok) showManual(url);
      },
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      onClick: () => {
        if (!publicPage) {
          showManual(url);
          return;
        }
        openExternal(`https://wa.me/?text=${encodeURIComponent(text)}`);
      },
    },
    {
      id: 'message',
      label: 'Message',
      icon: MessageSquare,
      onClick: async () => {
        if (!publicPage) {
          showManual(url);
          return;
        }
        const result = await shareWithNativeTarget({
          title: title.trim() || 'Woofskis video',
          text: shareText,
          url,
        });
        if (result === 'shared' || result === 'aborted') return;
        const message = buildVideoShareMessage(title, url);
        if (!shouldUseDesktopShareFallback()) {
          window.location.assign(buildSmsShareHref(message));
          return;
        }
        const ok = await copyText(message);
        setCopied(false);
        setMessageCopied(ok);
        if (!ok) showManual(message);
      },
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      onClick: () => {
        if (!publicPage) {
          showManual(url);
          return;
        }
        openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
      },
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      onClick: () => {
        if (!publicPage) {
          showManual(url);
          return;
        }
        const subject = encodeURIComponent(title ? `Woofskis: ${title}` : 'Woofskis video');
        const body = encodeURIComponent(text);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      },
    },
  ];

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close share"
        className="backdrop-blur-xs pointer-events-auto absolute inset-0 bg-black/50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Share video"
        className="pointer-events-auto relative z-10 w-full max-w-md rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl"
      >
        {/* Header bar matching Comment drawer */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-black text-foreground">Share video</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-5 sm:gap-3 sm:p-5">
          {actions.map((action) => {
            const Icon = action.icon;
            const isCopyActive = action.id === 'copy' && copied;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => void action.onClick()}
                className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl p-1.5 transition-all hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
                    isCopyActive
                      ? 'border-[#fa4616] bg-[#fa4616] text-white'
                      : 'border-border/80 bg-muted/80 text-foreground group-hover:border-[#fa4616]/50 group-hover:bg-[#fa4616]/10 group-hover:text-[#fa4616]'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="w-full truncate text-center text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        {copied ? (
          <div className="flex items-center justify-center gap-1.5 pb-4 text-xs font-bold text-[#fa4616]">
            <Check className="h-3.5 w-3.5" />
            <span>Link copied to clipboard</span>
          </div>
        ) : null}

        {messageCopied ? (
          <div className="flex items-center justify-center gap-1.5 px-4 pb-4 text-center text-xs font-bold text-[#fa4616]">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span>Message copied. Paste it into Messages.</span>
          </div>
        ) : null}

        {manual ? (
          <div className="px-4 pb-4">
            <label className="block text-xs text-muted-foreground">
              Clipboard is unavailable. Copy this link:
              <input
                readOnly
                value={manualValue || url}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
          </div>
        ) : null}
      </section>
    </div>,
    document.body
  );
}
