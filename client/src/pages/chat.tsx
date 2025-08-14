import { ChatWindow } from "@/components/chat/chat-window";

export default function Chat() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Chat</h1>
          <p className="mt-1 text-sm text-gray-600">Stay connected with your family in real-time</p>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)]">
          <ChatWindow />
        </div>
      </main>
    </div>
  );
}
