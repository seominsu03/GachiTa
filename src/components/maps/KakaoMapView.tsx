import { type ComponentProps, type ForwardRefExoticComponent, type RefAttributes, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { DestinationSelection, PlaceSearchRequest, PlaceSearchResponse, PlaceSearchResult } from '@/types/map';

const KAKAO_MAP_WEB_ORIGIN = 'http://localhost';

export type MapPointKind = 'departure' | 'destination';
export type MapCoordinates = { latitude: number; longitude: number };
export type MapSelection = MapCoordinates & {
  addressStatus: 'loading' | 'resolved' | 'unavailable';
  buildingCandidate: string | null;
  roadAddress: string | null;
  source: 'map' | 'search';
  selectionId: number | null;
};
export type MapOverview = {
  departure: MapCoordinates;
  destination: MapCoordinates;
  routePath: MapCoordinates[] | null;
};

type WebViewHandle = { injectJavaScript: (script: string) => void };
const ReferencedWebView = WebView as unknown as ForwardRefExoticComponent<ComponentProps<typeof WebView> & RefAttributes<WebViewHandle>>;

type KakaoMapViewProps = {
  activePoint: MapPointKind;
  onPointChange: (kind: MapPointKind, selection: MapSelection) => void;
  searchRequest: PlaceSearchRequest | null;
  onSearchResponse: (response: PlaceSearchResponse) => void;
  destinationSelection: DestinationSelection | null;
  overview: MapOverview | null;
};

function createMapHtml(javascriptKey: string): string {
  const sdkUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(javascriptKey)}&autoload=false&libraries=services`;

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
    body { background: #eef3f9; overflow: hidden; }
    #centerPin { position: absolute; left: 50%; top: 50%; z-index: 2; transform: translate(-50%, -100%); pointer-events: none; }
    #centerPinLabel { padding: 8px 12px; border-radius: 9px; background: #17243c; color: #fff; font-size: 15px; font-weight: 700; box-shadow: 0 2px 8px rgba(0, 0, 0, .2); }
    #centerPinStem { width: 3px; height: 18px; margin: 0 auto; background: #17243c; }
    #centerPinDot { width: 8px; height: 8px; margin: 0 auto; border-radius: 50%; background: #17243c; }
    #centerPin.destination #centerPinLabel, #centerPin.destination #centerPinStem, #centerPin.destination #centerPinDot { background: #d54c4c; }
  </style>
  <script>
    window.reportMapError = function(message) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: message }));
    };
  </script>
  <script src="${sdkUrl}" onerror="window.reportMapError('카카오 지도 SDK를 불러오지 못했습니다.')"></script>
</head>
<body>
  <div id="map"></div>
  <div id="centerPin" aria-hidden="true"><div id="centerPinLabel">출발</div><div id="centerPinStem"></div><div id="centerPinDot"></div></div>
  <script>
    var mapReady = false;
    var timeout = setTimeout(function() {
      if (!mapReady) window.reportMapError('지도 로딩 시간이 초과되었습니다.');
    }, 15000);

    if (window.kakao && kakao.maps) {
      kakao.maps.load(function() {
        var map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(37.266, 127.000),
          level: 5
        });
        var departurePosition = map.getCenter();
        var markers = { departure: null, destination: null };
        var lookupVersions = { departure: 0, destination: 0 };
        var lookupState = {
          departure: { position: null, invalidated: false },
          destination: { position: null, invalidated: false }
        };
        var activePoint = 'departure';
        var inOverview = false;
        var routePolyline = null;
        var selectedSearchPosition = null;
        var destinationSelectionId = null;
        var latestSearchRequestId = 0;
        var centerPin = document.getElementById('centerPin');
        var centerPinLabel = document.getElementById('centerPinLabel');
        var geocoder = kakao.maps.services && kakao.maps.services.Geocoder
          ? new kakao.maps.services.Geocoder()
          : null;
        var places = kakao.maps.services && kakao.maps.services.Places
          ? new kakao.maps.services.Places()
          : null;
        var markerSize = new kakao.maps.Size(50, 45);
        var markerOffset = { offset: new kakao.maps.Point(15, 43) };
        var markerImages = {
          departure: new kakao.maps.MarkerImage('https://t1.kakaocdn.net/localimg/localimages/07/mapapidoc/red_b.png', markerSize, markerOffset),
          destination: new kakao.maps.MarkerImage('https://t1.kakaocdn.net/localimg/localimages/07/mapapidoc/blue_b.png', markerSize, markerOffset)
        };

        markers.departure = new kakao.maps.Marker({
          position: departurePosition,
          image: markerImages.departure,
          title: '출발지'
        });

        window.setActivePoint = function(kind) {
          if ((kind !== 'departure' && kind !== 'destination') || (kind === activePoint && !inOverview)) return;
          inOverview = false;
          centerPin.style.display = '';
          if (routePolyline) {
            routePolyline.setMap(null);
            routePolyline = null;
          }
          activePoint = kind;
          centerPin.className = kind === 'destination' ? 'destination' : '';
          centerPinLabel.textContent = kind === 'destination' ? '도착' : '출발';
          markers.departure.setMap(kind === 'departure' ? null : map);
          if (markers.destination) {
            markers.destination.setMap(kind === 'destination' ? null : map);
          }
          if (markers[kind]) {
            map.setCenter(markers[kind].getPosition());
            refreshPoint(kind, map.getCenter());
          }
        };

        function toLatLng(point) {
          return point && Number.isFinite(point.latitude) && point.latitude >= -90 && point.latitude <= 90 &&
            Number.isFinite(point.longitude) && point.longitude >= -180 && point.longitude <= 180
            ? new kakao.maps.LatLng(point.latitude, point.longitude)
            : null;
        }

        window.showOverview = function(overview) {
          var departure = overview && toLatLng(overview.departure);
          var destination = overview && toLatLng(overview.destination);
          if (!departure || !destination) return;

          inOverview = true;
          centerPin.style.display = 'none';
          lookupVersions.departure += 1;
          lookupVersions.destination += 1;
          markers.departure.setPosition(departure);
          markers.departure.setMap(map);
          if (!markers.destination) {
            markers.destination = new kakao.maps.Marker({
              position: destination,
              image: markerImages.destination,
              title: '도착지'
            });
          } else {
            markers.destination.setPosition(destination);
          }
          markers.destination.setMap(map);

          if (routePolyline) {
            routePolyline.setMap(null);
            routePolyline = null;
          }
          var bounds = new kakao.maps.LatLngBounds();
          bounds.extend(departure);
          bounds.extend(destination);
          if (Array.isArray(overview.routePath) && overview.routePath.length > 1) {
            var path = overview.routePath.map(toLatLng);
            if (path.every(Boolean)) {
              routePolyline = new kakao.maps.Polyline({
                map: map,
                path: path,
                strokeWeight: 5,
                strokeColor: '#2864F5',
                strokeOpacity: 0.9
              });
              path.forEach(function(position) { bounds.extend(position); });
            }
          }
          map.setBounds(bounds, 72, 56, 72, 56);
        };

        function samePosition(first, second) {
          return first && second &&
            Math.abs(first.getLat() - second.getLat()) < 0.0000001 &&
            Math.abs(first.getLng() - second.getLng()) < 0.0000001;
        }

        function reportPoint(kind, position, addressStatus, buildingCandidate, roadAddress) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'point',
            pointType: kind,
            latitude: position.getLat(),
            longitude: position.getLng(),
            addressStatus: addressStatus,
            buildingCandidate: buildingCandidate,
            roadAddress: roadAddress,
            source: kind === 'destination' && samePosition(position, selectedSearchPosition) ? 'search' : 'map',
            selectionId: kind === 'destination' ? destinationSelectionId : null
          }));
        }

        function invalidateAddress(kind, position) {
          lookupVersions[kind] += 1;
          reportPoint(kind, position, 'loading', null, null);
        }

        function lookupAddress(kind, position) {
          var version = ++lookupVersions[kind];
          reportPoint(kind, position, 'loading', null, null);
          if (!geocoder) {
            reportPoint(kind, position, 'unavailable', null, null);
            return;
          }

          try {
            geocoder.coord2Address(position.getLng(), position.getLat(), function(result, status) {
              if (version !== lookupVersions[kind]) return;
              var road = status === kakao.maps.services.Status.OK && result && result[0]
                ? result[0].road_address
                : null;
              var roadAddress = road && typeof road.address_name === 'string'
                ? road.address_name.trim()
                : '';
              if (roadAddress) {
                var buildingName = typeof road.building_name === 'string'
                  ? road.building_name.trim()
                  : '';
                reportPoint(kind, position, 'resolved', buildingName || null, roadAddress);
              } else {
                reportPoint(kind, position, 'unavailable', null, null);
              }
            });
          } catch (error) {
            if (version === lookupVersions[kind]) {
              reportPoint(kind, position, 'unavailable', null, null);
            }
          }
        }

        function refreshPoint(kind, position) {
          if (!markers[kind]) return;
          var current = lookupState[kind];
          if (samePosition(current.position, position) && !current.invalidated) return;
          current.position = position;
          current.invalidated = false;
          markers[kind].setPosition(position);
          lookupAddress(kind, position);
        }

        window.searchPlaces = function(query, requestId) {
          if (typeof query !== 'string' || !Number.isInteger(requestId) || requestId < 1) return;
          latestSearchRequestId = requestId;
          var keyword = query.trim();
          if (!keyword || !places) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'search', requestId: requestId, query: keyword,
              status: places ? 'empty' : 'error', places: []
            }));
            return;
          }
          try {
            places.keywordSearch(keyword, function(result, status) {
              if (requestId !== latestSearchRequestId) return;
              var found = status === kakao.maps.services.Status.OK && Array.isArray(result)
                ? result.map(function(place) {
                    var latitude = Number(place.y);
                    var longitude = Number(place.x);
                    var name = typeof place.place_name === 'string' ? place.place_name.trim() : '';
                    if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
                        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
                    return {
                      id: String(place.id),
                      name: name,
                      latitude: latitude,
                      longitude: longitude,
                      roadAddress: typeof place.road_address_name === 'string' && place.road_address_name.trim()
                        ? place.road_address_name.trim() : null
                    };
                  }).filter(Boolean)
                : [];
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'search', requestId: requestId, query: keyword,
                status: status === kakao.maps.services.Status.ERROR ? 'error' : found.length ? 'ok' : 'empty',
                places: found
              }));
            }, { size: 15 });
          } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'search', requestId: requestId, query: keyword, status: 'error', places: []
            }));
          }
        };

        function beginDestination(position, selectionId, fromSearch) {
          selectedSearchPosition = fromSearch ? position : null;
          destinationSelectionId = selectionId;
          lookupVersions.destination += 1;
          lookupState.destination.position = null;
          if (!markers.destination) {
            markers.destination = new kakao.maps.Marker({
              position: position,
              image: markerImages.destination,
              title: '도착지'
            });
          } else {
            markers.destination.setPosition(position);
          }
          window.setActivePoint('destination');
          map.setCenter(position);
          refreshPoint('destination', map.getCenter());
        }

        window.selectDestination = function(latitude, longitude, selectionId) {
          if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
              !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
              !Number.isInteger(selectionId) || selectionId < 1) return;
          beginDestination(new kakao.maps.LatLng(latitude, longitude), selectionId, true);
        };

        window.startDestinationOnMap = function(selectionId) {
          if (!Number.isInteger(selectionId) || selectionId < 1) return;
          beginDestination(map.getCenter(), selectionId, false);
        };

        kakao.maps.event.addListener(map, 'dragstart', function() {
          if (inOverview) return;
          if (!markers[activePoint]) return;
          lookupState[activePoint].invalidated = true;
          invalidateAddress(activePoint, map.getCenter());
        });

        kakao.maps.event.addListener(map, 'zoom_start', function() {
          if (inOverview) return;
          if (!markers[activePoint]) return;
          lookupState[activePoint].invalidated = true;
          invalidateAddress(activePoint, map.getCenter());
        });

        kakao.maps.event.addListener(map, 'idle', function() {
          if (inOverview) return;
          refreshPoint(activePoint, map.getCenter());
        });

        refreshPoint('departure', departurePosition);

        kakao.maps.event.addListener(map, 'tilesloaded', function() {
          if (mapReady) return;
          mapReady = true;
          clearTimeout(timeout);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        });
      });
    } else {
      clearTimeout(timeout);
      window.reportMapError('카카오 지도 SDK가 시작되지 않았습니다.');
    }
  </script>
</body>
</html>`;
}

export default function KakaoMapView({ activePoint, onPointChange, searchRequest, onSearchResponse, destinationSelection, overview }: KakaoMapViewProps) {
  const webViewRef = useRef<WebViewHandle>(null);
  const javascriptKey = process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY?.trim();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const source = useMemo(
    () => ({ html: createMapHtml(javascriptKey ?? ''), baseUrl: KAKAO_MAP_WEB_ORIGIN }),
    [javascriptKey],
  );

  useEffect(() => {
    if (status !== 'ready') return;
    webViewRef.current?.injectJavaScript(
      overview
        ? `window.showOverview(${JSON.stringify(overview)}); true;`
        : `window.setActivePoint(${JSON.stringify(activePoint)}); true;`,
    );
  }, [activePoint, overview, status]);

  useEffect(() => {
    if (status === 'ready' && searchRequest) {
      webViewRef.current?.injectJavaScript(
        `window.searchPlaces(${JSON.stringify(searchRequest.query)}, ${searchRequest.requestId}); true;`,
      );
    }
  }, [searchRequest, status]);

  useEffect(() => {
    if (status === 'ready' && destinationSelection) {
      if (destinationSelection.place) {
        const { latitude, longitude } = destinationSelection.place;
        webViewRef.current?.injectJavaScript(
          `window.selectDestination(${latitude}, ${longitude}, ${destinationSelection.selectionId}); true;`,
        );
      } else {
        webViewRef.current?.injectJavaScript(
          `window.startDestinationOnMap(${destinationSelection.selectionId}); true;`,
        );
      }
    }
  }, [destinationSelection, status]);

  if (!javascriptKey) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>카카오 지도 키를 입력해 주세요</Text>
        <Text style={styles.placeholderText}>키를 입력한 뒤 앱을 새로고침하면 실제 지도를 확인할 수 있습니다.</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>휴대폰에서 지도를 확인해 주세요</Text>
        <Text style={styles.placeholderText}>이 지도 시연 화면은 Android Expo Go에서 확인합니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReferencedWebView
        ref={webViewRef}
        source={source}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={(event) => {
          try {
            const message: {
              type?: string;
              message?: string;
              pointType?: string;
              latitude?: number;
              longitude?: number;
              addressStatus?: string;
              buildingCandidate?: string | null;
              roadAddress?: string | null;
              source?: string;
              selectionId?: number | null;
              requestId?: number;
              query?: string;
              places?: unknown;
              status?: string;
            } = JSON.parse(event.nativeEvent.data);
            if (message.type === 'ready') {
              setStatus('ready');
              return;
            }
            if (
              message.type === 'search' &&
              typeof message.requestId === 'number' &&
              Number.isInteger(message.requestId) &&
              typeof message.query === 'string' &&
              (message.status === 'ok' || message.status === 'empty' || message.status === 'error') &&
              Array.isArray(message.places) &&
              message.places.every((place: unknown): place is PlaceSearchResult => {
                if (!place || typeof place !== 'object') return false;
                const result = place as Partial<PlaceSearchResult>;
                return typeof result.id === 'string' && typeof result.name === 'string' &&
                  typeof result.latitude === 'number' && Number.isFinite(result.latitude) &&
                  result.latitude >= -90 && result.latitude <= 90 &&
                  typeof result.longitude === 'number' && Number.isFinite(result.longitude) &&
                  result.longitude >= -180 && result.longitude <= 180 &&
                  (result.roadAddress === null || typeof result.roadAddress === 'string');
              })
            ) {
              onSearchResponse({
                requestId: message.requestId,
                query: message.query,
                status: message.status,
                places: message.places,
              });
              return;
            }
            if (
              message.type === 'point' &&
              (message.pointType === 'departure' || message.pointType === 'destination') &&
              typeof message.latitude === 'number' &&
              Number.isFinite(message.latitude) &&
              message.latitude >= -90 &&
              message.latitude <= 90 &&
              typeof message.longitude === 'number' &&
              Number.isFinite(message.longitude) &&
              message.longitude >= -180 &&
              message.longitude <= 180 &&
              (message.addressStatus === 'loading' || message.addressStatus === 'resolved' || message.addressStatus === 'unavailable') &&
              (message.buildingCandidate === null || typeof message.buildingCandidate === 'string') &&
              (message.roadAddress === null || typeof message.roadAddress === 'string') &&
              (message.source === 'map' || message.source === 'search') &&
              (message.selectionId === null || (typeof message.selectionId === 'number' && Number.isInteger(message.selectionId)))
            ) {
              onPointChange(message.pointType, {
                latitude: message.latitude,
                longitude: message.longitude,
                addressStatus: message.addressStatus,
                buildingCandidate: message.buildingCandidate,
                roadAddress: message.roadAddress,
                source: message.source,
                selectionId: message.selectionId,
              });
              return;
            }
            if (message.type === 'error') {
              setErrorMessage(message.message ?? '지도를 불러오지 못했습니다.');
              setStatus('error');
            }
          } catch {
            setErrorMessage('지도 응답을 확인할 수 없습니다.');
            setStatus('error');
          }
        }}
        onError={() => {
          setErrorMessage('지도 화면을 불러오지 못했습니다.');
          setStatus('error');
        }}
        style={styles.webView}
      />
      {status !== 'ready' && (
        <View style={styles.statusOverlay} pointerEvents="none">
          <Text style={styles.placeholderTitle}>{status === 'loading' ? '카카오 지도를 불러오는 중...' : errorMessage}</Text>
          {status === 'error' && <Text style={styles.placeholderText}>JavaScript 키와 등록 도메인(http://localhost)을 확인해 주세요.</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', borderRadius: 18, backgroundColor: '#EEF3F9' },
  webView: { flex: 1, backgroundColor: '#EEF3F9' },
  placeholder: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#EEF3F9' },
  statusOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#EEF3F9' },
  placeholderTitle: { color: '#1A2B47', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  placeholderText: { color: '#64748B', fontSize: 13, lineHeight: 20, marginTop: 10, textAlign: 'center' },
});
