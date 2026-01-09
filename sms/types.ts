
export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface MapLinks {
  google: string;
  naver: string;
  kakao: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'TRIGGER' | 'ERROR' | 'SYSTEM' | 'GEOFENCE' | 'ALERT' | 'SMS_RECEIVE';
  message: string;
  data?: any;
}

export interface SafeZone {
  id: string;
  name: string;
  center: LocationData | null;
  isEnabled: boolean;
  lastAlertDistance: number;
}

export interface AppState {
  keyword: string;
  masterKeyword: string;
  guardianPhone: string;
  webhookUrl: string;
  isMonitoring: boolean;
  isLowPowerMode: boolean;
  logs: LogEntry[];
  lastLocation: LocationData | null;
  safeZones: SafeZone[];
  normalCheckCount: number;
  dailyLimit: number;
  lastResetDate: string; // YYYY-MM-DD
}
