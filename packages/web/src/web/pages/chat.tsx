import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Mic, MicOff, Paperclip, X, Bot, User, Trash2,
  Plus, MessageSquare, ChevronLeft, Image as ImageIcon,
  Copy, Check, Sparkles, FileText, ChevronDown,
  Download, Search, MoreHorizontal, ArrowLeft, Zap,
  Code, Globe, PenTool, BarChart3, Hash
} from "lucide-react";

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
  { id: "gpt-4o" as ModelId,          label: "GPT-4o",           sub: "OpenAI",     color: "#10a37f", dot: "#10a37f" },
  { id: "gpt-4o-mini" as ModelId,     label: "GPT-4o mini",      sub: "OpenAI",     color: "#10a37f", dot: "#10a37f" },
  { id: "gemini-2.5-flash" as ModelId,label: "Gemini 2.5 Flash", sub: "Google",     color: "#4285f4", dot: "#4285f4" },
  { id: "claude-3.5-sonnet" as ModelId,label:"Claude Sonnet",    sub: "Anthropic",  color: "#d97706", dot: "#d97706" },
  { id: "claude-3.5-haiku" as ModelId, label:"Claude Haiku",     sub: "Anthropic",  color: "#d97706", dot: "#d97706" },
];

const STARTERS = [
  { icon: Code,      label: "Kod yaz",        prompt: "Bana bir React component yaz:" },
  { icon: PenTool,   label: "Metin üret",      prompt: "Bana profesyonel bir e-posta taslağı yaz:" },
  { icon: BarChart3, label: "Analiz et",       prompt: "Şu konuyu derinlemesine analiz et:" },
  { icon: Globe,     label: "Çeviri yap",      prompt: "Şu metni İngilizce'ye çevir:" },
  { icon: Sparkles,  label: "Fikir üret",      prompt: "Şu konu için yaratıcı fikirler ver:" },
  { icon: Hash,      label: "SEO içerik",      prompt: "Bu konu için SEO uyumlu blog başlıkları yaz:" },
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
  // fenced code
  s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (_,lang,code)=>
    `<pre class="cc"><code class="cl-${lang||"txt"}">${code.trim()}</code></pre>`);
  // inline code
  s = s.replace(/`([^`\n]+)`/g, `<code class="ci">$1</code>`);
  // bold/italic
  s = s.replace(/\*\*\*(.+?)\*\*\*/g,"<strong><em>$1</em></strong>");
  s = s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g,"<em>$1</em>");
  // headings
  s = s.replace(/^### (.+)$/gm,"<h3>$1</h3>");
  s = s.replace(/^## (.+)$/gm,"<h2>$1</h2>");
  s = s.replace(/^# (.+)$/gm,"<h1>$1</h1>");
  // hr
  s = s.replace(/^---+$/gm,"<hr/>");
  // lists
  s = s.replace(/^[-*] (.+)$/gm,"<li>$1</li>");
  s = s.replace(/^\d+\. (.+)$/gm,"<oli>$1</oli>");
  // links + images
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,`<img src="$2" alt="$1" class="mdi"/>`);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,`<a href="$2" target="_blank" rel="noopener" class="mdl">$1</a>`);
  // blockquote
  s = s.replace(/^> (.+)$/gm,"<blockquote>$1</blockquote>");
  // paragraphs
  s = s.split(/\n\n+/).map(block => {
    if (/^<(pre|h[1-6]|hr|blockquote|ul|ol)/.test(block.trim())) return block;
    const withBr = block.replace(/\n/g,"<br/>");
    return `<p>${withBr}</p>`;
  }).join("\n");
  // wrap li
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
      className="p-1.5 rounded-md text-[#555] hover:text-[#999] hover:bg-white/5 transition-all"
    >
      {ok ? <Check size={13} className="text-green-400"/> : <Copy size={13}/>}
    </button>
  );
}

/* ─────────── Message ─────────── */
function Message({ msg, isLast }: { msg: Msg; isLast: boolean }) {
  const isUser = msg.role === "user";
  const text = getText(msg);
  const images = typeof msg.content !== "string" ? msg.content.filter(p => p.type === "image_url") : [];
  const files = typeof msg.content !== "string" ? msg.content.filter(p => p.type === "file") : [];

  return (
    <div className={`group flex gap-4 py-5 px-6 ${isUser ? "flex-row-reverse" : ""}`}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>

      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser
          ? <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <User size={14} className="text-white"/>
            </div>
          : <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:"#1a1a1a",border:"1px solid #2a2a2a"}}>
              <Bot size={14} className="text-violet-400"/>
            </div>
        }
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? "flex flex-col items-end" : ""}`}>
        {/* Name + time */}
        <div className={`flex items-center gap-2 mb-2 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[11px] font-semibold" style={{color: isUser ? "#a78bfa" : "#666"}}>
            {isUser ? "Sen" : "EÇ Agent"}
          </span>
          <span className="text-[10px] text-[#333]">
            {new Date(msg.ts).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}
          </span>
          {msg.model && !isUser && (
            <span className="text-[9px] text-[#333] px-1.5 py-0.5 rounded" style={{background:"#111",border:"1px solid #222"}}>
              {msg.model.split("/").pop()}
            </span>
          )}
        </div>

        {/* Attached images preview */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((p,i) => (
              <img key={i} src={p.image_url?.url} className="rounded-xl max-h-56 object-contain shadow-lg" style={{border:"1px solid #2a2a2a"}}/>
            ))}
          </div>
        )}

        {/* File chips */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((p,i)=>(
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#aaa]" style={{background:"#161616",border:"1px solid #2a2a2a"}}>
                <FileText size={12} className="text-violet-400"/>{p.fileName}
              </div>
            ))}
          </div>
        )}

        {/* Text bubble */}
        {text && (
          <div className={`relative max-w-2xl ${isUser ? "text-right" : ""}`}>
            {isUser
              ? <div className="inline-block text-sm leading-relaxed whitespace-pre-wrap px-4 py-3 rounded-2xl rounded-tr-sm shadow-lg"
                    style={{background:"linear-gradient(135deg,#6d28d9,#7c3aed)",color:"#f0f0f0",maxWidth:"520px",textAlign:"left"}}>
                  {text}
                </div>
              : <div className={`text-sm leading-relaxed chat-md ${msg.err ? "text-red-400" : "text-[#d4d4d4]"}`}
                    dangerouslySetInnerHTML={{__html: md(text)}}/>
            }
          </div>
        )}

        {/* Generated image */}
        {msg.imageUrl && (
          <div className="mt-3 relative group/gi inline-block">
            <img src={msg.imageUrl} className="rounded-2xl max-w-md shadow-2xl" style={{border:"1px solid #2a2a2a"}}/>
            <a href={msg.imageUrl} download="image.png" target="_blank"
              className="absolute top-2 right-2 p-2 rounded-xl opacity-0 group-hover/gi:opacity-100 transition-all"
              style={{background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)"}}>
              <Download size={14}/>
            </a>
          </div>
        )}

        {/* Action bar */}
        {!isUser && text && (
          <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyBtn text={text}/>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Typing ─────────── */
function Typing() {
  return (
    <div className="flex gap-4 py-5 px-6" style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background:"#1a1a1a",border:"1px solid #2a2a2a"}}>
        <Bot size={14} className="text-violet-400"/>
      </div>
      <div className="flex items-center gap-1 h-8">
        {[0,150,300].map(d=>(
          <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{background:"#444",animationDelay:`${d}ms`}}/>
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
      className="group flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left transition-all"
      style={{
        background: active ? "rgba(124,58,237,0.12)" : "transparent",
        border: active ? "1px solid rgba(124,58,237,0.25)" : "1px solid transparent",
      }}>
      <MessageSquare size={12} style={{color: active ? "#a78bfa" : "#3a3a3a", flexShrink:0}}/>
      <span className="flex-1 truncate text-xs" style={{color: active ? "#c4b5fd" : "#666"}}>{c.title}</span>
      <button onClick={onDel}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity hover:text-red-400 text-[#444]">
        <X size={10}/>
      </button>
    </button>
  );
}

/* ─────────── Main ─────────── */
export default function ChatPage() {
  const [convs, setConvs] = useState<Conv[]>(loadConvs);
  const [activeId, setActiveId] = useState<string|null>(()=>localStorage.getItem(AK));
  const [model, setModel] = useState<ModelId>(()=>(localStorage.getItem(MK) as ModelId)||"gpt-4o");
  const [mode, setMode] = useState<"chat"|"image">("chat");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModel, setShowModel] = useState(false);
  const [q, setQ] = useState("");
  const [atts, setAtts] = useState<{type:"image"|"file";data:string;name:string;fileText?:string}[]>([]);
  const [rec, setRec] = useState(false);
  const [convOpts, setConvOpts] = useState<string|null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mrRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const activeConv = convs.find(c=>c.id===activeId)||null;
  const curModel = MODELS.find(m=>m.id===model)||MODELS[0];
  const filtered = convs.filter(c=>c.title.toLowerCase().includes(q.toLowerCase()));
  const today = filtered.filter(c=>Date.now()-c.updatedAt<86400000);
  const older = filtered.filter(c=>Date.now()-c.updatedAt>=86400000);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"})},[activeConv?.msgs, loading]);
  useEffect(()=>{saveConvs(convs)},[convs]);
  useEffect(()=>{if(activeId) localStorage.setItem(AK,activeId);},[activeId]);
  useEffect(()=>{localStorage.setItem(MK,model);},[model]);

  useEffect(()=>{
    if(!taRef.current) return;
    taRef.current.style.height="auto";
    taRef.current.style.height=Math.min(taRef.current.scrollHeight,180)+"px";
  },[input]);

  const newConv = useCallback(()=>{
    const c:Conv={id:uid(),title:"Yeni Sohbet",msgs:[],createdAt:Date.now(),updatedAt:Date.now()};
    setConvs(p=>[c,...p]); setActiveId(c.id); setInput(""); setAtts([]);
  },[]);

  const delConv = (id:string,e:React.MouseEvent)=>{
    e.stopPropagation();
    setConvs(p=>p.filter(c=>c.id!==id));
    if(activeId===id) setActiveId(null);
  };

  const upd = (id:string, changes:Partial<Conv>)=>{
    setConvs(p=>p.map(c=>c.id===id?{...c,...changes}:c));
  };

  const onFile = async (e:React.ChangeEvent<HTMLInputElement>)=>{
    const files = Array.from(e.target.files||[]);
    for(const f of files){
      if(f.type.startsWith("image/")){
        const r=new FileReader();
        r.onload=()=>setAtts(p=>[...p,{type:"image",data:r.result as string,name:f.name}]);
        r.readAsDataURL(f);
      } else {
        const fd=new FormData(); fd.append("file",f);
        try {
          const res=await fetch("/api/chat/parse-file",{method:"POST",body:fd});
          const d=await res.json();
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

    const fileParts = atts.filter(a=>a.type==="file");
    const imgParts  = atts.filter(a=>a.type==="image");

    let content: string | Part[];
    const parts: Part[] = [];

    if(fileParts.length>0){
      const ctx = fileParts.map(f=>`[Dosya: ${f.name}]\n${f.fileText}`).join("\n\n");
      parts.push({type:"text", text: txt ? `${txt}\n\n${ctx}` : `Bu dosyayı analiz et:\n\n${ctx}`});
    }
    imgParts.forEach(img=>parts.push({type:"image_url",image_url:{url:img.data}}));

    if(parts.length===0) content=txt;
    else if(parts.length===1 && parts[0].type==="text" && imgParts.length===0) content=parts[0].text!;
    else { if(txt.trim() && fileParts.length===0) parts.unshift({type:"text",text:txt}); content=parts; }

    const userMsg:Msg={id:uid(),role:"user",content,ts:Date.now()};
    setInput(""); setAtts([]); setLoading(true);

    const newMsgs=[...conv.msgs, userMsg];
    upd(cid!,{msgs:newMsgs,updatedAt:Date.now(),title:conv.msgs.length===0?(txt.slice(0,42)||"Sohbet"):conv.title});

    const apiMsgs = newMsgs.slice(-20).map(m=>({role:m.role,content:m.content}));
    try {
      const res=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:apiMsgs,model,mode}),
      });
      const d=await res.json();
      if(d.error) throw new Error(d.error);
      const aMsg:Msg={id:uid(),role:"assistant",content:d.reply||"",ts:Date.now(),model:d.model,imageUrl:d.imageUrl};
      upd(cid!,{msgs:[...newMsgs,aMsg],updatedAt:Date.now()});
    } catch(e:any){
      const eMsg:Msg={id:uid(),role:"assistant",content:`Hata: ${e.message}`,ts:Date.now(),err:true};
      upd(cid!,{msgs:[...newMsgs,eMsg],updatedAt:Date.now()});
    } finally { setLoading(false); }
  };

  const onKey=(e:React.KeyboardEvent)=>{
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}
  };

  const startRec=async()=>{
    try{
      const s=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(s);
      chunksRef.current=[];
      mr.ondataavailable=e=>chunksRef.current.push(e.data);
      mr.onstop=async()=>{
        s.getTracks().forEach(t=>t.stop());
        const blob=new Blob(chunksRef.current,{type:"audio/webm"});
        const fd=new FormData(); fd.append("audio",blob,"audio.webm");
        try{
          const r=await fetch("/api/chat/transcribe",{method:"POST",body:fd});
          const d=await r.json();
          if(d.text) setInput(p=>p+(p?" ":"")+d.text);
        }catch{}
      };
      mr.start(); mrRef.current=mr; setRec(true);
    }catch{}
  };
  const stopRec=()=>{ mrRef.current?.stop(); setRec(false); };

  return (
    <>
      <style>{`
        :root { color-scheme: dark; }
        body { background: #0a0a0a; margin: 0; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 99px; }
        .chat-md p  { margin: 0 0 .7em; }
        .chat-md p:last-child { margin-bottom: 0; }
        .chat-md h1 { font-size:1.2em;font-weight:700;color:#fff;margin:.9em 0 .4em; }
        .chat-md h2 { font-size:1.05em;font-weight:600;color:#eee;margin:.8em 0 .35em; }
        .chat-md h3 { font-size:.95em;font-weight:600;color:#ddd;margin:.7em 0 .3em; }
        .chat-md ul  { list-style:disc;padding-left:1.4em;margin:.4em 0; }
        .chat-md ol  { list-style:decimal;padding-left:1.4em;margin:.4em 0; }
        .chat-md li  { margin:.2em 0;color:#ccc; }
        .chat-md hr  { border:none;border-top:1px solid #222;margin:1em 0; }
        .chat-md blockquote { border-left:3px solid #7c3aed;padding-left:.9em;margin:.6em 0;color:#888;font-style:italic; }
        .chat-md strong { color:#f0f0f0; }
        .chat-md a.mdl { color:#818cf8;text-decoration:underline; }
        .chat-md img.mdi { max-width:100%;border-radius:10px;border:1px solid #2a2a2a;margin:.4em 0; }
        code.ci { background:#161616;border:1px solid #2a2a2a;border-radius:4px;padding:.12em .4em;font-family:'Fira Code',monospace;font-size:.82em;color:#f472b6; }
        pre.cc { background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;padding:1em 1.2em;overflow-x:auto;margin:.6em 0;font-family:'Fira Code',monospace;font-size:.78em;line-height:1.65;color:#a9b1d6; }
        pre.cc code { background:none;border:none;padding:0;color:inherit;font-size:inherit; }
        textarea { scrollbar-width: none; }
        textarea::-webkit-scrollbar { display: none; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .25s ease forwards; }
      `}</style>

      <div style={{display:"flex",height:"100vh",background:"#0a0a0a",fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden"}}>

        {/* ══ Sidebar ══ */}
        <div style={{
          width: sidebarOpen ? 256 : 0,
          flexShrink: 0,
          overflow: "hidden",
          transition: "width .25s ease",
          borderRight: "1px solid #141414",
          background: "#0d0d0d",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{width:256,display:"flex",flexDirection:"column",height:"100%"}}>

            {/* Logo */}
            <div style={{padding:"16px 16px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{
                  width:30,height:30,borderRadius:8,
                  background:"linear-gradient(135deg,#7c3aed,#4f46e5)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:"0 0 16px rgba(124,58,237,.35)"
                }}>
                  <Bot size={15} color="#fff"/>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#e5e5e5",letterSpacing:".04em"}}>EÇ AGENT</div>
                  <div style={{fontSize:10,color:"#444"}}>AI Asistan</div>
                </div>
              </div>
              <button onClick={newConv} style={{
                width:28,height:28,borderRadius:8,border:"1px solid #1e1e1e",
                background:"#111",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                color:"#666",transition:"all .15s"
              }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="#333",e.currentTarget.style.color="#ccc")}
                onMouseLeave={e=>(e.currentTarget.style.borderColor="#1e1e1e",e.currentTarget.style.color="#666")}
              >
                <Plus size={13}/>
              </button>
            </div>

            {/* Search */}
            <div style={{padding:"0 12px 10px"}}>
              <div style={{
                display:"flex",alignItems:"center",gap:8,
                background:"#111",border:"1px solid #1a1a1a",
                borderRadius:10,padding:"7px 12px"
              }}>
                <Search size={12} color="#333"/>
                <input value={q} onChange={e=>setQ(e.target.value)}
                  placeholder="Ara..."
                  style={{background:"transparent",border:"none",outline:"none",color:"#888",fontSize:12,width:"100%"}}/>
              </div>
            </div>

            {/* Convs */}
            <div style={{flex:1,overflowY:"auto",padding:"0 8px"}}>
              {convs.length===0 && (
                <div style={{textAlign:"center",padding:"40px 0",color:"#333",fontSize:11}}>
                  <MessageSquare size={18} style={{margin:"0 auto 8px",display:"block",opacity:.5}}/>
                  Henüz sohbet yok
                </div>
              )}
              {today.length>0 && <>
                <div style={{fontSize:10,color:"#333",letterSpacing:".06em",textTransform:"uppercase",padding:"8px 6px 4px"}}>Bugün</div>
                {today.map(c=><ConvItem key={c.id} c={c} active={c.id===activeId} onClick={()=>setActiveId(c.id)} onDel={(e)=>delConv(c.id,e)}/>)}
              </>}
              {older.length>0 && <>
                <div style={{fontSize:10,color:"#333",letterSpacing:".06em",textTransform:"uppercase",padding:"10px 6px 4px"}}>Önceki</div>
                {older.map(c=><ConvItem key={c.id} c={c} active={c.id===activeId} onClick={()=>setActiveId(c.id)} onDel={(e)=>delConv(c.id,e)}/>)}
              </>}
            </div>

            {/* Bottom */}
            <div style={{padding:"12px",borderTop:"1px solid #141414"}}>
              <button onClick={()=>{if(confirm("Tüm sohbetler silinsin mi?")){setConvs([]);setActiveId(null);}}}
                style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:"#333",fontSize:11,padding:"6px 8px",borderRadius:8,width:"100%",transition:"color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.color="#666"}
                onMouseLeave={e=>e.currentTarget.style.color="#333"}>
                <Trash2 size={12}/> Tümünü temizle
              </button>
            </div>
          </div>
        </div>

        {/* ══ Main ══ */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>

          {/* ── Header ── */}
          <div style={{
            display:"flex",alignItems:"center",gap:12,
            padding:"12px 20px",
            borderBottom:"1px solid #141414",
            background:"rgba(10,10,10,.92)",
            backdropFilter:"blur(12px)",
            flexShrink:0,
            zIndex:10,
          }}>
            <button onClick={()=>setSidebarOpen(v=>!v)} style={{
              width:32,height:32,borderRadius:8,border:"1px solid #1e1e1e",
              background:"#111",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              color:"#555",transition:"all .15s",flexShrink:0
            }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="#333",e.currentTarget.style.color="#ccc")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#1e1e1e",e.currentTarget.style.color="#555")}
            >
              <ChevronLeft size={14} style={{transform:sidebarOpen?"":"rotate(180deg)",transition:"transform .25s"}}/>
            </button>

            <span style={{flex:1,fontSize:13,fontWeight:500,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {activeConv ? activeConv.title : "Yeni Sohbet"}
            </span>

            {/* Mode toggle */}
            <div style={{
              display:"flex",alignItems:"center",
              background:"#111",border:"1px solid #1e1e1e",
              borderRadius:10,padding:3,gap:2,
            }}>
              {(["chat","image"] as const).map(m=>(
                <button key={m} onClick={()=>setMode(m)} style={{
                  display:"flex",alignItems:"center",gap:5,
                  padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",
                  fontSize:11,fontWeight:500,transition:"all .15s",
                  background: mode===m ? (m==="image"?"#1a0d2e":"#1a1a2e") : "transparent",
                  color: mode===m ? (m==="image"?"#f472b6":"#a78bfa") : "#444",
                }}>
                  {m==="image" ? <ImageIcon size={12}/> : <Sparkles size={12}/>}
                  {m==="image" ? "Görsel" : "Sohbet"}
                </button>
              ))}
            </div>

            {/* Model picker */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowModel(v=>!v)} style={{
                display:"flex",alignItems:"center",gap:7,
                padding:"6px 12px",borderRadius:10,
                border:"1px solid #1e1e1e",background:"#111",
                cursor:"pointer",color:"#aaa",fontSize:11,transition:"all .15s"
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#333"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e1e"}
              >
                <span style={{width:7,height:7,borderRadius:"50%",background:curModel.dot,flexShrink:0,boxShadow:`0 0 6px ${curModel.dot}88`}}/>
                <span>{curModel.label}</span>
                <ChevronDown size={11} style={{color:"#444"}}/>
              </button>

              {showModel && (
                <div className="fade-up" style={{
                  position:"absolute",right:0,top:"calc(100% + 6px)",
                  width:220,background:"#0e0e0e",border:"1px solid #1e1e1e",
                  borderRadius:14,zIndex:100,padding:6,
                  boxShadow:"0 20px 60px rgba(0,0,0,.7)"
                }}>
                  <div style={{fontSize:10,color:"#333",letterSpacing:".06em",textTransform:"uppercase",padding:"4px 10px 6px"}}>Model Seç</div>
                  {MODELS.map(m=>(
                    <button key={m.id} onClick={()=>{setModel(m.id);setShowModel(false);}} style={{
                      display:"flex",alignItems:"center",gap:10,width:"100%",
                      padding:"8px 10px",borderRadius:9,border:"none",
                      background: model===m.id ? "rgba(124,58,237,.1)" : "transparent",
                      cursor:"pointer",transition:"background .12s",textAlign:"left"
                    }}
                      onMouseEnter={e=>{ if(model!==m.id) e.currentTarget.style.background="#151515"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=model===m.id?"rgba(124,58,237,.1)":"transparent"; }}
                    >
                      <span style={{width:8,height:8,borderRadius:"50%",background:m.dot,flexShrink:0,boxShadow:`0 0 5px ${m.dot}66`}}/>
                      <div>
                        <div style={{fontSize:12,fontWeight:500,color: model===m.id ? "#c4b5fd" : "#ccc"}}>{m.label}</div>
                        <div style={{fontSize:10,color:"#444"}}>{m.sub}</div>
                      </div>
                      {model===m.id && <Check size={12} style={{marginLeft:"auto",color:"#7c3aed"}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Back to dashboard */}
            <a href="/" style={{
              display:"flex",alignItems:"center",gap:5,
              padding:"6px 10px",borderRadius:10,
              border:"1px solid #1e1e1e",background:"#111",
              color:"#555",fontSize:11,textDecoration:"none",transition:"all .15s"
            }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="#333",e.currentTarget.style.color="#999")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#1e1e1e",e.currentTarget.style.color="#555")}
            >
              <ArrowLeft size={12}/><span className="hidden sm:inline">Panel</span>
            </a>
          </div>

          {/* ── Messages ── */}
          <div style={{flex:1,overflowY:"auto"}} onClick={()=>{setShowModel(false);}}>
            {(!activeConv || activeConv.msgs.length===0) ? (
              /* Welcome screen */
              <div style={{
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                height:"100%",padding:"40px 24px",textAlign:"center",
                background:"radial-gradient(ellipse at 50% 30%, rgba(124,58,237,.06) 0%, transparent 65%)"
              }}>
                <div style={{
                  width:56,height:56,borderRadius:16,
                  background:"linear-gradient(135deg,#7c3aed,#4f46e5)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:"0 0 40px rgba(124,58,237,.3)",marginBottom:20
                }}>
                  {mode==="image" ? <ImageIcon size={24} color="#fff"/> : <Bot size={24} color="#fff"/>}
                </div>
                <h2 style={{fontSize:20,fontWeight:700,color:"#e5e5e5",margin:"0 0 8px"}}>
                  {mode==="image" ? "Görsel Oluştur" : "EÇ Agent'e Sor"}
                </h2>
                <p style={{fontSize:13,color:"#444",margin:"0 0 32px",maxWidth:360,lineHeight:1.6}}>
                  {mode==="image"
                    ? "DALL-E 3 ile istediğin görseli oluştur. Ne kadar detaylı açıklarsan o kadar iyi sonuç."
                    : `${curModel.label} ile sohbet et. Dosya analiz et, kod yaz, sorular sor.`}
                </p>
                {mode==="chat" && (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,maxWidth:520,width:"100%"}}>
                    {STARTERS.map((s,i)=>{
                      const Icon=s.icon;
                      return (
                        <button key={i} onClick={()=>{setInput(s.prompt);taRef.current?.focus();}} style={{
                          display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,
                          padding:"14px 14px",borderRadius:14,
                          border:"1px solid #1a1a1a",background:"#0d0d0d",
                          cursor:"pointer",transition:"all .15s",textAlign:"left"
                        }}
                          onMouseEnter={e=>(e.currentTarget.style.borderColor="#2a2a2a",e.currentTarget.style.background="#111")}
                          onMouseLeave={e=>(e.currentTarget.style.borderColor="#1a1a1a",e.currentTarget.style.background="#0d0d0d")}
                        >
                          <Icon size={14} color="#7c3aed"/>
                          <span style={{fontSize:11,color:"#777",lineHeight:1.4}}>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {activeConv.msgs.map((m,i)=>(
                  <Message key={m.id} msg={m} isLast={i===activeConv.msgs.length-1}/>
                ))}
                {loading && <Typing/>}
                <div ref={bottomRef} style={{height:20}}/>
              </div>
            )}
          </div>

          {/* ── Input ── */}
          <div style={{
            flexShrink:0,padding:"16px 20px",
            borderTop:"1px solid #141414",
            background:"rgba(10,10,10,.95)",
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
                      background:"#111",border:"1px solid #1e1e1e",borderRadius:10
                    }}>
                      {a.type==="image"
                        ? <img src={a.data} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}}/>
                        : <FileText size={13} color="#7c3aed"/>
                      }
                      <span style={{fontSize:11,color:"#888",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</span>
                      <button onClick={()=>setAtts(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:0,color:"#444",display:"flex",alignItems:"center"}}>
                        <X size={11}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Image mode badge */}
              {mode==="image" && (
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <ImageIcon size={11} color="#f472b6"/>
                  <span style={{fontSize:11,color:"#f472b6"}}>Görsel oluşturma modu · DALL-E 3</span>
                </div>
              )}

              {/* Input box */}
              <div style={{
                display:"flex",alignItems:"flex-end",gap:8,
                background:"#111",border:"1px solid #1e1e1e",
                borderRadius:16,padding:"10px 10px 10px 16px",
                transition:"border-color .15s",
              }}
                onFocus={e=>e.currentTarget.style.borderColor="#2a2a2a"}
                onBlur={e=>e.currentTarget.style.borderColor="#1e1e1e"}
              >
                <textarea ref={taRef} value={input}
                  onChange={e=>setInput(e.target.value)} onKeyDown={onKey}
                  placeholder={mode==="image" ? "Oluşturmak istediğin görseli detaylıca açıkla..." : "Mesaj yaz… (Shift+Enter = yeni satır)"}
                  disabled={loading}
                  rows={1}
                  style={{
                    flex:1,background:"transparent",border:"none",outline:"none",
                    resize:"none",color:"#d4d4d4",fontSize:13,lineHeight:1.65,
                    fontFamily:"inherit",minHeight:22,maxHeight:180,
                    placeholder:"#333",
                  }}
                />

                <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                  <button onClick={()=>fileRef.current?.click()} title="Dosya / Görsel"
                    style={{width:32,height:32,borderRadius:8,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#444",transition:"color .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.color="#888"}
                    onMouseLeave={e=>e.currentTarget.style.color="#444"}
                  >
                    <Paperclip size={15}/>
                  </button>

                  <button onClick={rec?stopRec:startRecording} title={rec?"Dur":"Sesli giriş"}
                    style={{width:32,height:32,borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",
                      background:rec?"rgba(239,68,68,.15)":"transparent",
                      color:rec?"#f87171":"#444",
                    }}
                    onMouseEnter={e=>{ if(!rec) e.currentTarget.style.color="#888"; }}
                    onMouseLeave={e=>{ if(!rec) e.currentTarget.style.color="#444"; }}
                  >
                    {rec ? <MicOff size={15}/> : <Mic size={15}/>}
                  </button>

                  <button onClick={()=>send()} disabled={loading||(!input.trim()&&atts.length===0)}
                    style={{
                      width:34,height:34,borderRadius:10,border:"none",
                      background: (loading||(!input.trim()&&atts.length===0)) ? "#1a1a1a" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                      cursor: (loading||(!input.trim()&&atts.length===0)) ? "not-allowed" : "pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color: (loading||(!input.trim()&&atts.length===0)) ? "#333" : "#fff",
                      transition:"all .15s",
                      boxShadow: (loading||(!input.trim()&&atts.length===0)) ? "none" : "0 4px 12px rgba(124,58,237,.4)",
                    }}
                  >
                    <Send size={14}/>
                  </button>
                </div>
              </div>

              <div style={{textAlign:"center",fontSize:10,color:"#222",marginTop:8}}>
                EÇ Agent · {curModel.label} · Yanıtlar hatalı olabilir
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

  function startRecording() { startRec(); }
}
