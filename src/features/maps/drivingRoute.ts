import { apiRequest } from '@/services/apiClient';

export type RouteCoordinates = { latitude: number; longitude: number };

export type DrivingRoute = {
  durationSeconds: number;
  distanceMeters: number;
  path: RouteCoordinates[];
};

export function getDrivingRoute(origin: RouteCoordinates, destination: RouteCoordinates) {
  const params = new URLSearchParams({
    originLatitude: String(origin.latitude),
    originLongitude: String(origin.longitude),
    destinationLatitude: String(destination.latitude),
    destinationLongitude: String(destination.longitude),
  });
  return apiRequest<DrivingRoute>(`/api/v1/routes/driving?${params.toString()}`);
}
