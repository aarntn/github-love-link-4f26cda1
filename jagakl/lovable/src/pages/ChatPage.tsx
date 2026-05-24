import { ChatWidget } from "../components/ChatWidget";

// TODO: replace with real user phone from auth/context
const DEMO_PHONE = "web-demo";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
      <ChatWidget phone={DEMO_PHONE} />
    </div>
  );
}
