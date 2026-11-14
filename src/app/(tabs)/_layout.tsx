import { Slot } from 'expo-router';

// The final product tabs belong to the shared navigation task. Stage 1 exposes
// only the implemented chats route without filling another owner's screens.
export default function ChatPreviewLayout() {
  return <Slot />;
}
