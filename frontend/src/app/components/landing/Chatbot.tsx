import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getErrMsg } from "../../../lib/api";
import { parseMarkdownToHtml } from "../../utils/markdownParser";

interface Message {
  sender: "user" | "bot";
  text: string;
  isHtml?: boolean;
}

/**
 */
export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hello! I am the Horse Racing AI Assistant. You can ask me any questions about tournaments, jockeys, horses, or rule violations (e.g., 'Top 3 best horses' or 'Storm horse info').",
      isHtml: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [sessionId] = useState(() => "session-" + Math.random().toString(36).substr(2, 9));

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await api.post<any>("/ai/chat", { message: userMessage, lang: "en", sessionId });
      if (res.success && res.reply) {
        setMessages((prev) => [...prev, { sender: "bot", text: res.reply, isHtml: true }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Sorry, I cannot connect to the database at the moment." },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "An error occurred while connecting to the AI server: " + (getErrMsg(err, "Unknown error")) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-black/60 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500 text-black font-bold font-serif text-xl shadow-lg">
            H
          </div>
          <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">
            AI ASSISTANT
          </span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 border border-white/5 hover:bg-[#151310]/50 text-sm font-medium rounded-xl transition"
        >
          Back to Home
        </button>
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col justify-between overflow-hidden">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4 max-h-[calc(100vh-230px)]"
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl border text-sm shadow-md leading-relaxed ${
                  m.sender === "user"
                    ? "bg-amber-500/10 border-amber-500/20 text-white rounded-br-none"
                    : "bg-[#151310]/50 border-white/10 text-slate-100 rounded-bl-none overflow-x-auto"
                }`}
              >
                {m.sender === "bot" ? (
                  <div
                    className="prose prose-invert max-w-none chatbot-response"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(m.text) }}
                  />
                ) : (
                  <p>{m.text}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#151310]/50 border border-white/10 p-4 rounded-2xl rounded-bl-none text-sm text-white/60 flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="relative mt-2">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            className="w-full pl-6 pr-16 py-4 bg-[#151310]/60 border border-white/5 rounded-2xl placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition"
            placeholder="Ask about jockeys, race results..."
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-3 top-2.5 h-10 px-4 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
