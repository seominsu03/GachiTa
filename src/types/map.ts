export type PlaceSearchResult = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  roadAddress: string | null;
};

export type PlaceSearchRequest = {
  requestId: number;
  query: string;
};

export type PlaceSearchResponse = PlaceSearchRequest & {
  status: 'ok' | 'empty' | 'error';
  places: PlaceSearchResult[];
};

export type DestinationSelection = {
  selectionId: number;
  place: PlaceSearchResult | null;
};
