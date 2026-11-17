import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import KakaoMapView, { type MapOverview, type MapPointKind, type MapSelection } from '@/components/maps/KakaoMapView';
import PlaceSearchPanel, { type SearchStatus } from '@/components/maps/PlaceSearchPanel';
import { getDrivingRoute, type DrivingRoute } from '@/features/maps/drivingRoute';
import { useRoomCreateDraft, type RoomDraftPoint } from '@/features/maps/RoomCreateDraftContext';
import { updateRoomLocations } from '@/features/rooms/api';
import type { DestinationSelection, PlaceSearchRequest, PlaceSearchResponse, PlaceSearchResult } from '@/types/map';
import { ApiError } from '@/services/apiClient';

type RouteState = { status: 'idle' | 'loading' } | { status: 'ready'; route: DrivingRoute } | { status: 'error'; message: string };

function routeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'ROUTE_KEY_MISSING') return '경로 API 키가 설정되지 않았어요. 서버 설정을 확인해 주세요.';
    if (error.code === 'ROUTE_QUOTA_EXCEEDED') return '경로 API 사용량을 초과했어요. 잠시 후 다시 확인해 주세요.';
    if (error.code === 'ROUTE_NOT_FOUND') return '이 두 위치를 잇는 도로 경로를 찾지 못했어요. 핀 위치를 조정해 주세요.';
    return error.message;
  }
  return '도로 경로를 불러오지 못했어요. 다시 확인해 주세요.';
}

const pointOptions: { kind: MapPointKind; label: string }[] = [
  { kind: 'departure', label: '출발지' },
  { kind: 'destination', label: '도착지' },
];

function getPointSummary(kind: MapPointKind, point: MapSelection | undefined, searchedPlace: PlaceSearchResult | null): string {
  if (kind === 'destination' && searchedPlace && (!point || point.source === 'search')) {
    return searchedPlace.name;
  }
  if (!point) return '아직 선택하지 않음';
  if (point.addressStatus === 'loading') return '핀 위치 확인 중...';
  if (point.addressStatus === 'unavailable') return '주소 확인 불가 · 핀 좌표는 저장됩니다';
  if (point.addressKind === 'nearby') return `인근 주소 · ${point.roadAddress}`;
  if (point.addressKind === 'parcel') return `지번 주소 · ${point.roadAddress}`;
  return point.buildingCandidate
    ? `건물 후보 · ${point.buildingCandidate}`
    : point.roadAddress ?? '도로명 주소 확인 불가';
}

function savedSelection(point: RoomDraftPoint | null): MapSelection | undefined {
  return point ? {
    latitude: point.latitude, longitude: point.longitude, source: point.source,
    roadAddress: point.roadAddress, buildingCandidate: point.buildingCandidate,
    addressStatus: point.roadAddress || point.source === 'search' ? 'resolved' : 'unavailable',
    addressKind: point.addressKind ?? (point.roadAddress ? 'road' : null),
    selectionId: null,
  } : undefined;
}

function toDraftPoint(point: MapSelection | undefined, place: PlaceSearchResult | null): RoomDraftPoint | null {
  if (!point) return null;
  if (point.source === 'search' && place &&
    Math.abs(point.latitude - place.latitude) < 0.0000001 &&
    Math.abs(point.longitude - place.longitude) < 0.0000001) {
    return { name: place.name, latitude: point.latitude, longitude: point.longitude,
      source: 'search', roadAddress: place.roadAddress ?? point.roadAddress, addressKind: 'road',
      buildingCandidate: null, placeId: place.id };
  }
  if (point.addressStatus === 'loading') return null;
  const name = point.addressKind === 'nearby' && point.roadAddress
    ? `인근 주소 · ${point.roadAddress.trim()}`
    : point.addressKind === 'parcel' && point.roadAddress
      ? `지번 주소 · ${point.roadAddress.trim()}`
      : point.roadAddress?.trim() || '주소 확인 불가';
  return { name, latitude: point.latitude, longitude: point.longitude,
    source: 'map', roadAddress: point.roadAddress?.trim() || null, addressKind: point.addressKind,
    buildingCandidate: point.buildingCandidate, placeId: null };
}

export default function MapPickerScreen() {
  const { focus, mode } = useLocalSearchParams<{ focus?: string; mode?: string }>();
  const { draft, updateDraft, roomEdit, clearRoomEdit } = useRoomCreateDraft();
  const editing = mode === 'edit-locations' && roomEdit;
  const initialOrigin = editing ? roomEdit.origin : draft.origin;
  const initialDestination = editing ? roomEdit.destination : draft.destination;
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const initialOverview: MapOverview | null = initialOrigin && initialDestination ? {
    departure: { latitude: initialOrigin.latitude, longitude: initialOrigin.longitude },
    destination: { latitude: initialDestination.latitude, longitude: initialDestination.longitude },
    routePath: null,
  } : null;
  const [activePoint, setActivePoint] = useState<MapPointKind>(editing || (focus === 'destination' && initialOrigin) ? 'destination' : 'departure');
  const [points, setPoints] = useState<Partial<Record<MapPointKind, MapSelection>>>(() => ({
    departure: savedSelection(initialOrigin), destination: savedSelection(initialDestination),
  }));
  const [searchOpen, setSearchOpen] = useState(focus === 'destination' && Boolean(initialOrigin) && !initialDestination);
  const [searchText, setSearchText] = useState('');
  const [searchRequest, setSearchRequest] = useState<PlaceSearchRequest | null>(null);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [destinationSelection, setDestinationSelection] = useState<DestinationSelection | null>(null);
  const [destinationConfirmed, setDestinationConfirmed] = useState(Boolean(initialOverview));
  const [overview, setOverview] = useState<MapOverview | null>(initialOverview);
  const [routeState, setRouteState] = useState<RouteState>(initialOverview ? { status: 'loading' } : { status: 'idle' });
  const routeRequestId = useRef(0);
  const searchRequestCounter = useRef(0);
  const currentSearchRequestId = useRef(0);
  const selectionCounter = useRef(0);
  const currentSelectionId = useRef<number | null>(null);
  const confirmedPosition = useRef<{ latitude: number; longitude: number } | null>(initialOverview?.destination ?? null);
  const selectedPoint = points[activePoint];
  const savedPlace = initialDestination?.source === 'search' && initialDestination.placeId && points.destination &&
    Math.abs(points.destination.latitude - initialDestination.latitude) < 0.0000001 &&
    Math.abs(points.destination.longitude - initialDestination.longitude) < 0.0000001
    ? { id: initialDestination.placeId, name: initialDestination.name,
      latitude: initialDestination.latitude, longitude: initialDestination.longitude,
      roadAddress: initialDestination.roadAddress } : null;
  const searchedPlace = destinationSelection ? destinationSelection.place : savedPlace;
  const exactSearchPlace = activePoint === 'destination' && searchedPlace &&
    (!selectedPoint || selectedPoint.source === 'search') ? searchedPlace : null;
  const canConfirmDestination = Boolean(points.departure && (points.destination || searchedPlace));
  const departureDraft = toDraftPoint(points.departure, null);
  const destinationDraft = toDraftPoint(points.destination, searchedPlace);
  const canApply = Boolean(overview && destinationConfirmed && departureDraft && destinationDraft);
  const displayedOverview = overview && routeState.status === 'ready'
    ? { ...overview, routePath: routeState.route.path } : overview;
  const originLatitude = overview?.departure.latitude;
  const originLongitude = overview?.departure.longitude;
  const destinationLatitude = overview?.destination.latitude;
  const destinationLongitude = overview?.destination.longitude;

  useEffect(() => {
    if (originLatitude === undefined || originLongitude === undefined || destinationLatitude === undefined || destinationLongitude === undefined) return;
    const requestId = ++routeRequestId.current;
    let active = true;
    void getDrivingRoute(
      { latitude: originLatitude, longitude: originLongitude },
      { latitude: destinationLatitude, longitude: destinationLongitude },
    ).then((route) => {
      if (active && routeRequestId.current === requestId) setRouteState({ status: 'ready', route });
    }).catch((error: unknown) => {
      if (active && routeRequestId.current === requestId) setRouteState({ status: 'error', message: routeErrorMessage(error) });
    });
    return () => { active = false; };
  }, [originLatitude, originLongitude, destinationLatitude, destinationLongitude]);

  function clearRoute() {
    routeRequestId.current++;
    setRouteState({ status: 'idle' });
    setOverview(null);
  }

  useEffect(() => {
    if (!searchOpen || !searchText.trim()) return;
    const query = searchText.trim();
    const timer = setTimeout(() => {
      const requestId = ++searchRequestCounter.current;
      currentSearchRequestId.current = requestId;
      setSearchRequest({ requestId, query });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchOpen, searchText]);

  function openDestinationSearch() {
    confirmedPosition.current = null;
    setDestinationConfirmed(false);
    clearRoute();
    setSearchText('');
    setSearchRequest(null);
    setSearchStatus('idle');
    setSearchResults([]);
    setSearchOpen(true);
  }

  function beginDestinationSelection(place: PlaceSearchResult | null, coordinates?: { latitude: number; longitude: number }) {
    Keyboard.dismiss();
    const selectionId = ++selectionCounter.current;
    currentSelectionId.current = selectionId;
    confirmedPosition.current = null;
    setDestinationSelection({ selectionId, place, coordinates });
    setDestinationConfirmed(false);
    clearRoute();
    setPoints((previous) => ({ ...previous, destination: undefined }));
    setActivePoint('destination');
    setSearchOpen(false);
  }

  function selectDestination(place: PlaceSearchResult) {
    beginDestinationSelection(place);
  }

  function handlePointChange(kind: MapPointKind, selection: MapSelection) {
    if (overview) return;
    if (kind === 'destination') {
      if (selection.selectionId !== currentSelectionId.current) return;
      const confirmed = confirmedPosition.current;
      if (confirmed && (
        Math.abs(confirmed.latitude - selection.latitude) >= 0.0000001 ||
        Math.abs(confirmed.longitude - selection.longitude) >= 0.0000001
      )) {
        confirmedPosition.current = null;
        setDestinationConfirmed(false);
        clearRoute();
      }
    }
    setPoints((previous) => ({ ...previous, [kind]: selection }));
  }

  function handleSearchResponse(response: PlaceSearchResponse) {
    if (!searchOpen || response.requestId !== currentSearchRequestId.current || response.query !== searchText.trim()) return;
    setSearchResults(response.places);
    setSearchStatus(response.status);
  }

  function confirmDestination() {
    if (destinationConfirmed) {
      confirmedPosition.current = null;
      setDestinationConfirmed(false);
      clearRoute();
      return;
    }
    const departure = points.departure;
    const destination = points.destination ?? searchedPlace;
    if (!departure || !destination) return;
    confirmedPosition.current = { latitude: destination.latitude, longitude: destination.longitude };
    routeRequestId.current++;
    setRouteState({ status: 'loading' });
    setOverview({
      departure: { latitude: departure.latitude, longitude: departure.longitude },
      destination: { latitude: destination.latitude, longitude: destination.longitude },
      routePath: null,
    });
    setDestinationConfirmed(true);
  }

  async function applySelection() {
    if (!canApply || !departureDraft || !destinationDraft) return;
    if (editing) {
      try {
        setSaving(true); setSaveError(null);
        await updateRoomLocations(roomEdit.roomId, departureDraft, destinationDraft);
        clearRoomEdit();
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : '장소를 변경하지 못했어요.');
        setSaving(false);
        return;
      }
      setSaving(false);
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: '/rooms/[roomId]', params: { roomId: String(roomEdit.roomId) } });
      return;
    }
    updateDraft({ origin: departureDraft, destination: destinationDraft });
    if (router.canGoBack()) router.back();
    else router.replace('/rooms/create');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/rooms/create')}>
          <Text style={styles.backText}>‹ {editing ? '방 관리로 돌아가기' : '방 만들기로 돌아가기'}</Text>
        </Pressable>
        <Text style={styles.eyebrow}>지도·위치 선택 시연</Text>
        <Text style={styles.title}>위치 선택</Text>
        <Text style={styles.description}>
          {overview
            ? '선택한 출발지와 도착지를 지도에서 함께 확인하세요.'
            : activePoint === 'departure'
              ? '지도를 움직여 중앙 핀 아래 출발지를 고르세요.'
              : '지도를 움직여 중앙 핀 아래 도착지를 조정하세요.'}
        </Text>
      </View>
      <View style={styles.mapFrame}>
        <KakaoMapView
          activePoint={activePoint}
          initialDeparture={initialOrigin ? { latitude: initialOrigin.latitude, longitude: initialOrigin.longitude } : null}
          onPointChange={handlePointChange}
          searchRequest={searchRequest}
          onSearchResponse={handleSearchResponse}
          destinationSelection={destinationSelection}
          overview={displayedOverview}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>{overview ? '선택한 위치' : '선택할 위치'}</Text>
        <View style={styles.selectionRow}>
          {pointOptions.map(({ kind, label }) => {
            const selected = !overview && activePoint === kind;
            const summary = getPointSummary(kind, points[kind], kind === 'destination' ? searchedPlace : null);
            return (
              <Pressable
                key={kind}
                accessibilityRole="button"
                accessibilityLabel={`${label}, ${summary}`}
                accessibilityState={{ selected }}
                onPress={() => {
                  if (overview) {
                    confirmedPosition.current = null;
                    setDestinationConfirmed(false);
                    clearRoute();
                  }
                  if (kind === 'departure') setActivePoint('departure');
                  else if (destinationSelection) setActivePoint('destination');
                  else if (points.destination) beginDestinationSelection(savedPlace, {
                    latitude: points.destination.latitude, longitude: points.destination.longitude,
                  });
                  else openDestinationSearch();
                }}
                style={[styles.selectionCard, selected && styles.selectionCardActive]}
              >
                <Text style={[styles.selectionLabel, kind === 'departure' ? styles.departureLabel : styles.destinationLabel]}>{label}</Text>
                <Text style={styles.selectionHint} numberOfLines={2}>{summary}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.locationPanel}>
          <Text style={styles.locationHeading}>
            {activePoint === 'departure'
              ? '출발 핀 위치'
              : exactSearchPlace ? '검색 결과에서 선택한 장소' : overview ? '확정한 도착지' : '지도에서 조정한 위치'}
          </Text>
          {exactSearchPlace ? (
            <>
              <View style={styles.locationDetail}>
                <Text style={styles.detailLabel}>검색 결과 장소명</Text>
                <Text style={styles.placeName} numberOfLines={2}>{exactSearchPlace.name}</Text>
              </View>
              <View style={styles.locationDetail}>
                <Text style={styles.detailLabel}>도로명 주소</Text>
                <Text style={styles.roadAddress} numberOfLines={2}>
                  {exactSearchPlace.roadAddress ?? selectedPoint?.roadAddress ?? '도로명 주소 정보 없음'}
                </Text>
              </View>
            </>
          ) : !selectedPoint ? (
            <Text style={styles.locationStatus}>
              {activePoint === 'departure' ? '지도 위치를 확인하는 중...' : '지도에서 도착지 위치를 확인하는 중...'}
            </Text>
          ) : selectedPoint.addressStatus === 'loading' ? (
            <Text style={styles.locationStatus}>핀 위치의 도로명 주소를 확인하는 중...</Text>
          ) : selectedPoint.addressStatus === 'unavailable' ? (
            <Text style={styles.locationStatus}>주소를 확인할 수 없어요. 핀 좌표는 유지되며, 나중에 경로를 찾지 못하면 위치를 다시 조정해야 합니다.</Text>
          ) : (
            <>
              {selectedPoint.buildingCandidate && (
                <View style={styles.locationDetail}>
                  <Text style={styles.detailLabel}>주소 기반 건물명 후보</Text>
                  <Text style={styles.placeName} numberOfLines={2}>{selectedPoint.buildingCandidate}</Text>
                </View>
              )}
              <View style={styles.locationDetail}>
                <Text style={styles.detailLabel}>{selectedPoint.addressKind === 'nearby' ? '핀 주변의 주소 (정확한 핀 주소가 아님)' : selectedPoint.addressKind === 'parcel' ? '핀 위치의 지번 주소' : '핀 위치의 도로명 주소'}</Text>
                <Text style={styles.roadAddress} numberOfLines={2}>{selectedPoint.roadAddress}</Text>
              </View>
            </>
          )}
          {overview && (
            routeState.status === 'ready' ? (
              <View style={styles.routeMetrics}>
                <View style={styles.routeMetric}>
                  <Text style={styles.routeMetricLabel}>도로 경로 거리</Text>
                  <Text style={styles.routeMetricValue}>
                    {routeState.route.distanceMeters >= 1000
                      ? `${(routeState.route.distanceMeters / 1000).toFixed(1)}km`
                      : `${routeState.route.distanceMeters}m`}
                  </Text>
                </View>
                <View style={styles.routeMetric}>
                  <Text style={styles.routeMetricLabel}>현재 기준 예상 시간</Text>
                  <Text style={styles.routeMetricValue}>{Math.max(1, Math.round(routeState.route.durationSeconds / 60))}분</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.routeStatus}>
                {routeState.status === 'error' ? routeState.message : '도로 경로와 예상 시간을 확인하는 중...'}
              </Text>
            )
          )}
        </View>
        {!overview && <Text style={styles.footerText} numberOfLines={2}>
          {activePoint === 'departure'
              ? '지도 이동이 멈추면 중앙 핀 위치를 다시 조회합니다.'
              : destinationConfirmed
                ? '도착지를 선택했어요. 두 위치를 지도에서 확인할 수 있습니다.'
                : selectedPoint?.source === 'map' && searchedPlace
                  ? `검색한 장소: ${searchedPlace.name} (참고)`
                  : searchedPlace
                    ? '지도를 움직이면 핀 위치 정보로 전환됩니다.'
                    : '지도 이동이 멈추면 중앙 핀 위치를 조회합니다.'}
        </Text>}
        {activePoint === 'destination' && (destinationSelection || points.destination) && !overview && (
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={openDestinationSearch} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>다시 검색</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: destinationConfirmed, disabled: !canConfirmDestination && !destinationConfirmed }}
              disabled={!canConfirmDestination && !destinationConfirmed}
              onPress={confirmDestination}
              style={[styles.primaryButton, !canConfirmDestination && !destinationConfirmed && styles.primaryButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {destinationConfirmed ? '다시 조정' : canConfirmDestination ? '이 위치로 확정' : '위치 확인 중'}
              </Text>
            </Pressable>
          </View>
        )}
        {activePoint === 'departure' && points.destination && !overview && (
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !departureDraft }}
            disabled={!departureDraft} onPress={confirmDestination}
            style={[styles.applyButton, !departureDraft && styles.primaryButtonDisabled]}>
            <Text style={styles.primaryButtonText}>두 위치 다시 확인</Text>
          </Pressable>
        )}
        {overview && (
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canApply || saving }}
            disabled={!canApply || saving} onPress={() => void applySelection()}
            style={[styles.applyButton, (!canApply || saving) && styles.primaryButtonDisabled]}>
            <Text style={styles.primaryButtonText}>{saving ? '저장 중...' : editing ? '장소 변경 저장' : '선택한 위치 적용'}</Text>
          </Pressable>
        )}
        {overview && !canApply && <Text style={styles.locationStatus}>핀 위치를 확인하는 중이에요.</Text>}
        {saveError && <Text style={styles.locationStatus}>{saveError}</Text>}
      </View>
      {searchOpen && (
        <PlaceSearchPanel
          departureLabel={points.departure?.buildingCandidate ?? points.departure?.roadAddress ?? '출발지 주소 확인 중'}
          query={searchText}
          onQueryChange={(query) => {
            setSearchText(query);
            setSearchResults([]);
            setSearchStatus(query.trim() ? 'loading' : 'idle');
          }}
          status={searchStatus}
          places={searchResults}
          onSelect={selectDestination}
          onMapSelect={() => beginDestinationSelection(null)}
          onBack={() => {
            Keyboard.dismiss();
            setSearchOpen(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 },
  backText: { color: '#2864F5', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  eyebrow: { color: '#2864F5', fontSize: 12, fontWeight: '700', marginBottom: 5 },
  title: { color: '#17243C', fontSize: 27, fontWeight: '800' },
  description: { color: '#677486', fontSize: 14, marginTop: 8 },
  mapFrame: { flex: 1, minHeight: 200, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', borderColor: '#DCE3ED', borderWidth: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  footerTitle: { color: '#17243C', fontSize: 15, fontWeight: '700' },
  selectionRow: { flexDirection: 'row', gap: 10, marginTop: 9 },
  selectionCard: { flex: 1, height: 72, borderWidth: 1, borderColor: '#DCE3ED', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#F7F9FC' },
  selectionCardActive: { borderColor: '#2864F5', backgroundColor: '#EEF3FF' },
  selectionLabel: { fontSize: 14, fontWeight: '700' },
  selectionHint: { color: '#677486', fontSize: 11, lineHeight: 15, height: 30, marginTop: 2 },
  departureLabel: { color: '#D54C4C' },
  destinationLabel: { color: '#2864F5' },
  locationPanel: { minHeight: 180, marginTop: 10, padding: 12, borderWidth: 1, borderColor: '#DCE3ED', borderRadius: 12, backgroundColor: '#FFFFFF' },
  locationHeading: { color: '#17243C', fontSize: 14, fontWeight: '700' },
  locationStatus: { color: '#677486', fontSize: 13, lineHeight: 18, marginTop: 8 },
  locationDetail: { marginTop: 8 },
  detailLabel: { color: '#677486', fontSize: 11, lineHeight: 15 },
  placeName: { color: '#17243C', fontSize: 14, fontWeight: '600', lineHeight: 19 },
  roadAddress: { color: '#17243C', fontSize: 13, lineHeight: 18 },
  routeMetrics: { flexDirection: 'row', gap: 12, marginTop: 24 },
  routeMetric: { flex: 1, minWidth: 0 },
  routeMetricLabel: { color: '#677486', fontSize: 12, lineHeight: 17 },
  routeMetricValue: { color: '#17243C', fontSize: 25, fontWeight: '800', marginTop: 4 },
  routeStatus: { color: '#677486', fontSize: 13, lineHeight: 19, marginTop: 24 },
  footerText: { color: '#677486', fontSize: 12, lineHeight: 17, height: 34, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  secondaryButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DCE3ED', borderRadius: 11 },
  secondaryButtonText: { color: '#17243C', fontSize: 14, fontWeight: '700' },
  primaryButton: { flex: 1.5, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#2864F5' },
  primaryButtonDisabled: { backgroundColor: '#A8B9DD' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  applyButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#2864F5', marginTop: 12 },
});
