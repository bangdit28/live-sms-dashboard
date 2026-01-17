
export interface SmsRecord {
  id: string;
  liveSms: string;
  sid: string;
  paid: string;
  limit: string;
  messageContent: string;
  timestamp: number;
}

export interface Country {
  id: string;
  name: string;
  value: string;
  flagUrl?: string;
}

export interface AppStats {
  smsToday: number;
  myNumbersCount: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export interface Allocation {
  userId: string;
  numbers: string[];
}
