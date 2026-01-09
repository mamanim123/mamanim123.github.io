import { LocationData, MapLinks } from '../types.ts';

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in metres
};

export const generateMapLinks = (lat: number, lng: number): MapLinks => {
  return {
    google: `https://www.google.com/maps?q=${lat},${lng}`,
    naver: `https://map.naver.com/v5/search/${lat},${lng}`,
    kakao: `https://map.kakao.com/link/map/${lat},${lng}`,
  };
};

export const formatSmsMessage = (links: MapLinks): string => {
  return `[내 위치 알림]
구글: ${links.google}
네이버: ${links.naver}
카카오: ${links.kakao}`;
};

export const formatGeofenceSmsMessage = (zoneName: string, distance: number, links: MapLinks): string => {
  return `[이탈 알림]
안전 구역 '${zoneName}'에서 약 ${Math.round(distance)}m 벗어났습니다.
위치 확인: ${links.google}`;
};

export const getSmsUri = (phoneNumber: string, message: string): string => {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIos ? '&' : '?';
  return `sms:${phoneNumber}${separator}body=${encodeURIComponent(message)}`;
};