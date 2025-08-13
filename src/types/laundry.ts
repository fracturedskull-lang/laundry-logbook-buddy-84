export interface LaundryEntry {
  id: string;
  type: 'incoming' | 'outgoing';
  weight: number; // in kilograms
  signedBy: string;
  timestamp: Date;
  notes?: string;
}

export interface LaundryStats {
  totalIncoming: number;
  totalOutgoing: number;
  netBalance: number;
  totalEntries: number;
}