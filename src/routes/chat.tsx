import { createFileRoute } from "@tanstack/react-router";
import { ChatWidget } from "../components/jagakl/ChatWidget";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function ChatPage() {
  return (
    <div className="min-h-[calc(100vh-40px)] bg-emerald-50 flex items-center justify-center p-4">
      <ChatWidget phone="web-demo" />
    </div>
  );
}
