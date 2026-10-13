'use client';

import { useEffect, useState } from 'react';
import { networkTierFromConnection, type NetworkTier } from '@/features/judging/lib/feed-state';

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

function readConnection(): NetworkInformationLike | null {
  if (typeof navigator === 'undefined') return null;
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  return connection ?? null;
}

export function useNetworkTier(): NetworkTier {
  const [tier, setTier] = useState<NetworkTier>('normal');

  useEffect(() => {
    const connection = readConnection();
    if (!connection) return undefined;
    const read = () => setTier(networkTierFromConnection(connection));
    read();
    connection.addEventListener?.('change', read);
    return () => connection.removeEventListener?.('change', read);
  }, []);

  return tier;
}
