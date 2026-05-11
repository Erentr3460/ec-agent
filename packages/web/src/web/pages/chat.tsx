import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Mic, MicOff, Paperclip, X, Bot, User, Trash2,
  Plus, MessageSquare, ChevronLeft, ChevronRight, Image,
  Copy, Check, Sparkles, FileText, Settings2, ChevronDown,
  Download, Search
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MessagePart {
  type: "text" | "image_url" | "file";
  text?: string;
  image_url?: { url: string };
  fileName?: string;
  fileType?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | MessagePart[];
  timestamp: number;
  model?: string;
  imageUrl?: string;
  error?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

type Model = {
  id: string;
  label: string;
  desc: string;
  color: string;
  vision: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const MODELS: Model[] = [
  { id: "gpt-4o", label: "GPT-4o", desc: "OpenAI · En güçlü", color: "#10a37f", vision: true },
  { id: "gpt-4o-mini", label: "GPT-4o mini", desc: "OpenAI · Hızlı & ucuz", color: "#10a37f", vision: false },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Google · Hızlı vision", color: "#4285f4", vision: true },
  { id: "claude-3.5-sonnet", label: "Claude Sonnet", desc: "Anthropic · Analiz uzmanı", color: "#d97706", vision: false },
  { id: "claude-3.5-haiku", label: "Claude Haiku", desc: "Anthropic · Hızlı", color: "#d97706", vision: false },
];

const STORAGE_KEY = "ec-chat-conversations";
const ACTIVE_KEY = "ec-chat-active";
const MODEL_KEY = "ec-chat-model";

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function getTextContent(msg: Message): string {
  if (typeof msg.content === "string") return msg.content;
  return msg.content.map(p => p.type === "text" ? (p.text || "") : "").join("");
}

function loadConversations(): Conversation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveConversations(convs: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs.slice(0, 50)));
}

// ─── Markdown renderer (no external deps) ────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="md-code"><code class="lang-${lang || 'text'}">${escHtml(code.trim())}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    // Unordered list
    .replace(/^[*-] (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/(<li class="md-li">[\s\S]+?<\/li>)/g, '<ul class="md-ul">$1</ul>')
    // Ordered list
    .replace(/^\d+\. (.+)$/gm, '<li class="md-oli">$1</li>')
    .replace(/(<li class="md-oli">[\s\S]+?<\/li>)/g, '<ol class="md-ol">$1</ol>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="md-hr"/>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>')
    // Image markdown → actual img
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" />')
    // Newlines
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/\n/g, '<br/>');
}

function escHtml(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ─── Components ───────────────────────────────────────────────────────────────
function ModelPill({ model, onSelect }: { model: Model; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2a2a2a] transition-colors text-left w-full"
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: model.color }} />
      <div>
        <div className="text-sm font-medium text-white">{model.label}</div>
        <div className="text-xs text-[#888]">{model.desc}</div>
      </div>
      {model.vision && (
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a2e] text-[#7c3aed] border border-[#7c3aed]/30">
          vision
        </span>
      )}
    </button>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#333] text-[#888] hover:text-white"
      title="Kopyala"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem(MODEL_KEY) || "gpt-4o");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [mode, setMode] = useState<"chat" | "image">("chat");
  const [attachments, setAttachments] = useState<Array<{ type: "image" | "file"; data: string; name: string; fileText?: string }>>([]);
  const [recording, setRecording] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [streamingText, setStreamingText] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const activeConv = conversations.find(c => c.id === activeId) || null;
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeConv?.messages, streamingText]);
  useEffect(() => { saveConversations(conversations); }, [conversations]);
  useEffect(() => { if (activeId) localStorage.setItem(ACTIVE_KEY, activeId); }, [activeId]);
  useEffect(() => { localStorage.setItem(MODEL_KEY, selectedModel); }, [selectedModel]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const newConversation = useCallback(() => {
    const conv: Conversation = {
      id: genId(),
      title: "Yeni Sohbet",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
    };
    setConversations(prev => [conv, ...prev]);
    setActiveId(conv.id);
    setInput("");
    setAttachments([]);
  }, [selectedModel]);

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments(prev => [...prev, { type: "image", data: reader.result as string, name: file.name }]);
        };
        reader.readAsDataURL(file);
      } else {
        // Parse file server-side
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await fetch("/api/chat/parse-file", { method: "POST", body: fd });
          const data = await res.json();
          setAttachments(prev => [...prev, {
            type: "file",
            data: "",
            name: file.name,
            fileText: data.text || "[Dosya okunamadı]",
          }]);
        } catch {
          setAttachments(prev => [...prev, { type: "file", data: "", name: file.name, fileText: "[Dosya yüklenemedi]" }]);
        }
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const sendMessage = async () => {
    if (!input.trim() && attachments.length === 0) return;
    if (loading) return;

    let convId = activeId;
    let conv = conversations.find(c => c.id === convId);

    // Create new conv if none active
    if (!conv) {
      const newConv: Conversation = {
        id: genId(),
        title: input.slice(0, 40) || "Yeni Sohbet",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: selectedModel,
      };
      conv = newConv;
      convId = newConv.id;
      setActiveId(convId);
      setConversations(prev => [newConv, ...prev]);
    }

    // Build content
    let userContent: string | MessagePart[];
    const parts: MessagePart[] = [];

    // Add file texts to message
    const fileParts = attachments.filter(a => a.type === "file");
    if (fileParts.length > 0) {
      const fileContext = fileParts.map(f => `[Dosya: ${f.name}]\n${f.fileText}`).join("\n\n");
      if (input.trim()) {
        parts.push({ type: "text", text: `${input}\n\n${fileContext}` });
      } else {
        parts.push({ type: "text", text: `Bu dosyayı analiz et:\n\n${fileContext}` });
      }
    }

    const imageParts = attachments.filter(a => a.type === "image");
    imageParts.forEach(img => {
      parts.push({ type: "image_url", image_url: { url: img.data } });
    });

    if (parts.length === 0) {
      userContent = input;
    } else if (parts.length === 1 && parts[0].type === "text" && imageParts.length === 0) {
      userContent = parts[0].text!;
    } else {
      if (input.trim() && fileParts.length === 0) {
        parts.unshift({ type: "text", text: input });
      }
      userContent = parts;
    }

    const userMsg: Message = {
      id: genId(),
      role: "user",
      content: userContent,
      timestamp: Date.now(),
    };

    setInput("");
    setAttachments([]);
    setLoading(true);
    setStreamingText("");

    const updatedMessages = [...conv.messages, userMsg];
    updateConv(convId!, { messages: updatedMessages, updatedAt: Date.now() });

    // Build API messages (last 20)
    const apiMessages = updatedMessages.slice(-20).map(m => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, model: selectedModel, mode }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const assistantMsg: Message = {
        id: genId(),
        role: "assistant",
        content: data.reply || "",
        timestamp: Date.now(),
        model: data.model,
        imageUrl: data.imageUrl,
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      // Update title from first message
      const title = typeof userMsg.content === "string"
        ? userMsg.content.slice(0, 45)
        : getTextContent(userMsg).slice(0, 45) || "Sohbet";

      updateConv(convId!, {
        messages: finalMessages,
        updatedAt: Date.now(),
        title: conv!.messages.length === 0 ? title : conv!.title,
      });
    } catch (e: any) {
      const errMsg: Message = {
        id: genId(),
        role: "assistant",
        content: `Hata: ${e.message}`,
        timestamp: Date.now(),
        error: true,
      };
      updateConv(convId!, { messages: [...updatedMessages, errMsg], updatedAt: Date.now() });
    } finally {
      setLoading(false);
      setStreamingText("");
    }
  };

  const updateConv = (id: string, updates: Partial<Conversation>) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "audio.webm");
        try {
          const res = await fetch("/api/chat/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (data.text) setInput(prev => prev + (prev ? " " : "") + data.text);
        } catch { }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const filteredConvs = conversations.filter(c =>
    c.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const groupedConvs = {
    today: filteredConvs.filter(c => Date.now() - c.updatedAt < 86400000),
    week: filteredConvs.filter(c => Date.now() - c.updatedAt >= 86400000 && Date.now() - c.updatedAt < 604800000),
    older: filteredConvs.filter(c => Date.now() - c.updatedAt >= 604800000),
  };

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col border-r border-[#1e1e1e] transition-all duration-300 flex-shrink-0"
        style={{ width: sidebarOpen ? "260px" : "0px", overflow: "hidden" }}
      >
        <div className="flex flex-col h-full w-[260px]">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-3 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center">
                <Bot size={14} />
              </div>
              <span className="font-semibold text-sm">EÇ Agent</span>
            </div>
            <button
              onClick={newConversation}
              className="p-1.5 rounded-lg hover:bg-[#1e1e1e] text-[#888] hover:text-white transition-colors"
              title="Yeni sohbet"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg px-3 py-2">
              <Search size={13} className="text-[#555]" />
              <input
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                placeholder="Sohbetlerde ara..."
                className="bg-transparent text-xs text-[#ccc] placeholder-[#555] outline-none flex-1"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {conversations.length === 0 && (
              <div className="text-center text-[#444] text-xs py-8">
                <MessageSquare size={20} className="mx-auto mb-2 opacity-50" />
                Henüz sohbet yok
              </div>
            )}
            
            {groupedConvs.today.length > 0 && (
              <ConvGroup label="Bugün" convs={groupedConvs.today} activeId={activeId} onSelect={setActiveId} onDelete={deleteConversation} />
            )}
            {groupedConvs.week.length > 0 && (
              <ConvGroup label="Bu Hafta" convs={groupedConvs.week} activeId={activeId} onSelect={setActiveId} onDelete={deleteConversation} />
            )}
            {groupedConvs.older.length > 0 && (
              <ConvGroup label="Daha Eski" convs={groupedConvs.older} activeId={activeId} onSelect={setActiveId} onDelete={deleteConversation} />
            )}
          </div>

          {/* Sidebar footer */}
          <div className="px-3 pb-4 border-t border-[#1e1e1e] pt-3">
            <button
              onClick={() => {
                if (confirm("Tüm sohbetler silinsin mi?")) {
                  setConversations([]);
                  setActiveId(null);
                }
              }}
              className="flex items-center gap-2 text-xs text-[#555] hover:text-[#999] transition-colors px-2 py-1 w-full"
            >
              <Trash2 size={13} />
              Tümünü temizle
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex flex-col flex-1 min-w-0">
        
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e1e] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded-lg hover:bg-[#1e1e1e] text-[#888] hover:text-white transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium truncate text-[#ccc]">
              {activeConv ? activeConv.title : "EÇ Agent Chat"}
            </h1>
          </div>

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => { setShowModelPicker(v => !v); setShowModeMenu(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#111] hover:bg-[#1a1a1a] transition-colors text-xs"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: currentModel.color }} />
              <span className="text-[#ccc] hidden sm:block">{currentModel.label}</span>
              <ChevronDown size={12} className="text-[#555]" />
            </button>

            {showModelPicker && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 p-1">
                <div className="text-[10px] text-[#555] px-2 py-1 uppercase tracking-wider">Model seç</div>
                {MODELS.map(m => (
                  <ModelPill key={m.id} model={m} onSelect={() => { setSelectedModel(m.id); setShowModelPicker(false); }} />
                ))}
              </div>
            )}
          </div>

          {/* Mode selector */}
          <div className="relative">
            <button
              onClick={() => { setShowModeMenu(v => !v); setShowModelPicker(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#111] hover:bg-[#1a1a1a] transition-colors text-xs"
            >
              {mode === "image" ? <Image size={13} className="text-[#f472b6]" /> : <Sparkles size={13} className="text-[#7c3aed]" />}
              <span className="text-[#ccc] hidden sm:block">{mode === "image" ? "Görsel" : "Sohbet"}</span>
              <ChevronDown size={12} className="text-[#555]" />
            </button>

            {showModeMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 p-1">
                <button
                  onClick={() => { setMode("chat"); setShowModeMenu(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-[#1e1e1e] ${mode === "chat" ? "text-[#7c3aed]" : "text-[#ccc]"}`}
                >
                  <Sparkles size={13} /> Sohbet / Analiz
                </button>
                <button
                  onClick={() => { setMode("image"); setShowModeMenu(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-[#1e1e1e] ${mode === "image" ? "text-[#f472b6]" : "text-[#ccc]"}`}
                >
                  <Image size={13} /> Görsel Oluştur
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto" onClick={() => { setShowModelPicker(false); setShowModeMenu(false); }}>
          {!activeConv || activeConv.messages.length === 0 ? (
            <EmptyState model={currentModel} mode={mode} onPrompt={p => { setInput(p); textareaRef.current?.focus(); }} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {activeConv.messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {loading && <TypingIndicator model={currentModel} />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-[#1e1e1e] bg-[#0d0d0d] px-4 py-4">
          <div className="max-w-3xl mx-auto">
            
            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5">
                    {att.type === "image"
                      ? <img src={att.data} className="w-5 h-5 rounded object-cover" />
                      : <FileText size={14} className="text-[#7c3aed]" />
                    }
                    <span className="text-xs text-[#ccc] max-w-[120px] truncate">{att.name}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}>
                      <X size={12} className="text-[#555] hover:text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Mode banner */}
            {mode === "image" && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <Image size={13} className="text-[#f472b6]" />
                <span className="text-xs text-[#f472b6]">Görsel oluşturma modu · DALL-E 3</span>
              </div>
            )}

            {/* Textarea + actions */}
            <div className="flex items-end gap-2 bg-[#111] border border-[#2a2a2a] rounded-2xl px-4 py-3 focus-within:border-[#3a3a3a] transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === "image" ? "Oluşturmak istediğin görseli açıkla..." : "Bir şey sor... (Shift+Enter yeni satır)"}
                className="flex-1 bg-transparent text-[#e5e5e5] placeholder-[#444] outline-none resize-none text-sm leading-relaxed min-h-[24px] max-h-[200px]"
                rows={1}
                disabled={loading}
              />

              <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
                {/* File upload */}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="p-1.5 rounded-lg text-[#555] hover:text-[#ccc] hover:bg-[#1e1e1e] transition-colors"
                  title="Dosya / Görsel yükle"
                >
                  <Paperclip size={16} />
                </button>

                {/* Voice */}
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`p-1.5 rounded-lg transition-colors ${recording ? "text-red-400 bg-red-500/10" : "text-[#555] hover:text-[#ccc] hover:bg-[#1e1e1e]"}`}
                  title={recording ? "Dur" : "Sesli giriş"}
                >
                  {recording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                {/* Send */}
                <button
                  onClick={sendMessage}
                  disabled={loading || (!input.trim() && attachments.length === 0)}
                  className="p-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            <p className="text-center text-[10px] text-[#333] mt-2">
              EÇ Agent · {currentModel.label} · Yanıtlar hatalı olabilir
            </p>
          </div>
        </div>
      </main>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.docx,.doc,.xlsx,.xls"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function ConvGroup({ label, convs, activeId, onSelect, onDelete }: {
  label: string;
  convs: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <div className="mb-2">
      <div className="text-[10px] text-[#444] uppercase tracking-wider px-2 py-1.5">{label}</div>
      {convs.map(c => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`group flex items-center gap-2 w-full px-2 py-2 rounded-lg text-left transition-colors hover:bg-[#1a1a1a] ${activeId === c.id ? "bg-[#1e1e1e]" : ""}`}
        >
          <MessageSquare size={12} className="text-[#555] flex-shrink-0" />
          <span className="text-xs text-[#aaa] truncate flex-1">{c.title}</span>
          <button
            onClick={(e) => onDelete(c.id, e)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 text-[#555] transition-opacity"
          >
            <X size={11} />
          </button>
        </button>
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const text = getTextContent(msg);
  const imageParts = typeof msg.content !== "string"
    ? msg.content.filter(p => p.type === "image_url")
    : [];

  return (
    <div className={`flex gap-3 group ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${isUser ? "bg-[#7c3aed]" : "bg-[#1e1e1e] border border-[#2a2a2a]"}`}>
        {isUser ? <User size={14} /> : <Bot size={14} className="text-[#7c3aed]" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] min-w-0 ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {imageParts.map((p, i) => (
          <img key={i} src={p.image_url?.url} className="rounded-xl max-h-64 object-contain border border-[#2a2a2a]" />
        ))}

        {text && (
          <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-[#7c3aed] text-white rounded-tr-sm"
              : msg.error
                ? "bg-red-900/20 border border-red-800/40 text-red-300 rounded-tl-sm"
                : "bg-[#111] border border-[#1e1e1e] text-[#e5e5e5] rounded-tl-sm"
          }`}>
            {isUser
              ? <p className="whitespace-pre-wrap">{text}</p>
              : <div
                  className="md-content"
                  dangerouslySetInnerHTML={{ __html: `<p class="md-p">${renderMarkdown(text)}</p>` }}
                />
            }
          </div>
        )}

        {/* Generated image */}
        {msg.imageUrl && (
          <div className="relative group/img">
            <img src={msg.imageUrl} className="rounded-xl max-w-sm border border-[#2a2a2a]" />
            <a
              href={msg.imageUrl}
              download="generated.png"
              target="_blank"
              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
            >
              <Download size={13} />
            </a>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-[#333]">
            {new Date(msg.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && <CopyBtn text={text} />}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ model }: { model: Model }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-[#1e1e1e] border border-[#2a2a2a]">
        <Bot size={14} className="text-[#7c3aed]" />
      </div>
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  { icon: "✍️", label: "Metin yaz", prompt: "Bana profesyonel bir e-posta taslağı yaz" },
  { icon: "🔍", label: "Analiz et", prompt: "Bu konuyu detaylı analiz et:" },
  { icon: "💡", label: "Fikir üret", prompt: "Şu konu için yaratıcı fikirler öner:" },
  { icon: "🐛", label: "Kod düzelt", prompt: "Bu kodda hata var mı, düzelt:" },
];

function EmptyState({ model, mode, onPrompt }: { model: Model; mode: "chat" | "image"; onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center select-none">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center mb-4 shadow-lg shadow-[#7c3aed]/20">
        {mode === "image" ? <Image size={22} /> : <Bot size={22} />}
      </div>
      <h2 className="text-lg font-semibold mb-1">
        {mode === "image" ? "Görsel Oluştur" : "EÇ Agent"}
      </h2>
      <p className="text-sm text-[#555] mb-8 max-w-xs">
        {mode === "image"
          ? "DALL-E 3 ile istediğin görseli oluştur. İstediğin kadar detaylı açıkla."
          : `${model.label} ile sohbet et. Dosya yükle, görsel analiz et, kod yaz.`
        }
      </p>

      {mode === "chat" && (
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => onPrompt(qp.prompt)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a] hover:bg-[#161616] transition-colors text-left"
            >
              <span className="text-lg">{qp.icon}</span>
              <span className="text-xs text-[#888]">{qp.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
