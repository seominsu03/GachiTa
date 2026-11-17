import { ScrollView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { PlaceSearchResult } from '@/types/map';

export type SearchStatus = 'idle' | 'loading' | 'ok' | 'empty' | 'error';

type PlaceSearchPanelProps = {
  departureLabel: string;
  query: string;
  onQueryChange: (query: string) => void;
  status: SearchStatus;
  places: PlaceSearchResult[];
  onSelect: (place: PlaceSearchResult) => void;
  onMapSelect: () => void;
  onBack: () => void;
};

export default function PlaceSearchPanel({
  departureLabel,
  query,
  onQueryChange,
  status,
  places,
  onSelect,
  onMapSelect,
  onBack,
}: PlaceSearchPanelProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="지도 선택으로 돌아가기" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>도착지 검색</Text>
      </View>
      <View style={styles.departureRow}>
        <Text style={styles.departureLabel}>출발지 유지</Text>
        <Text style={styles.departureName} numberOfLines={1}>{departureLabel}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onMapSelect} style={styles.mapChoice}>
        <Text style={styles.mapChoiceText}>검색 없이 지도에서 직접 선택</Text>
        <Text style={styles.mapChoiceArrow}>›</Text>
      </Pressable>
      <TextInput
        autoFocus
        accessibilityLabel="도착지 장소 검색"
        autoCapitalize="none"
        placeholder="장소나 건물명을 입력해 주세요"
        placeholderTextColor="#8A96A8"
        returnKeyType="search"
        value={query}
        onChangeText={onQueryChange}
        style={styles.input}
      />
      <ScrollView style={styles.resultsList} contentContainerStyle={styles.results} keyboardShouldPersistTaps="handled">
        {status === 'idle' && <Text style={styles.message}>도착지 이름을 검색해 주세요.</Text>}
        {status === 'loading' && <Text style={styles.message}>장소를 찾는 중...</Text>}
        {status === 'empty' && <Text style={styles.message}>검색 결과가 없어요. 다른 이름으로 검색해 보세요.</Text>}
        {status === 'error' && <Text style={styles.message}>장소 검색에 실패했어요. 다시 입력해 주세요.</Text>}
        {status === 'ok' && places.map((place) => (
          <Pressable
            key={place.id}
            accessibilityRole="button"
            accessibilityLabel={`${place.name} 선택`}
            onPress={() => onSelect(place)}
            style={styles.result}
          >
            <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
            <Text style={styles.roadAddress} numberOfLines={2}>
              {place.roadAddress ?? '도로명 주소 정보 없음'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 5, backgroundColor: '#FFFFFF', paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 18, paddingBottom: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#17243C', fontSize: 38, lineHeight: 42 },
  title: { color: '#17243C', fontSize: 24, fontWeight: '800' },
  departureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#F7F9FC' },
  departureLabel: { color: '#D54C4C', fontSize: 12, fontWeight: '700' },
  departureName: { flex: 1, color: '#17243C', fontSize: 14 },
  mapChoice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, marginTop: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#EEF3FF' },
  mapChoiceText: { color: '#2864F5', fontSize: 14, fontWeight: '700' },
  mapChoiceArrow: { color: '#2864F5', fontSize: 24 },
  input: { marginTop: 14, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#2864F5', paddingHorizontal: 14, color: '#17243C', fontSize: 16 },
  resultsList: { flex: 1 },
  results: { paddingTop: 12, paddingBottom: 24 },
  message: { color: '#677486', fontSize: 14, lineHeight: 21, paddingTop: 16 },
  result: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E7ECF3' },
  placeName: { color: '#17243C', fontSize: 16, fontWeight: '700' },
  roadAddress: { color: '#677486', fontSize: 13, lineHeight: 18, marginTop: 5 },
});
