import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import KakaoMapView, { type MapOverview, type MapPointKind, type MapSelection } from '@/components/maps/KakaoMapView';
import PlaceSearchPanel, { type SearchStatus } from '@/components/maps/PlaceSearchPanel';
import type { DestinationSelection, PlaceSearchRequest, PlaceSearchResponse, PlaceSearchResult } from '@/types/map';

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
  if (point.addressStatus === 'unavailable') return '도로명 주소 확인 불가';
  return point.buildingCandidate
    ? `건물 후보 · ${point.buildingCandidate}`
    : point.roadAddress ?? '도로명 주소 확인 불가';
}

export default function MapPickerScreen() {
  const [activePoint, setActivePoint] = useState<MapPointKind>('departure');
  const [points, setPoints] = useState<Partial<Record<MapPointKind, MapSelection>>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchRequest, setSearchRequest] = useState<PlaceSearchRequest | null>(null);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [destinationSelection, setDestinationSelection] = useState<DestinationSelection | null>(null);
  const [destinationConfirmed, setDestinationConfirmed] = useState(false);
  const [overview, setOverview] = useState<MapOverview | null>(null);
  const searchRequestCounter = useRef(0);
  const currentSearchRequestId = useRef(0);
  const selectionCounter = useRef(0);
  const currentSelectionId = useRef<number | null>(null);
  const confirmedPosition = useRef<{ latitude: number; longitude: number } | null>(null);
  const selectedPoint = points[activePoint];
  const searchedPlace = destinationSelection?.place ?? null;
  const exactSearchPlace = activePoint === 'destination' && searchedPlace &&
    (!selectedPoint || selectedPoint.source === 'search') ? searchedPlace : null;
  const canConfirmDestination = Boolean(points.departure && destinationSelection && (points.destination || searchedPlace));

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
    setOverview(null);
    setSearchText('');
    setSearchRequest(null);
    setSearchStatus('idle');
    setSearchResults([]);
    setSearchOpen(true);
  }

  function beginDestinationSelection(place: PlaceSearchResult | null) {
    Keyboard.dismiss();
    const selectionId = ++selectionCounter.current;
    currentSelectionId.current = selectionId;
    confirmedPosition.current = null;
    setDestinationSelection({ selectionId, place });
    setDestinationConfirmed(false);
    setOverview(null);
    setPoints((previous) => ({ ...previous, destination: undefined }));
    setActivePoint('destination');
    setSearchOpen(false);
  }

  function selectDestination(place: PlaceSearchResult) {
    beginDestinationSelection(place);
  }

  function handlePointChange(kind: MapPointKind, selection: MapSelection) {
    if (kind === 'departure' && overview && (
      Math.abs(overview.departure.latitude - selection.latitude) >= 0.0000001 ||
      Math.abs(overview.departure.longitude - selection.longitude) >= 0.0000001
    )) {
      confirmedPosition.current = null;
      setDestinationConfirmed(false);
      setOverview(null);
    }
    if (kind === 'destination') {
      if (selection.selectionId !== currentSelectionId.current) return;
      const confirmed = confirmedPosition.current;
      if (confirmed && (
        Math.abs(confirmed.latitude - selection.latitude) >= 0.0000001 ||
        Math.abs(confirmed.longitude - selection.longitude) >= 0.0000001
      )) {
        confirmedPosition.current = null;
        setDestinationConfirmed(false);
        setOverview(null);
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
      setOverview(null);
      return;
    }
    const departure = points.departure;
    const destination = points.destination ?? searchedPlace;
    if (!departure || !destination) return;
    confirmedPosition.current = { latitude: destination.latitude, longitude: destination.longitude };
    setOverview({
      departure: { latitude: departure.latitude, longitude: departure.longitude },
      destination: { latitude: destination.latitude, longitude: destination.longitude },
      routePath: null,
    });
    setDestinationConfirmed(true);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
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
          onPointChange={handlePointChange}
          searchRequest={searchRequest}
          onSearchResponse={handleSearchResponse}
          destinationSelection={destinationSelection}
          overview={overview}
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
                    setOverview(null);
                  }
                  if (kind === 'departure') setActivePoint('departure');
                  else if (destinationSelection) setActivePoint('destination');
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
            <Text style={styles.locationStatus}>이 위치의 도로명 주소를 찾을 수 없어요.</Text>
          ) : (
            <>
              {selectedPoint.buildingCandidate && (
                <View style={styles.locationDetail}>
                  <Text style={styles.detailLabel}>주소 기반 건물명 후보</Text>
                  <Text style={styles.placeName} numberOfLines={2}>{selectedPoint.buildingCandidate}</Text>
                </View>
              )}
              <View style={styles.locationDetail}>
                <Text style={styles.detailLabel}>핀 위치의 도로명 주소</Text>
                <Text style={styles.roadAddress} numberOfLines={2}>{selectedPoint.roadAddress}</Text>
              </View>
            </>
          )}
        </View>
        <Text style={styles.footerText} numberOfLines={2}>
          {overview
            ? '두 위치를 함께 표시했습니다. 실제 도로 경로와 예상 시간은 서버 연결 후 표시됩니다.'
            : activePoint === 'departure'
              ? '지도 이동이 멈추면 중앙 핀 위치를 다시 조회합니다.'
              : destinationConfirmed
                ? '도착지를 선택했어요. 두 위치를 지도에서 확인할 수 있습니다.'
                : selectedPoint?.source === 'map' && searchedPlace
                  ? `검색한 장소: ${searchedPlace.name} (참고)`
                  : searchedPlace
                    ? '지도를 움직이면 핀 위치 정보로 전환됩니다.'
                    : '지도 이동이 멈추면 중앙 핀 위치를 조회합니다.'}
        </Text>
        {activePoint === 'destination' && destinationSelection && (
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
  footerText: { color: '#677486', fontSize: 12, lineHeight: 17, height: 34, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  secondaryButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DCE3ED', borderRadius: 11 },
  secondaryButtonText: { color: '#17243C', fontSize: 14, fontWeight: '700' },
  primaryButton: { flex: 1.5, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#2864F5' },
  primaryButtonDisabled: { backgroundColor: '#A8B9DD' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
