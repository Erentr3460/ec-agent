import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Mic, MicOff, Paperclip, X, Bot, User, Trash2,
  Plus, MessageSquare, ChevronLeft, Image as ImageIcon,
  Copy, Check, Sparkles, FileText, ChevronDown,
  Download, Search, ArrowLeft,
  Code, Globe, PenTool, BarChart3, Hash, LinkIcon, Loader2
} from "lucide-react";

/* ─────────── URL utils ─────────── */
const URL_REGEX = /https?:\/\/[^\s"'<>()]+/g;
function extractUrls(text: string): string[] {
  return [...new Set(text.match(URL_REGEX) || [])];
}
async function fetchUrlContent(url: string): Promise<{ title: string; text: string; url: string; error?: string }> {
  try {
    const res = await fetch("/api/chat/fetch-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return await res.json();
  } catch {
    return { title: url, text: "", url, error: "Ağ hatası" };
  }
}

/* ─────────── Types ─────────── */
interface Part {
  type: "text" | "image_url" | "file";
  text?: string;
  image_url?: { url: string };
  fileName?: string;
}
interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string | Part[];
  ts: number;
  model?: string;
  imageUrl?: string;
  err?: boolean;
}
interface Conv {
  id: string;
  title: string;
  msgs: Msg[];
  createdAt: number;
  updatedAt: number;
}
type ModelId = "gpt-4o" | "gpt-4o-mini" | "gemini-2.5-flash" | "claude-3.5-sonnet" | "claude-3.5-haiku";

/* ─────────── Constants ─────────── */
const MODELS = [
  { id: "gpt-4o" as ModelId,           label: "GPT-4o",           sub: "OpenAI",    color: "#00ebb0", dot: "#00ebb0" },
  { id: "gpt-4o-mini" as ModelId,      label: "GPT-4o mini",      sub: "OpenAI",    color: "#00ebb0", dot: "#00ebb0" },
  { id: "gemini-2.5-flash" as ModelId, label: "Gemini 2.5 Flash", sub: "Google",    color: "#00c8eb", dot: "#00c8eb" },
  { id: "claude-3.5-sonnet" as ModelId,label: "Claude Sonnet",    sub: "Anthropic", color: "#00ebb0", dot: "#00ebb0" },
  { id: "claude-3.5-haiku" as ModelId, label: "Claude Haiku",     sub: "Anthropic", color: "#00ebb0", dot: "#00ebb0" },
];

const STARTERS = [
  { icon: Code,      label: "// kod yaz",     prompt: "Bana bir React component yaz:" },
  { icon: PenTool,   label: "// metin üret",  prompt: "Bana profesyonel bir e-posta taslağı yaz:" },
  { icon: BarChart3, label: "// analiz et",   prompt: "Şu konuyu derinlemesine analiz et:" },
  { icon: Globe,     label: "// çeviri yap",  prompt: "Şu metni İngilizce'ye çevir:" },
  { icon: Sparkles,  label: "// fikir üret",  prompt: "Şu konu için yaratıcı fikirler ver:" },
  { icon: Hash,      label: "// seo içerik",  prompt: "Bu konu için SEO uyumlu blog başlıkları yaz:" },
];

const SK = "ec_convs_v2";
const AK = "ec_active_v2";
const MK = "ec_model_v2";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const getText = (m: Msg) =>
  typeof m.content === "string" ? m.content : m.content.map(p => p.type === "text" ? p.text ?? "" : "").join("");

function loadConvs(): Conv[] {
  try { return JSON.parse(localStorage.getItem(SK) || "[]"); } catch { return []; }
}
function saveConvs(cs: Conv[]) {
  localStorage.setItem(SK, JSON.stringify(cs.slice(0, 60)));
}

/* ─────────── Markdown ─────────── */
function md(raw: string) {
  let s = raw
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (_,lang,code)=>
    `<pre class="cc"><code class="cl-${lang||"txt"}">${code.trim()}</code></pre>`);
  s = s.replace(/`([^`\n]+)`/g, `<code class="ci">$1</code>`);
  s = s.replace(/\*\*\*(.+?)\*\*\*/g,"<strong><em>$1</em></strong>");
  s = s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g,"<em>$1</em>");
  s = s.replace(/^### (.+)$/gm,"<h3>$1</h3>");
  s = s.replace(/^## (.+)$/gm,"<h2>$1</h2>");
  s = s.replace(/^# (.+)$/gm,"<h1>$1</h1>");
  s = s.replace(/^---+$/gm,"<hr/>");
  s = s.replace(/^[-*] (.+)$/gm,"<li>$1</li>");
  s = s.replace(/^\d+\. (.+)$/gm,"<oli>$1</oli>");
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,`<img src="$2" alt="$1" class="mdi"/>`);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,`<a href="$2" target="_blank" rel="noopener" class="mdl">$1</a>`);
  s = s.replace(/^> (.+)$/gm,"<blockquote>$1</blockquote>");
  s = s.split(/\n\n+/).map(block => {
    if (/^<(pre|h[1-6]|hr|blockquote|ul|ol)/.test(block.trim())) return block;
    const withBr = block.replace(/\n/g,"<br/>");
    return `<p>${withBr}</p>`;
  }).join("\n");
  s = s.replace(/(<li>.*<\/li>)/gs, m => `<ul>${m}</ul>`);
  s = s.replace(/(<oli>.*<\/oli>)/gs, m => `<ol>${m.replace(/<\/?oli>/g, t => t === "<oli>" ? "<li>" : "</li>")}</ol>`);
  return s;
}

/* ─────────── Copy button ─────────── */
function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1800); }}
      style={{
        background: "none", border: "none", cursor: "pointer",
        padding: "4px 6px", borderRadius: 6, color: "#2a5a45",
        display: "flex", alignItems: "center", transition: "color .15s"
      }}
      onMouseEnter={e => e.currentTarget.style.color = "#00ebb0"}
      onMouseLeave={e => e.currentTarget.style.color = "#2a5a45"}
    >
      {ok ? <Check size={13} style={{color:"#00ebb0"}}/> : <Copy size={13}/>}
    </button>
  );
}

/* ─────────── Message ─────────── */
function Message({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  const text = getText(msg);
  const images = typeof msg.content !== "string" ? msg.content.filter(p => p.type === "image_url") : [];
  const files  = typeof msg.content !== "string" ? msg.content.filter(p => p.type === "file") : [];

  return (
    <div
      className="msg-row"
      style={{
        display: "flex", gap: 14, padding: "20px 24px",
        flexDirection: isUser ? "row-reverse" : "row",
        borderBottom: "1px solid rgba(0,235,176,0.04)",
      }}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        {isUser
          ? <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #00ebb0, #00b884)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(0,235,176,.35)",
            }}>
              <User size={14} style={{color:"#000"}}/>
            </div>
          : <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#030f08", border: "1px solid #0d2b1f",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 12px rgba(0,235,176,.15)",
            }}>
              <Bot size={14} style={{color:"#00ebb0"}}/>
            </div>
        }
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        {/* Name + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexDirection: isUser ? "row-reverse" : "row" }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
            color: isUser ? "#00ebb0" : "#2a5a45",
          }}>
            {isUser ? "// user" : "// ec_agent"}
          </span>
          <span style={{ fontSize: 10, color: "#0d2b1f", fontFamily: "'JetBrains Mono', monospace" }}>
            {new Date(msg.ts).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}
          </span>
          {msg.model && !isUser && (
            <span style={{
              fontSize: 9, color: "#2a5a45", padding: "2px 6px", borderRadius: 4,
              background: "#030f08", border: "1px solid #0d2b1f",
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".04em"
            }}>
              {msg.model.split("/").pop()}
            </span>
          )}
        </div>

        {/* Attached images */}
        {images.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {images.map((p,i) => (
              <img key={i} src={p.image_url?.url}
                style={{ borderRadius: 10, maxHeight: 220, objectFit: "contain", border: "1px solid #0d2b1f" }}/>
            ))}
          </div>
        )}

        {/* File chips */}
        {files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {files.map((p,i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
                borderRadius: 8, background: "#030f08", border: "1px solid #0d2b1f",
                fontSize: 11, color: "#2a5a45", fontFamily: "'JetBrains Mono', monospace"
              }}>
                <FileText size={12} style={{color:"#00ebb0"}}/>{p.fileName}
              </div>
            ))}
          </div>
        )}

        {/* Text bubble */}
        {text && (
          <div style={{ position: "relative", maxWidth: 640 }}>
            {isUser
              ? <div style={{
                  display: "inline-block", fontSize: 13, lineHeight: 1.7,
                  whiteSpace: "pre-wrap", padding: "10px 16px",
                  borderRadius: "16px 16px 4px 16px",
                  background: "linear-gradient(135deg, #00ebb0, #00b884)",
                  color: "#000", fontWeight: 500, maxWidth: 520,
                  boxShadow: "0 0 20px rgba(0,235,176,.2)",
                }}>
                  {text}
                </div>
              : <div
                  className={`chat-md ${msg.err ? "chat-err" : ""}`}
                  style={{ fontSize: 13, lineHeight: 1.75, color: "#e8fdf5" }}
                  dangerouslySetInnerHTML={{__html: md(text)}}
                />
            }
          </div>
        )}

        {/* Generated image */}
        {msg.imageUrl && (
          <div style={{ marginTop: 12, position: "relative", display: "inline-block" }} className="gi-wrap">
            <img src={msg.imageUrl} style={{
              borderRadius: 14, maxWidth: 420,
              border: "1px solid #0d2b1f",
              boxShadow: "0 0 30px rgba(0,235,176,.1)",
            }}/>
            <a href={msg.imageUrl} download="image.png" target="_blank" className="gi-dl"
              style={{
                position: "absolute", top: 8, right: 8, padding: 8, borderRadius: 10,
                background: "rgba(0,0,0,.8)", backdropFilter: "blur(8px)",
                border: "1px solid #0d2b1f", color: "#00ebb0",
                opacity: 0, transition: "opacity .15s", display: "flex", alignItems: "center"
              }}>
              <Download size={14}/>
            </a>
          </div>
        )}

        {/* Action bar */}
        {!isUser && text && (
          <div className="msg-actions" style={{ display: "flex", gap: 2, marginTop: 6, opacity: 0, transition: "opacity .15s" }}>
            <CopyBtn text={text}/>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Typing indicator ─────────── */
function Typing() {
  return (
    <div style={{
      display: "flex", gap: 14, padding: "20px 24px",
      borderBottom: "1px solid rgba(0,235,176,0.04)"
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "#030f08", border: "1px solid #0d2b1f",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <Bot size={14} style={{color:"#00ebb0"}}/>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, height: 32 }}>
        {[0,150,300].map(d => (
          <span key={d} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#00ebb0", display: "inline-block",
            animation: "typingBounce .9s ease-in-out infinite",
            animationDelay: `${d}ms`, opacity: .6
          }}/>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Sidebar conv item ─────────── */
function ConvItem({ c, active, onClick, onDel }: {
  c: Conv; active: boolean;
  onClick: ()=>void; onDel: (e:React.MouseEvent)=>void;
}) {
  return (
    <button onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "8px 10px", borderRadius: 10,
        border: active ? "1px solid #0d2b1f" : "1px solid transparent",
        background: active ? "rgba(0,235,176,.06)" : "transparent",
        cursor: "pointer", textAlign: "left", transition: "all .15s",
      }}
      onMouseEnter={e => { if(!active) { e.currentTarget.style.background = "rgba(0,235,176,.03)"; e.currentTarget.style.borderColor = "#0d2b1f"; } }}
      onMouseLeave={e => { if(!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
      className="conv-item-btn"
    >
      <MessageSquare size={11} style={{color: active ? "#00ebb0" : "#2a5a45", flexShrink: 0}}/>
      <span style={{
        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontSize: 11, color: active ? "#e8fdf5" : "#2a5a45",
        fontFamily: "'JetBrains Mono', monospace"
      }}>{c.title}</span>
      <button onClick={onDel}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 2,
          color: "#0d2b1f", borderRadius: 4, opacity: 0, transition: "all .15s",
          display: "flex", alignItems: "center"
        }}
        className="del-btn"
        onMouseEnter={e => e.currentTarget.style.color = "#ff4466"}
        onMouseLeave={e => e.currentTarget.style.color = "#0d2b1f"}
      >
        <X size={10}/>
      </button>
    </button>
  );
}

/* ─────────── Main ─────────── */
export default function ChatPage() {
  const [convs, setConvs]         = useState<Conv[]>(loadConvs);
  const [activeId, setActiveId]   = useState<string|null>(()=>localStorage.getItem(AK));
  const [model, setModel]         = useState<ModelId>(()=>(localStorage.getItem(MK) as ModelId)||"gpt-4o");
  const [mode, setMode]           = useState<"chat"|"image">("chat");
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModel, setShowModel] = useState(false);
  const [q, setQ]                 = useState("");
  const [atts, setAtts]           = useState<{type:"image"|"file";data:string;name:string;fileText?:string}[]>([]);
  const [rec, setRec]             = useState(false);
  const [fetchingUrls, setFetchingUrls] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef     = useRef<HTMLTextAreaElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const mrRef     = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const activeConv = convs.find(c => c.id === activeId) || null;
  const curModel   = MODELS.find(m => m.id === model) || MODELS[0];
  const filtered   = convs.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
  const today      = filtered.filter(c => Date.now() - c.updatedAt < 86400000);
  const older      = filtered.filter(c => Date.now() - c.updatedAt >= 86400000);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[activeConv?.msgs, loading]);
  useEffect(()=>{ saveConvs(convs); },[convs]);
  useEffect(()=>{ if(activeId) localStorage.setItem(AK, activeId); },[activeId]);
  useEffect(()=>{ localStorage.setItem(MK, model); },[model]);
  useEffect(()=>{
    if(!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 180) + "px";
  },[input]);

  const newConv = useCallback(()=>{
    const c:Conv = {id:uid(),title:"Yeni Sohbet",msgs:[],createdAt:Date.now(),updatedAt:Date.now()};
    setConvs(p=>[c,...p]); setActiveId(c.id); setInput(""); setAtts([]);
  },[]);

  const delConv = (id:string, e:React.MouseEvent) => {
    e.stopPropagation();
    setConvs(p => p.filter(c => c.id !== id));
    if(activeId === id) setActiveId(null);
  };

  const upd = (id:string, changes:Partial<Conv>) => {
    setConvs(p => p.map(c => c.id === id ? {...c,...changes} : c));
  };

  const onFile = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files||[]);
    for(const f of files){
      if(f.type.startsWith("image/")){
        const r = new FileReader();
        r.onload = () => setAtts(p=>[...p,{type:"image",data:r.result as string,name:f.name}]);
        r.readAsDataURL(f);
      } else {
        const fd = new FormData(); fd.append("file", f);
        try {
          const res = await fetch("/api/chat/parse-file",{method:"POST",body:fd});
          const d = await res.json();
          setAtts(p=>[...p,{type:"file",data:"",name:f.name,fileText:d.text||"[okunamadı]"}]);
        } catch {
          setAtts(p=>[...p,{type:"file",data:"",name:f.name,fileText:"[yüklenemedi]"}]);
        }
      }
    }
    if(fileRef.current) fileRef.current.value="";
  };

  const send = async (overrideInput?:string) => {
    const txt = overrideInput ?? input;
    if(!txt.trim() && atts.length===0) return;
    if(loading) return;

    let cid = activeId;
    let conv = convs.find(c=>c.id===cid);
    if(!conv){
      const nc:Conv={id:uid(),title:txt.slice(0,42)||"Sohbet",msgs:[],createdAt:Date.now(),updatedAt:Date.now()};
      conv=nc; cid=nc.id;
      setActiveId(cid);
      setConvs(p=>[nc,...p]);
    }

    // ── URL Detection & Fetch ──
    const urls = extractUrls(txt);
    let urlContext = "";
    if(urls.length > 0) {
      setFetchingUrls(true);
      const results = await Promise.all(urls.slice(0,3).map(fetchUrlContent));
      setFetchingUrls(false);
      const fetched = results.filter(r => r.text && !r.error);
      if(fetched.length > 0) {
        urlContext = "\n\n" + fetched.map(r =>
          `[Web Sayfası: ${r.title}]\nURL: ${r.url}\n\n${r.text}`
        ).join("\n\n---\n\n");
      }
    }

    const fileParts = atts.filter(a=>a.type==="file");
    const imgParts  = atts.filter(a=>a.type==="image");
    let content: string | Part[];
    const parts: Part[] = [];

    // Combine text with URL content + file content
    const fullText = txt + urlContext;
    if(fileParts.length>0){
      const ctx = fileParts.map(f=>`[Dosya: ${f.name}]\n${f.fileText}`).join("\n\n");
      parts.push({type:"text", text: fullText ? `${fullText}\n\n${ctx}` : `Bu dosyayı analiz et:\n\n${ctx}`});
    } else if(urlContext) {
      parts.push({type:"text", text: fullText});
    }
    imgParts.forEach(img=>parts.push({type:"image_url",image_url:{url:img.data}}));
    if(parts.length===0) content=txt;
    else if(parts.length===1 && parts[0].type==="text" && imgParts.length===0) content=parts[0].text!;
    else { if(txt.trim() && fileParts.length===0 && !urlContext) parts.unshift({type:"text",text:txt}); content=parts; }

    const userMsg:Msg = {id:uid(),role:"user",content,ts:Date.now()};
    setInput(""); setAtts([]); setLoading(true);
    const newMsgs = [...conv.msgs, userMsg];
    upd(cid!,{msgs:newMsgs,updatedAt:Date.now(),title:conv.msgs.length===0?(txt.slice(0,42)||"Sohbet"):conv.title});

    const apiMsgs = newMsgs.slice(-20).map(m=>({role:m.role,content:m.content}));
    try {
      const res = await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:apiMsgs,model,mode}),
      });
      const d = await res.json();
      if(d.error) throw new Error(d.error);
      const aMsg:Msg = {id:uid(),role:"assistant",content:d.reply||"",ts:Date.now(),model:d.model,imageUrl:d.imageUrl};
      upd(cid!,{msgs:[...newMsgs,aMsg],updatedAt:Date.now()});
    } catch(e:any){
      const eMsg:Msg = {id:uid(),role:"assistant",content:`// hata: ${e.message}`,ts:Date.now(),err:true};
      upd(cid!,{msgs:[...newMsgs,eMsg],updatedAt:Date.now()});
    } finally { setLoading(false); }
  };

  const onKey = (e:React.KeyboardEvent) => {
    if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(); }
  };

  const startRec = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({audio:true});
      const mr = new MediaRecorder(s);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        s.getTracks().forEach(t=>t.stop());
        const blob = new Blob(chunksRef.current,{type:"audio/webm"});
        const fd = new FormData(); fd.append("audio",blob,"audio.webm");
        try {
          const r = await fetch("/api/chat/transcribe",{method:"POST",body:fd});
          const d = await r.json();
          if(d.text) setInput(p=>p+(p?" ":"")+d.text);
        } catch {}
      };
      mr.start(); mrRef.current=mr; setRec(true);
    } catch {}
  };
  const stopRec = () => { mrRef.current?.stop(); setRec(false); };

  const canSend = !loading && (input.trim().length > 0 || atts.length > 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #0d2b1f; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #00ebb033; }
        textarea { scrollbar-width: none; }
        textarea::-webkit-scrollbar { display: none; }

        .chat-md p  { margin: 0 0 .7em; }
        .chat-md p:last-child { margin-bottom: 0; }
        .chat-md h1 { font-size:1.2em;font-weight:700;color:#e8fdf5;margin:.9em 0 .4em; }
        .chat-md h2 { font-size:1.05em;font-weight:600;color:#c8f5e8;margin:.8em 0 .35em; }
        .chat-md h3 { font-size:.95em;font-weight:600;color:#a0e8cc;margin:.7em 0 .3em; }
        .chat-md ul  { list-style:none;padding-left:1.2em;margin:.4em 0; }
        .chat-md ul li::before { content:"› ";color:#00ebb0; }
        .chat-md ol  { list-style:decimal;padding-left:1.4em;margin:.4em 0; }
        .chat-md li  { margin:.25em 0;color:#b8e8d4; }
        .chat-md hr  { border:none;border-top:1px solid #0d2b1f;margin:1em 0; }
        .chat-md blockquote { border-left:2px solid #00ebb0;padding-left:.9em;margin:.6em 0;color:#2a5a45;font-style:italic; }
        .chat-md strong { color:#00ebb0; }
        .chat-md a.mdl { color:#00ebb0;text-decoration:underline; }
        .chat-md img.mdi { max-width:100%;border-radius:10px;border:1px solid #0d2b1f;margin:.4em 0; }
        .chat-err { color: #ff4466 !important; }
        code.ci {
          background:#030f08;border:1px solid #0d2b1f;border-radius:4px;
          padding:.12em .4em;font-family:'JetBrains Mono',monospace;
          font-size:.82em;color:#00ebb0;
        }
        pre.cc {
          background:#030f08;border:1px solid #0d2b1f;border-radius:12px;
          padding:1em 1.2em;overflow-x:auto;margin:.6em 0;
          font-family:'JetBrains Mono',monospace;font-size:.78em;
          line-height:1.65;color:#7de8c4;
          box-shadow: inset 0 0 20px rgba(0,235,176,.03);
        }
        pre.cc code { background:none;border:none;padding:0;color:inherit;font-size:inherit; }

        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes typingBounce {
          0%,100%{transform:translateY(0);opacity:.4}
          50%{transform:translateY(-5px);opacity:1}
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(8px)}
          to{opacity:1;transform:translateY(0)}
        }
        .fade-up { animation: fadeUp .2s ease forwards; }

        .msg-row:hover .msg-actions { opacity: 1 !important; }
        .conv-item-btn:hover .del-btn { opacity: 1 !important; }
        .gi-wrap:hover .gi-dl { opacity: 1 !important; }
      `}</style>

      <div style={{
        display: "flex", height: "100vh",
        background: "#000",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
      }}>

        {/* ══ Sidebar ══ */}
        <div style={{
          width: sidebarOpen ? 256 : 0,
          flexShrink: 0,
          overflow: "hidden",
          transition: "width .25s ease",
          borderRight: "1px solid #0d2b1f",
          background: "#030f08",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{width:256,display:"flex",flexDirection:"column",height:"100%"}}>

            {/* Logo */}
            <div style={{padding:"16px 14px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{
                  width:30,height:30,borderRadius:8,
                  background:"linear-gradient(135deg,#00ebb0,#00b884)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:"0 0 16px rgba(0,235,176,.35)",
                }}>
                  <Bot size={15} style={{color:"#000"}}/>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#e8fdf5",letterSpacing:".08em",fontFamily:"'JetBrains Mono',monospace"}}>EC_AGENT</div>
                  <div style={{fontSize:10,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>// ai asistan</div>
                </div>
              </div>
              <button onClick={newConv} style={{
                width:28,height:28,borderRadius:7,
                border:"1px solid #0d2b1f",background:"#000",
                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                color:"#2a5a45",transition:"all .15s"
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ebb044";e.currentTarget.style.color="#00ebb0";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d2b1f";e.currentTarget.style.color="#2a5a45";}}
              >
                <Plus size={13}/>
              </button>
            </div>

            {/* Search */}
            <div style={{padding:"0 10px 10px"}}>
              <div style={{
                display:"flex",alignItems:"center",gap:8,
                background:"#000",border:"1px solid #0d2b1f",
                borderRadius:9,padding:"7px 12px"
              }}>
                <Search size={12} style={{color:"#2a5a45"}}/>
                <input value={q} onChange={e=>setQ(e.target.value)}
                  placeholder="// ara..."
                  style={{
                    background:"transparent",border:"none",outline:"none",
                    color:"#e8fdf5",fontSize:11,width:"100%",
                    fontFamily:"'JetBrains Mono',monospace"
                  }}/>
              </div>
            </div>

            {/* Conversations */}
            <div style={{flex:1,overflowY:"auto",padding:"0 8px"}}>
              {convs.length===0 && (
                <div style={{textAlign:"center",padding:"40px 0",color:"#0d2b1f",fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>
                  <MessageSquare size={18} style={{margin:"0 auto 8px",display:"block",opacity:.5,color:"#2a5a45"}}/>
                  // henüz sohbet yok
                </div>
              )}
              {today.length>0 && <>
                <div style={{fontSize:9,color:"#2a5a45",letterSpacing:".1em",textTransform:"uppercase",padding:"8px 6px 4px",fontFamily:"'JetBrains Mono',monospace"}}>// bugün</div>
                {today.map(c=><ConvItem key={c.id} c={c} active={c.id===activeId} onClick={()=>setActiveId(c.id)} onDel={(e)=>delConv(c.id,e)}/>)}
              </>}
              {older.length>0 && <>
                <div style={{fontSize:9,color:"#2a5a45",letterSpacing:".1em",textTransform:"uppercase",padding:"10px 6px 4px",fontFamily:"'JetBrains Mono',monospace"}}>// önceki</div>
                {older.map(c=><ConvItem key={c.id} c={c} active={c.id===activeId} onClick={()=>setActiveId(c.id)} onDel={(e)=>delConv(c.id,e)}/>)}
              </>}
            </div>

            {/* Bottom */}
            <div style={{padding:"10px",borderTop:"1px solid #0d2b1f"}}>
              <button
                onClick={()=>{if(confirm("Tüm sohbetler silinsin mi?")){setConvs([]);setActiveId(null);}}}
                style={{
                  display:"flex",alignItems:"center",gap:6,
                  background:"none",border:"none",cursor:"pointer",
                  color:"#2a5a45",fontSize:10,padding:"6px 8px",
                  borderRadius:7,width:"100%",transition:"color .15s",
                  fontFamily:"'JetBrains Mono',monospace"
                }}
                onMouseEnter={e=>e.currentTarget.style.color="#ff4466"}
                onMouseLeave={e=>e.currentTarget.style.color="#2a5a45"}
              >
                <Trash2 size={11}/> // tümünü temizle
              </button>
            </div>
          </div>
        </div>

        {/* ══ Main ══ */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>

          {/* ── Header ── */}
          <div style={{
            display:"flex",alignItems:"center",gap:10,
            padding:"10px 20px",
            borderBottom:"1px solid #0d2b1f",
            background:"rgba(0,0,0,.92)",
            backdropFilter:"blur(12px)",
            flexShrink:0,
            zIndex:10,
          }}>
            <button onClick={()=>setSidebarOpen(v=>!v)} style={{
              width:32,height:32,borderRadius:8,
              border:"1px solid #0d2b1f",background:"#030f08",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              color:"#2a5a45",transition:"all .15s",flexShrink:0
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ebb044";e.currentTarget.style.color="#00ebb0";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d2b1f";e.currentTarget.style.color="#2a5a45";}}
            >
              <ChevronLeft size={14} style={{transform:sidebarOpen?"":"rotate(180deg)",transition:"transform .25s"}}/>
            </button>

            <span style={{
              flex:1,fontSize:12,fontWeight:600,color:"#2a5a45",
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
              fontFamily:"'JetBrains Mono',monospace"
            }}>
              {activeConv ? `// ${activeConv.title}` : "// yeni sohbet"}
            </span>

            {/* Mode toggle */}
            <div style={{
              display:"flex",alignItems:"center",
              background:"#030f08",border:"1px solid #0d2b1f",
              borderRadius:10,padding:3,gap:2,
            }}>
              {(["chat","image"] as const).map(m=>(
                <button key={m} onClick={()=>setMode(m)} style={{
                  display:"flex",alignItems:"center",gap:5,
                  padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",
                  fontSize:10,fontWeight:600,transition:"all .15s",
                  fontFamily:"'JetBrains Mono',monospace",letterSpacing:".04em",
                  background: mode===m ? "rgba(0,235,176,.1)" : "transparent",
                  color: mode===m ? "#00ebb0" : "#2a5a45",
                  boxShadow: mode===m ? "0 0 10px rgba(0,235,176,.1)" : "none",
                }}>
                  {m==="image" ? <ImageIcon size={11}/> : <Sparkles size={11}/>}
                  {m==="image" ? "görsel" : "sohbet"}
                </button>
              ))}
            </div>

            {/* Model picker */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowModel(v=>!v)} style={{
                display:"flex",alignItems:"center",gap:7,
                padding:"6px 12px",borderRadius:9,
                border:"1px solid #0d2b1f",background:"#030f08",
                cursor:"pointer",color:"#e8fdf5",fontSize:11,transition:"all .15s",
                fontFamily:"'JetBrains Mono',monospace"
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#00ebb044"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#0d2b1f"}
              >
                <span style={{
                  width:7,height:7,borderRadius:"50%",
                  background:curModel.dot,flexShrink:0,
                  boxShadow:`0 0 8px ${curModel.dot}88`
                }}/>
                <span>{curModel.label}</span>
                <ChevronDown size={11} style={{color:"#2a5a45"}}/>
              </button>

              {showModel && (
                <div className="fade-up" style={{
                  position:"absolute",right:0,top:"calc(100% + 6px)",
                  width:220,background:"#030f08",border:"1px solid #0d2b1f",
                  borderRadius:14,zIndex:100,padding:6,
                  boxShadow:"0 20px 60px rgba(0,0,0,.8), 0 0 30px rgba(0,235,176,.05)"
                }}>
                  <div style={{
                    fontSize:9,color:"#2a5a45",letterSpacing:".1em",
                    textTransform:"uppercase",padding:"4px 10px 6px",
                    fontFamily:"'JetBrains Mono',monospace"
                  }}>// model seç</div>
                  {MODELS.map(m=>(
                    <button key={m.id} onClick={()=>{setModel(m.id);setShowModel(false);}} style={{
                      display:"flex",alignItems:"center",gap:10,width:"100%",
                      padding:"8px 10px",borderRadius:9,border:"none",
                      background: model===m.id ? "rgba(0,235,176,.08)" : "transparent",
                      cursor:"pointer",transition:"background .12s",textAlign:"left"
                    }}
                      onMouseEnter={e=>{ if(model!==m.id) e.currentTarget.style.background="rgba(0,235,176,.04)"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=model===m.id?"rgba(0,235,176,.08)":"transparent"; }}
                    >
                      <span style={{
                        width:7,height:7,borderRadius:"50%",
                        background:m.dot,flexShrink:0,
                        boxShadow:`0 0 6px ${m.dot}66`
                      }}/>
                      <div>
                        <div style={{
                          fontSize:12,fontWeight:500,
                          color:model===m.id?"#00ebb0":"#e8fdf5",
                          fontFamily:"'JetBrains Mono',monospace"
                        }}>{m.label}</div>
                        <div style={{fontSize:10,color:"#2a5a45"}}>{m.sub}</div>
                      </div>
                      {model===m.id && <Check size={12} style={{marginLeft:"auto",color:"#00ebb0"}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Back */}
            <a href="/" style={{
              display:"flex",alignItems:"center",gap:5,
              padding:"6px 10px",borderRadius:9,
              border:"1px solid #0d2b1f",background:"#030f08",
              color:"#2a5a45",fontSize:10,textDecoration:"none",transition:"all .15s",
              fontFamily:"'JetBrains Mono',monospace"
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ebb044";e.currentTarget.style.color="#00ebb0";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d2b1f";e.currentTarget.style.color="#2a5a45";}}
            >
              <ArrowLeft size={12}/>{"← panel"}
            </a>
          </div>

          {/* ── Messages ── */}
          <div style={{flex:1,overflowY:"auto"}} onClick={()=>setShowModel(false)}>
            {(!activeConv || activeConv.msgs.length===0) ? (
              /* Welcome */
              <div style={{
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                height:"100%",padding:"40px 24px",textAlign:"center",
                background:"radial-gradient(ellipse at 50% 30%, rgba(0,235,176,.04) 0%, transparent 65%)"
              }}>
                <div style={{
                  width:60,height:60,borderRadius:16,
                  background:"linear-gradient(135deg,#00ebb0,#00b884)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:"0 0 40px rgba(0,235,176,.3)",marginBottom:20
                }}>
                  {mode==="image" ? <ImageIcon size={26} style={{color:"#000"}}/> : <Bot size={26} style={{color:"#000"}}/>}
                </div>
                <h2 style={{
                  fontSize:20,fontWeight:700,color:"#e8fdf5",margin:"0 0 8px",
                  fontFamily:"'JetBrains Mono',monospace"
                }}>
                  {mode==="image" ? "// görsel oluştur" : "// ec_agent'a sor"}
                </h2>
                <p style={{
                  fontSize:13,color:"#2a5a45",margin:"0 0 32px",
                  maxWidth:360,lineHeight:1.7,fontFamily:"'JetBrains Mono',monospace"
                }}>
                  {mode==="image"
                    ? "DALL-E 3 ile istediğin görseli oluştur."
                    : `${curModel.label} ile sohbet et.`}
                </p>
                {mode==="chat" && (
                  <div style={{
                    display:"grid",gridTemplateColumns:"repeat(3,1fr)",
                    gap:8,maxWidth:520,width:"100%"
                  }}>
                    {STARTERS.map((s,i)=>{
                      const Icon = s.icon;
                      return (
                        <button key={i}
                          onClick={()=>{setInput(s.prompt);taRef.current?.focus();}}
                          style={{
                            display:"flex",flexDirection:"column",alignItems:"flex-start",gap:7,
                            padding:"14px",borderRadius:12,
                            border:"1px solid #0d2b1f",background:"#030f08",
                            cursor:"pointer",transition:"all .15s",textAlign:"left"
                          }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ebb044";e.currentTarget.style.background="rgba(0,235,176,.04)";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d2b1f";e.currentTarget.style.background="#030f08";}}
                        >
                          <Icon size={14} style={{color:"#00ebb0"}}/>
                          <span style={{fontSize:10,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {activeConv.msgs.map((m,i)=>(
                  <Message key={m.id} msg={m}/>
                ))}
                {loading && <Typing/>}
                <div ref={bottomRef} style={{height:20}}/>
              </div>
            )}
          </div>

          {/* ── Input ── */}
          <div style={{
            flexShrink:0,padding:"14px 20px",
            borderTop:"1px solid #0d2b1f",
            background:"rgba(0,0,0,.95)",
            backdropFilter:"blur(12px)",
          }}>
            <div style={{maxWidth:760,margin:"0 auto"}}>

              {/* Attachments */}
              {atts.length>0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                  {atts.map((a,i)=>(
                    <div key={i} style={{
                      display:"flex",alignItems:"center",gap:7,
                      padding:"5px 10px 5px 7px",
                      background:"#030f08",border:"1px solid #0d2b1f",borderRadius:9
                    }}>
                      {a.type==="image"
                        ? <img src={a.data} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>
                        : <FileText size={13} style={{color:"#00ebb0"}}/>
                      }
                      <span style={{fontSize:11,color:"#2a5a45",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'JetBrains Mono',monospace"}}>{a.name}</span>
                      <button onClick={()=>setAtts(p=>p.filter((_,j)=>j!==i))}
                        style={{background:"none",border:"none",cursor:"pointer",padding:0,color:"#2a5a45",display:"flex",alignItems:"center"}}>
                        <X size={11}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Image mode badge */}
              {mode==="image" && (
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <ImageIcon size={11} style={{color:"#00ebb0"}}/>
                  <span style={{fontSize:10,color:"#00ebb0",fontFamily:"'JetBrains Mono',monospace"}}>// görsel modu · DALL-E 3</span>
                </div>
              )}

              {/* URL fetch badge */}
              {fetchingUrls && (
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"6px 10px",borderRadius:8,background:"rgba(0,235,176,.06)",border:"1px solid #0d2b1f"}}>
                  <Loader2 size={11} style={{color:"#00ebb0",animation:"spin .8s linear infinite"}}/>
                  <span style={{fontSize:10,color:"#00ebb0",fontFamily:"'JetBrains Mono',monospace"}}>// url içeriği okunuyor...</span>
                </div>
              )}

              {/* Detected URLs preview */}
              {!fetchingUrls && input && extractUrls(input).length > 0 && (
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <LinkIcon size={10} style={{color:"#2a5a45"}}/>
                  <span style={{fontSize:10,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>
                    // {extractUrls(input).length} url algılandı — gönderilince okunacak
                  </span>
                </div>
              )}

              {/* Input box */}
              <div style={{
                display:"flex",alignItems:"flex-end",gap:8,
                background:"#030f08",border:"1px solid #0d2b1f",
                borderRadius:14,padding:"10px 10px 10px 16px",
                transition:"border-color .15s, box-shadow .15s",
              }}
                onFocusCapture={e=>{ (e.currentTarget as HTMLDivElement).style.borderColor="#00ebb044"; (e.currentTarget as HTMLDivElement).style.boxShadow="0 0 20px rgba(0,235,176,.06)"; }}
                onBlurCapture={e=>{ (e.currentTarget as HTMLDivElement).style.borderColor="#0d2b1f"; (e.currentTarget as HTMLDivElement).style.boxShadow="none"; }}
              >
                <textarea ref={taRef} value={input}
                  onChange={e=>setInput(e.target.value)} onKeyDown={onKey}
                  placeholder={mode==="image" ? "// görseli detaylıca açıkla..." : "// mesaj yaz… (shift+enter = yeni satır)"}
                  disabled={loading}
                  rows={1}
                  style={{
                    flex:1,background:"transparent",border:"none",outline:"none",
                    resize:"none",color:"#e8fdf5",fontSize:13,lineHeight:1.65,
                    fontFamily:"inherit",minHeight:22,maxHeight:180,
                  }}
                />

                <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                  <button onClick={()=>fileRef.current?.click()} title="Dosya / Görsel"
                    style={{
                      width:32,height:32,borderRadius:8,border:"none",
                      background:"transparent",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"#2a5a45",transition:"color .15s"
                    }}
                    onMouseEnter={e=>e.currentTarget.style.color="#00ebb0"}
                    onMouseLeave={e=>e.currentTarget.style.color="#2a5a45"}
                  >
                    <Paperclip size={15}/>
                  </button>

                  <button onClick={rec ? stopRec : startRec} title={rec?"Dur":"Sesli giriş"}
                    style={{
                      width:32,height:32,borderRadius:8,border:"none",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",
                      background:rec?"rgba(255,68,102,.12)":"transparent",
                      color:rec?"#ff4466":"#2a5a45",
                    }}
                    onMouseEnter={e=>{ if(!rec) e.currentTarget.style.color="#00ebb0"; }}
                    onMouseLeave={e=>{ if(!rec) e.currentTarget.style.color="#2a5a45"; }}
                  >
                    {rec ? <MicOff size={15}/> : <Mic size={15}/>}
                  </button>

                  <button onClick={()=>send()} disabled={!canSend}
                    style={{
                      width:34,height:34,borderRadius:10,border:"none",
                      background: canSend
                        ? "linear-gradient(90deg,#00ebb0,#00b884)"
                        : "#030f08",
                      cursor: canSend ? "pointer" : "not-allowed",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color: canSend ? "#000" : "#0d2b1f",
                      transition:"all .15s",
                      boxShadow: canSend ? "0 0 16px rgba(0,235,176,.35)" : "none",
                      border: canSend ? "none" : "1px solid #0d2b1f",
                    }}
                  >
                    <Send size={14}/>
                  </button>
                </div>
              </div>

              <div style={{
                textAlign:"center",fontSize:10,color:"#0d2b1f",marginTop:8,
                fontFamily:"'JetBrains Mono',monospace"
              }}>
                // ec_agent · {curModel.label} · yanıtlar hatalı olabilir
              </div>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" multiple
        accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.docx,.doc,.xlsx"
        style={{display:"none"}} onChange={onFile}/>
    </>
  );
}
