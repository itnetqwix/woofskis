'use client';

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  History,
  Clock,
  User,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ModerationAuditLogItem } from '@/types/admin';
import { cn } from '@/lib/utils';

interface ModerationAuditLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: ModerationAuditLogItem[];
}

export function ModerationAuditLogModal({
  open,
  onOpenChange,
  logs,
}: ModerationAuditLogModalProps) {
  const [search, setSearch] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.submissionTitle.toLowerCase().includes(q) ||
      log.creatorName.toLowerCase().includes(q) ||
      log.moderatorName.toLowerCase().includes(q) ||
      (log.reasonNote && log.reasonNote.toLowerCase().includes(q))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <History className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold">Moderation Audit Trail</DialogTitle>
          </div>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            Real-time audit record of all video approval, rejection, and safety flag decisions made
            by the moderation team.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by title, creator, or moderator..."
            className="h-9 w-full rounded-xl border border-border bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* List of audit items */}
        <div className="mt-4 max-h-[50vh] space-y-2.5 overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No audit logs matching search.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="space-y-1.5 rounded-xl border border-border/80 bg-muted/20 p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {log.action === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                        <ShieldCheck className="h-3 w-3" /> APPROVED
                      </span>
                    )}
                    {log.action === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                        <XCircle className="h-3 w-3" /> REJECTED
                      </span>
                    )}
                    {log.action === 'FLAGGED' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                        <AlertTriangle className="h-3 w-3" /> FLAGGED
                      </span>
                    )}
                    {log.action === 'UNFLAGGED' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                        UNFLAGGED
                      </span>
                    )}
                    {log.action !== 'APPROVED' &&
                      log.action !== 'REJECTED' &&
                      log.action !== 'FLAGGED' &&
                      log.action !== 'UNFLAGGED' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                          {log.action}
                        </span>
                      )}

                    <span className="max-w-[240px] truncate font-bold text-foreground">
                      {log.submissionTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Creator: <strong className="text-foreground">{log.creatorName}</strong>
                  </span>
                  <span>
                    Moderator: <strong className="text-foreground">{log.moderatorName}</strong>
                  </span>
                </div>

                {log.reasonNote && (
                  <p className="rounded-lg border border-border/60 bg-card p-2 text-[11px] text-foreground/90">
                    {log.reasonNote}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
