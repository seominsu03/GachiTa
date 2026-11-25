export type FriendCandidate = { userId: number; username: string; nickname: string };
export type Friendship = {
  friendshipId: number;
  user: FriendCandidate;
  status: 'PENDING' | 'ACCEPTED';
  incoming: boolean;
  createdAt: string;
  acceptedAt: string | null;
};
export type FriendshipOverview = { friends: Friendship[]; incoming: Friendship[]; outgoing: Friendship[] };
