import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Paperclip, X, Bot, User, Trash2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("ec-chat-history");
      return saved ? JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("ec-chat-history", JSON.stringify(messages.slice(-100)));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() && !image) return;
    setLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      image: image || undefined,
      timestamp: new Date(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setImage(null);
    setImageFile(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.slice(-20).map(m => ({
            role: m.role,
            content: m.image
              ? [{ type: "image_url", image_url: { url: m.image } }, { type: "text", text: m.content || "Bu görseli analiz et" }]
              : m.content,
          })),
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "a",
        role: "assistant",
        content: data.reply || "Bir hata oluştu.",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "e",
        role: "assistant",
        content: "Bağlantı hatası. Tekrar dene.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "audio.webm");
        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (data.text) setInput(data.text);
        } catch {}
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {}
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem("ec-chat-history");
  };

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-0px)]" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #06d6a0)" }}>
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>EÇ Chat</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>GPT-4o · Görsel · Hafızalı</p>
          </div>
        </div>
        <button onClick={clearHistory} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>
          <Trash2 size={12} /> Temizle
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-50">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #06d6a0)" }}>
              <Bot size={32} className="text-white" />
            </div>
            <div>
              <p className="font-bold mb-1" style={{ fontFamily: "Syne, sans-serif" }}>EÇ Agent'a sor</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Yazı yaz, görsel gönder, sesli konuş</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {["Bana bir Python kodu yaz", "Bu görseli analiz et", "SEO stratejisi öner", "Blog konusu bul"].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-xs px-3 py-2 rounded-xl text-left transition-all hover:scale-[1.02]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white ${msg.role === "assistant" ? "" : ""}`}
              style={{ background: msg.role === "assistant" ? "linear-gradient(135deg, #7c3aed, #06d6a0)" : "#374151" }}>
              {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className={`max-w-[75%] space-y-2 ${msg.role === "user" ? "items-end" : ""} flex flex-col`}>
              {msg.image && (
                <img src={msg.image} alt="upload" className="rounded-xl max-w-xs max-h-48 object-cover" />
              )}
              {msg.content && (
                <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: msg.role === "user" ? "#7c3aed" : "var(--surface)",
                    color: msg.role === "user" ? "#fff" : "var(--text)",
                    border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  }}>
                  {msg.content}
                </div>
              )}
              <span className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
                {msg.timestamp.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #06d6a0)" }}>
              <Bot size={14} />
            </div>
            <div className="px-4 py-3 rounded-2xl flex gap-1 items-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#7c3aed", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {image && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="relative inline-block">
            <img src={image} alt="preview" className="h-16 w-16 rounded-xl object-cover" />
            <button onClick={() => { setImage(null); setImageFile(null); }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white"
              style={{ background: "#ef4444" }}>
              <X size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 flex-shrink-0 border-t" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex gap-2 items-end">
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <Paperclip size={16} />
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Mesaj yaz... (Shift+Enter yeni satır)"
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl resize-none text-sm outline-none"
            style={{
              background: "var(--bg)", border: "1px solid var(--border)",
              color: "var(--text)", minHeight: "42px", maxHeight: "120px",
            }}
          />
          <button onClick={recording ? stopRecording : startRecording}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: recording ? "#ef4444" : "var(--bg)", border: "1px solid var(--border)", color: recording ? "#fff" : "var(--text-muted)" }}>
            {recording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button onClick={sendMessage} disabled={loading || (!input.trim() && !image)}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "#7c3aed", color: "#fff", opacity: loading || (!input.trim() && !image) ? 0.5 : 1 }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
