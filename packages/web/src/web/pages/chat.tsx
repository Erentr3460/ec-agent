import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send, Mic, MicOff, Paperclip, X, Bot, User, Trash2, Plus,
  MessageSquare, ChevronLeft, Image as ImageIcon, Copy, Check,
  Sparkles, FileText, ChevronDown, Download, Search, ArrowLeft,
  Code, Globe, PenTool, BarChart3, Hash, LinkIcon, Loader2,
  Share2, FileDown, Edit3, RotateCcw, Zap, Calculator, Cloud,
  Pin, FolderOpen, Keyboard, ChevronUp, AlertCircle, CheckCircle2,
  Terminal
} from "lucide-react";

/* ══════════════════════════════════════
   TYPES
══════════════════════════════════════ */
interface Part { type: "text"|"image_url"|"file"; text?: string; image_url?: {url:string}; fileName?: string }
interface Msg {
  id: string; role: "user"|"assistant"; content: string|Part[];
  ts: number; model?: string; imageUrl?: string; err?: boolean;
  tokens?: {input:number;output:number;total:number};
  tools?: string[]; edited?: boolean;
}
interface Conv {
  id: string; title: string; msgs: Msg[];
  createdAt: number; updatedAt: number; pinned?: boolean;
}
type ModelId = "gpt-4o"|"gpt-4o-mini"|"gpt-4.1"|"o4-mini"|"gemini-2.5-flash"|"gemini-2.5-pro"|"claude-sonnet-4-5"|"claude-haiku-4-5";

/* ══════════════════════════════════════
   MODELS
══════════════════════════════════════ */
const MODELS = [
  { id:"gpt-4o" as ModelId,            label:"GPT-4o",           sub:"OpenAI",    color:"#10a37f", badge:"GPT" },
  { id:"gpt-4o-mini" as ModelId,       label:"GPT-4o mini",      sub:"OpenAI",    color:"#10a37f", badge:"GPT" },
  { id:"gpt-4.1" as ModelId,           label:"GPT-4.1",          sub:"OpenAI",    color:"#10a37f", badge:"NEW" },
  { id:"o4-mini" as ModelId,           label:"o4-mini",          sub:"OpenAI",    color:"#10a37f", badge:"REASON" },
  { id:"gemini-2.5-flash" as ModelId,  label:"Gemini 2.5 Flash", sub:"Google",    color:"#4285f4", badge:"GEM" },
  { id:"gemini-2.5-pro" as ModelId,    label:"Gemini 2.5 Pro",   sub:"Google",    color:"#4285f4", badge:"PRO" },
  { id:"claude-sonnet-4-5" as ModelId, label:"Claude Sonnet",    sub:"Anthropic", color:"#d97706", badge:"CLD" },
  { id:"claude-haiku-4-5" as ModelId,  label:"Claude Haiku",     sub:"Anthropic", color:"#d97706", badge:"CLD" },
];

const STARTERS = [
  { icon: Code,      label:"// kod yaz",       prompt:"Bana bir React component yaz:" },
  { icon: PenTool,   label:"// metin üret",    prompt:"Profesyonel bir e-posta taslağı:" },
  { icon: BarChart3, label:"// analiz et",     prompt:"Şu konuyu analiz et:" },
  { icon: Globe,     label:"// web ara",       prompt:"ara: " },
  { icon: Sparkles,  label:"// fikir üret",    prompt:"Yaratıcı fikirler ver:" },
  { icon: Hash,      label:"// seo içerik",    prompt:"SEO uyumlu başlıklar:" },
  { icon: Calculator,label:"// hesapla",       prompt:"hesapla: " },
  { icon: Cloud,     label:"// hava durumu",   prompt:"hava durumu İstanbul" },
];

const TOOL_LABELS: Record<string,string> = {
  web_search:"Web Arama", weather:"Hava Durumu", calculator:"Hesap Makinesi",
  fetch_url:"URL Okuma", datetime:"Tarih/Saat",
};
const TOOL_ICONS: Record<string, any> = {
  web_search: Globe, weather: Cloud, calculator: Calculator,
  fetch_url: LinkIcon, datetime: Terminal,
};

/* ══════════════════════════════════════
   STORAGE
══════════════════════════════════════ */
const SK="ec_convs_v3", AK="ec_active_v3", MK="ec_model_v3", SYS_K="ec_sysprompt_v1";
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const getText=(m:Msg)=>typeof m.content==="string"?m.content:m.content.map(p=>p.type==="text"?p.text??"":"").join("");
const loadConvs=():Conv[]=>{try{return JSON.parse(localStorage.getItem(SK)||"[]");}catch{return[];}};
const saveConvs=(cs:Conv[])=>localStorage.setItem(SK,JSON.stringify(cs.slice(0,100)));

/* ══════════════════════════════════════
   URL UTILS
══════════════════════════════════════ */
const URL_RX=/https?:\/\/[^\s"'<>()]+/g;
const extractUrls=(t:string)=>[...new Set(t.match(URL_RX)||[])];

/* ══════════════════════════════════════
   MARKDOWN RENDERER
══════════════════════════════════════ */
function md(raw:string){
  let s=raw.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  s=s.replace(/```(\w*)\n?([\s\S]*?)```/g,(_,lang,code)=>
    `<pre class="cc" data-lang="${lang||'txt'}"><button class="cc-copy" onclick="navigator.clipboard.writeText(this.nextSibling.textContent)">copy</button><code>${code.trim()}</code></pre>`);
  s=s.replace(/`([^`\n]+)`/g,`<code class="ci">$1</code>`);
  s=s.replace(/\*\*\*(.+?)\*\*\*/g,"<strong><em>$1</em></strong>");
  s=s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
  s=s.replace(/\*(.+?)\*/g,"<em>$1</em>");
  s=s.replace(/^### (.+)$/gm,"<h3>$1</h3>");
  s=s.replace(/^## (.+)$/gm,"<h2>$1</h2>");
  s=s.replace(/^# (.+)$/gm,"<h1>$1</h1>");
  s=s.replace(/^---+$/gm,"<hr/>");
  s=s.replace(/^\| (.+)$/gm,(line)=>{
    const cells=line.split("|").map(c=>c.trim()).filter(Boolean);
    return `<tr>${cells.map(c=>`<td>${c}</td>`).join("")}</tr>`;
  });
  s=s.replace(/(<tr>[\s\S]*?<\/tr>)+/g,m=>`<table><tbody>${m}</tbody></table>`);
  s=s.replace(/^[-*] (.+)$/gm,"<li>$1</li>");
  s=s.replace(/^\d+\. (.+)$/gm,"<oli>$1</oli>");
  s=s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,`<img src="$2" alt="$1" class="mdi"/>`);
  s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,`<a href="$2" target="_blank" rel="noopener" class="mdl">$1</a>`);
  s=s.replace(/^> (.+)$/gm,"<blockquote>$1</blockquote>");
  s=s.split(/\n\n+/).map(block=>{
    if(/^<(pre|h[1-6]|hr|blockquote|ul|ol|table)/.test(block.trim()))return block;
    return `<p>${block.replace(/\n/g,"<br/>")}</p>`;
  }).join("\n");
  s=s.replace(/(<li>[\s\S]*?<\/li>)+/g,m=>`<ul>${m}</ul>`);
  s=s.replace(/(<oli>[\s\S]*?<\/oli>)+/g,m=>`<ol>${m.replace(/<\/?oli>/g,t=>t==="<oli>"?"<li>":"</li>")}</ol>`);
  return s;
}

/* ══════════════════════════════════════
   COPY BUTTON
══════════════════════════════════════ */
function CopyBtn({text}:{text:string}){
  const [ok,setOk]=useState(false);
  return(
    <button onClick={()=>{navigator.clipboard.writeText(text);setOk(true);setTimeout(()=>setOk(false),1800);}}
      title="Kopyala"
      style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,color:"#2a5a45",display:"flex",alignItems:"center",transition:"color .15s"}}
      onMouseEnter={e=>e.currentTarget.style.color="#00ebb0"}
      onMouseLeave={e=>e.currentTarget.style.color="#2a5a45"}>
      {ok?<CheckCircle2 size={13} style={{color:"#00ebb0"}}/>:<Copy size={13}/>}
    </button>
  );
}

/* ══════════════════════════════════════
   TOOL BADGE
══════════════════════════════════════ */
function ToolBadge({tool}:{tool:string}){
  const Icon=TOOL_ICONS[tool]||Zap;
  return(
    <span style={{
      display:"inline-flex",alignItems:"center",gap:4,
      padding:"2px 8px",borderRadius:20,
      background:"rgba(0,235,176,.08)",border:"1px solid rgba(0,235,176,.2)",
      fontSize:10,color:"#00ebb0",fontFamily:"'JetBrains Mono',monospace",
      letterSpacing:".04em"
    }}>
      <Icon size={9}/>{TOOL_LABELS[tool]||tool}
    </span>
  );
}

/* ══════════════════════════════════════
   MESSAGE
══════════════════════════════════════ */
function Message({msg,onEdit,onRegenerate,isLast}:{msg:Msg;onEdit:(id:string,newText:string)=>void;onRegenerate:(id:string)=>void;isLast:boolean}){
  const isUser=msg.role==="user";
  const text=getText(msg);
  const [editing,setEditing]=useState(false);
  const [editVal,setEditVal]=useState(text);
  const images=typeof msg.content!=="string"?msg.content.filter(p=>p.type==="image_url"):[];
  const files=typeof msg.content!=="string"?msg.content.filter(p=>p.type==="file"):[];

  return(
    <div className="msg-row" style={{
      display:"flex",gap:14,padding:"18px 24px",
      flexDirection:isUser?"row-reverse":"row",
      borderBottom:"1px solid rgba(0,235,176,0.04)",
      animation:"msgIn .2s ease",
    }}>
      {/* Avatar */}
      <div style={{flexShrink:0,marginTop:2}}>
        {isUser
          ?<div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#00ebb0,#00b884)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px rgba(0,235,176,.3)"}}>
            <User size={14} style={{color:"#000"}}/>
          </div>
          :<div style={{width:32,height:32,borderRadius:"50%",background:"#030f08",border:"1px solid #0d2b1f",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px rgba(0,235,176,.12)"}}>
            <Bot size={14} style={{color:"#00ebb0"}}/>
          </div>
        }
      </div>

      {/* Body */}
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",alignItems:isUser?"flex-end":"flex-start"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexDirection:isUser?"row-reverse":"row"}}>
          <span style={{fontSize:11,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",color:isUser?"#00ebb0":"#2a5a45"}}>
            {isUser?"// user":"// ec_agent"}
          </span>
          <span style={{fontSize:10,color:"#0d2b1f",fontFamily:"'JetBrains Mono',monospace"}}>
            {new Date(msg.ts).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}
          </span>
          {msg.model&&!isUser&&(
            <span style={{fontSize:9,color:"#2a5a45",padding:"2px 6px",borderRadius:4,background:"#030f08",border:"1px solid #0d2b1f",fontFamily:"'JetBrains Mono',monospace"}}>
              {msg.model.split("/").pop()}
            </span>
          )}
          {msg.edited&&<span style={{fontSize:9,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>(düzenlendi)</span>}
        </div>

        {/* Tool badges */}
        {msg.tools&&msg.tools.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
            {msg.tools.map(t=><ToolBadge key={t} tool={t}/>)}
          </div>
        )}

        {/* Images */}
        {images.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
            {images.map((p,i)=><img key={i} src={p.image_url?.url} style={{borderRadius:10,maxHeight:220,objectFit:"contain",border:"1px solid #0d2b1f"}}/>)}
          </div>
        )}

        {/* Files */}
        {files.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {files.map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:8,background:"#030f08",border:"1px solid #0d2b1f",fontSize:11,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>
                <FileText size={12} style={{color:"#00ebb0"}}/>{p.fileName}
              </div>
            ))}
          </div>
        )}

        {/* Text */}
        {editing?(
          <div style={{width:"100%",maxWidth:600}}>
            <textarea value={editVal} onChange={e=>setEditVal(e.target.value)}
              rows={3}
              style={{
                width:"100%",background:"#030f08",border:"1px solid #00ebb044",
                borderRadius:10,padding:"10px 14px",color:"#e8fdf5",
                fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none"
              }}/>
            <div style={{display:"flex",gap:6,marginTop:6}}>
              <button onClick={()=>{onEdit(msg.id,editVal);setEditing(false);}}
                style={{padding:"5px 14px",borderRadius:8,border:"none",background:"linear-gradient(90deg,#00ebb0,#00b884)",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
                gönder
              </button>
              <button onClick={()=>setEditing(false)}
                style={{padding:"5px 14px",borderRadius:8,border:"1px solid #0d2b1f",background:"transparent",color:"#2a5a45",fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
                iptal
              </button>
            </div>
          </div>
        ):text&&(
          <div style={{position:"relative",maxWidth:680}}>
            {isUser
              ?<div style={{
                  display:"inline-block",fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap",
                  padding:"10px 16px",borderRadius:"16px 16px 4px 16px",
                  background:"linear-gradient(135deg,#00ebb0,#00b884)",
                  color:"#000",fontWeight:500,maxWidth:520,
                  boxShadow:"0 0 20px rgba(0,235,176,.18)"
                }}>{text}</div>
              :<div className={`chat-md${msg.err?" chat-err":""}`} style={{fontSize:13,lineHeight:1.75,color:"#e8fdf5"}}
                  dangerouslySetInnerHTML={{__html:md(text)}}/>
            }
          </div>
        )}

        {/* Generated image */}
        {msg.imageUrl&&(
          <div style={{marginTop:12,position:"relative",display:"inline-block"}} className="gi-wrap">
            <img src={msg.imageUrl} style={{borderRadius:14,maxWidth:420,border:"1px solid #0d2b1f",boxShadow:"0 0 30px rgba(0,235,176,.1)"}}/>
            <a href={msg.imageUrl} download="image.png" target="_blank" className="gi-dl"
              style={{position:"absolute",top:8,right:8,padding:8,borderRadius:10,background:"rgba(0,0,0,.8)",backdropFilter:"blur(8px)",border:"1px solid #0d2b1f",color:"#00ebb0",opacity:0,transition:"opacity .15s",display:"flex",alignItems:"center"}}>
              <Download size={14}/>
            </a>
          </div>
        )}

        {/* Token info */}
        {msg.tokens&&!isUser&&(
          <div style={{marginTop:4,fontSize:9,color:"#0d2b1f",fontFamily:"'JetBrains Mono',monospace"}}>
            {msg.tokens.input}↑ {msg.tokens.output}↓ tok
          </div>
        )}

        {/* Actions */}
        <div className="msg-actions" style={{display:"flex",gap:2,marginTop:6,opacity:0,transition:"opacity .15s",alignItems:"center"}}>
          <CopyBtn text={text}/>
          {isUser&&(
            <button onClick={()=>{setEditVal(text);setEditing(true);}} title="Düzenle"
              style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,color:"#2a5a45",display:"flex",alignItems:"center",transition:"color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#00ebb0"}
              onMouseLeave={e=>e.currentTarget.style.color="#2a5a45"}>
              <Edit3 size={12}/>
            </button>
          )}
          {!isUser&&isLast&&(
            <button onClick={()=>onRegenerate(msg.id)} title="Yeniden üret"
              style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,color:"#2a5a45",display:"flex",alignItems:"center",transition:"color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#00ebb0"}
              onMouseLeave={e=>e.currentTarget.style.color="#2a5a45"}>
              <RotateCcw size={12}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TYPING
══════════════════════════════════════ */
function Typing({tools}:{tools:string[]}){
  return(
    <div style={{display:"flex",gap:14,padding:"18px 24px",borderBottom:"1px solid rgba(0,235,176,0.04)"}}>
      <div style={{width:32,height:32,borderRadius:"50%",background:"#030f08",border:"1px solid #0d2b1f",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Bot size={14} style={{color:"#00ebb0"}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,justifyContent:"center"}}>
        {tools.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {tools.map(t=><ToolBadge key={t} tool={t}/>)}
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          {[0,150,300].map(d=>(
            <span key={d} style={{width:6,height:6,borderRadius:"50%",background:"#00ebb0",display:"inline-block",animation:"typingBounce .9s ease-in-out infinite",animationDelay:`${d}ms`,opacity:.6}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   CONV ITEM
══════════════════════════════════════ */
function ConvItem({c,active,onClick,onDel,onPin}:{c:Conv;active:boolean;onClick:()=>void;onDel:(e:React.MouseEvent)=>void;onPin:(e:React.MouseEvent)=>void}){
  return(
    <button onClick={onClick}
      style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 10px",borderRadius:10,border:active?"1px solid #0d2b1f":"1px solid transparent",background:active?"rgba(0,235,176,.06)":"transparent",cursor:"pointer",textAlign:"left",transition:"all .15s",position:"relative"}}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(0,235,176,.03)";e.currentTarget.style.borderColor="#0d2b1f";}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}}
      className="conv-item-btn">
      {c.pinned?<Pin size={10} style={{color:"#00ebb0",flexShrink:0}}/>:<MessageSquare size={11} style={{color:active?"#00ebb0":"#2a5a45",flexShrink:0}}/>}
      <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:11,color:active?"#e8fdf5":"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>{c.title}</span>
      <div style={{display:"flex",gap:2}}>
        <button onClick={onPin} title="Sabitle" className="del-btn"
          style={{background:"none",border:"none",cursor:"pointer",padding:2,color:c.pinned?"#00ebb0":"#0d2b1f",borderRadius:4,opacity:0,transition:"all .15s",display:"flex",alignItems:"center"}}
          onMouseEnter={e=>e.currentTarget.style.color="#00ebb0"}
          onMouseLeave={e=>e.currentTarget.style.color=c.pinned?"#00ebb0":"#0d2b1f"}>
          <Pin size={9}/>
        </button>
        <button onClick={onDel} className="del-btn"
          style={{background:"none",border:"none",cursor:"pointer",padding:2,color:"#0d2b1f",borderRadius:4,opacity:0,transition:"all .15s",display:"flex",alignItems:"center"}}
          onMouseEnter={e=>e.currentTarget.style.color="#ff4466"}
          onMouseLeave={e=>e.currentTarget.style.color="#0d2b1f"}>
          <X size={10}/>
        </button>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
function Toast({msg,type,onClose}:{msg:string;type:"success"|"error";onClose:()=>void}){
  useEffect(()=>{const t=setTimeout(onClose,3000);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,padding:"10px 16px",borderRadius:12,background:type==="success"?"rgba(0,235,176,.12)":"rgba(255,68,102,.12)",border:`1px solid ${type==="success"?"rgba(0,235,176,.3)":"rgba(255,68,102,.3)"}`,color:type==="success"?"#00ebb0":"#ff4466",fontSize:12,fontFamily:"'JetBrains Mono',monospace",display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 32px rgba(0,0,0,.5)",animation:"slideIn .2s ease"}}>
      {type==="success"?<CheckCircle2 size={14}/>:<AlertCircle size={14}/>}
      {msg}
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",marginLeft:4,padding:0,display:"flex"}}><X size={12}/></button>
    </div>
  );
}

/* ══════════════════════════════════════
   SEARCH MODAL
══════════════════════════════════════ */
function SearchModal({convs,onSelect,onClose}:{convs:Conv[];onSelect:(cid:string,mid:string)=>void;onClose:()=>void}){
  const [q,setQ]=useState("");
  const results=useMemo(()=>{
    if(!q.trim())return[];
    const ql=q.toLowerCase();
    const out:Array<{conv:Conv;msg:Msg;snippet:string}>=[];
    for(const c of convs){
      for(const m of c.msgs){
        const t=getText(m);
        if(t.toLowerCase().includes(ql)){
          const idx=t.toLowerCase().indexOf(ql);
          const snippet=t.slice(Math.max(0,idx-30),idx+80);
          out.push({conv:c,msg:m,snippet});
          if(out.length>=20)return out;
        }
      }
    }
    return out;
  },[q,convs]);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>e.key==="Escape"&&onClose();
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);

  return(
    <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:"10vh"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:560,background:"#030f08",border:"1px solid #0d2b1f",borderRadius:16,overflow:"hidden",boxShadow:"0 30px 80px rgba(0,0,0,.8)",animation:"fadeUp .15s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:"1px solid #0d2b1f"}}>
          <Search size={14} style={{color:"#00ebb0"}}/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)}
            placeholder="// sohbetlerde ara..."
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#e8fdf5",fontSize:13,fontFamily:"'JetBrains Mono',monospace"}}/>
          <kbd style={{fontSize:10,color:"#2a5a45",padding:"2px 6px",border:"1px solid #0d2b1f",borderRadius:5,fontFamily:"'JetBrains Mono',monospace"}}>ESC</kbd>
        </div>
        <div style={{maxHeight:400,overflowY:"auto"}}>
          {!q.trim()&&<div style={{padding:"32px 0",textAlign:"center",color:"#2a5a45",fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>// yazmaya başla</div>}
          {q.trim()&&results.length===0&&<div style={{padding:"32px 0",textAlign:"center",color:"#2a5a45",fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>// sonuç bulunamadı</div>}
          {results.map((r,i)=>(
            <button key={i} onClick={()=>{onSelect(r.conv.id,r.msg.id);onClose();}}
              style={{display:"flex",flexDirection:"column",gap:4,width:"100%",padding:"12px 16px",border:"none",background:"transparent",cursor:"pointer",textAlign:"left",transition:"background .1s",borderBottom:"1px solid #030f08"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,235,176,.04)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{fontSize:10,color:"#00ebb0",fontFamily:"'JetBrains Mono',monospace"}}>{r.conv.title}</span>
              <span style={{fontSize:12,color:"#e8fdf5",lineHeight:1.5}}>...{r.snippet}...</span>
              <span style={{fontSize:10,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>{r.msg.role==="user"?"// user":"// agent"} · {new Date(r.msg.ts).toLocaleDateString("tr-TR")}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SYSTEM PROMPT MODAL
══════════════════════════════════════ */
function SysPromptModal({value,onChange,onClose}:{value:string;onChange:(v:string)=>void;onClose:()=>void}){
  const [v,setV]=useState(value);
  return(
    <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:540,background:"#030f08",border:"1px solid #0d2b1f",borderRadius:16,overflow:"hidden",boxShadow:"0 30px 80px rgba(0,0,0,.8)",animation:"fadeUp .15s ease"}}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid #0d2b1f",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#e8fdf5",fontFamily:"'JetBrains Mono',monospace"}}>// sistem promptu</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#2a5a45",display:"flex"}}><X size={14}/></button>
        </div>
        <div style={{padding:"16px"}}>
          <p style={{fontSize:11,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>// agent'ın kişiliğini ve davranışını ayarla</p>
          <textarea value={v} onChange={e=>setV(e.target.value)} rows={8}
            style={{width:"100%",background:"#000",border:"1px solid #0d2b1f",borderRadius:10,padding:"12px",color:"#e8fdf5",fontSize:12,fontFamily:"'JetBrains Mono',monospace",resize:"vertical",outline:"none",lineHeight:1.7}}/>
          <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"flex-end"}}>
            <button onClick={()=>{setV("");}}
              style={{padding:"7px 14px",borderRadius:8,border:"1px solid #0d2b1f",background:"transparent",color:"#2a5a45",fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
              sıfırla
            </button>
            <button onClick={()=>{onChange(v);onClose();}}
              style={{padding:"7px 14px",borderRadius:8,border:"none",background:"linear-gradient(90deg,#00ebb0,#00b884)",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
              kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   EXPORT HELPERS
══════════════════════════════════════ */
function exportMarkdown(conv:Conv){
  const lines=[`# ${conv.title}`,`*${new Date(conv.createdAt).toLocaleDateString("tr-TR")}*`,"",...conv.msgs.map(m=>`**${m.role==="user"?"Kullanıcı":"EÇ Agent"}** (${new Date(m.ts).toLocaleTimeString("tr-TR")})\n\n${getText(m)}`)];
  const blob=new Blob([lines.join("\n\n---\n\n")],{type:"text/markdown"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${conv.title.replace(/[^a-z0-9]/gi,"-")}.md`;a.click();
}
function exportJson(conv:Conv){
  const blob=new Blob([JSON.stringify(conv,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${conv.title.replace(/[^a-z0-9]/gi,"-")}.json`;a.click();
}

/* ══════════════════════════════════════
   MAIN
══════════════════════════════════════ */
export default function ChatPage(){
  const [convs,setConvs]             = useState<Conv[]>(loadConvs);
  const [activeId,setActiveId]       = useState<string|null>(()=>localStorage.getItem(AK));
  const [model,setModel]             = useState<ModelId>(()=>(localStorage.getItem(MK) as ModelId)||"gpt-4o");
  const [mode,setMode]               = useState<"chat"|"image">("chat");
  const [input,setInput]             = useState("");
  const [loading,setLoading]         = useState(false);
  const [pendingTools,setPendingTools] = useState<string[]>([]);
  const [sidebarOpen,setSidebarOpen] = useState(true);
  const [showModel,setShowModel]     = useState(false);
  const [sidebarQ,setSidebarQ]       = useState("");
  const [atts,setAtts]               = useState<{type:"image"|"file";data:string;name:string;fileText?:string}[]>([]);
  const [rec,setRec]                 = useState(false);
  const [showSearch,setShowSearch]   = useState(false);
  const [showSysPrompt,setShowSysPrompt] = useState(false);
  const [sysPrompt,setSysPrompt]     = useState(()=>localStorage.getItem(SYS_K)||"");
  const [toast,setToast]             = useState<{msg:string;type:"success"|"error"}|null>(null);
  const [shareLoading,setShareLoading] = useState(false);
  const [showExport,setShowExport]   = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef     = useRef<HTMLTextAreaElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const mrRef     = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const activeConv = convs.find(c=>c.id===activeId)||null;
  const curModel   = MODELS.find(m=>m.id===model)||MODELS[0];

  const pinned = convs.filter(c=>c.pinned);
  const unpinned = convs.filter(c=>!c.pinned);
  const filteredConvs = (q:string,list:Conv[])=>list.filter(c=>c.title.toLowerCase().includes(q.toLowerCase()));
  const todayUnpinned   = filteredConvs(sidebarQ,unpinned).filter(c=>Date.now()-c.updatedAt<86400000);
  const olderUnpinned   = filteredConvs(sidebarQ,unpinned).filter(c=>Date.now()-c.updatedAt>=86400000);
  const filteredPinned  = filteredConvs(sidebarQ,pinned);

  // Token total for active conv
  const totalTokens = activeConv?.msgs.reduce((s,m)=>s+(m.tokens?.total||0),0)||0;

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[activeConv?.msgs,loading]);
  useEffect(()=>{saveConvs(convs);},[convs]);
  useEffect(()=>{if(activeId)localStorage.setItem(AK,activeId);},[activeId]);
  useEffect(()=>{localStorage.setItem(MK,model);},[model]);
  useEffect(()=>{localStorage.setItem(SYS_K,sysPrompt);},[sysPrompt]);
  useEffect(()=>{
    if(!taRef.current)return;
    taRef.current.style.height="auto";
    taRef.current.style.height=Math.min(taRef.current.scrollHeight,200)+"px";
  },[input]);

  // Keyboard shortcuts
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setShowSearch(true);}
      if((e.metaKey||e.ctrlKey)&&e.key==="n"){e.preventDefault();newConv();}
      if((e.metaKey||e.ctrlKey)&&e.key==="b"){e.preventDefault();setSidebarOpen(v=>!v);}
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);

  const showToast=(msg:string,type:"success"|"error"="success")=>setToast({msg,type});

  const newConv=useCallback(()=>{
    const c:Conv={id:uid(),title:"Yeni Sohbet",msgs:[],createdAt:Date.now(),updatedAt:Date.now()};
    setConvs(p=>[c,...p]);setActiveId(c.id);setInput("");setAtts([]);
  },[]);

  const delConv=(id:string,e:React.MouseEvent)=>{
    e.stopPropagation();
    setConvs(p=>p.filter(c=>c.id!==id));
    if(activeId===id)setActiveId(null);
  };
  const pinConv=(id:string,e:React.MouseEvent)=>{
    e.stopPropagation();
    setConvs(p=>p.map(c=>c.id===id?{...c,pinned:!c.pinned}:c));
  };
  const upd=(id:string,changes:Partial<Conv>)=>setConvs(p=>p.map(c=>c.id===id?{...c,...changes}:c));

  const onFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const files=Array.from(e.target.files||[]);
    for(const f of files){
      if(f.type.startsWith("image/")){
        const r=new FileReader();
        r.onload=()=>setAtts(p=>[...p,{type:"image",data:r.result as string,name:f.name}]);
        r.readAsDataURL(f);
      } else {
        const fd=new FormData();fd.append("file",f);
        try{
          const res=await fetch("/api/chat/parse-file",{method:"POST",body:fd});
          const d=await res.json();
          setAtts(p=>[...p,{type:"file",data:"",name:f.name,fileText:d.text||"[okunamadı]"}]);
        }catch{setAtts(p=>[...p,{type:"file",data:"",name:f.name,fileText:"[yüklenemedi]"}]);}
      }
    }
    if(fileRef.current)fileRef.current.value="";
  };

  const send=async(overrideInput?:string)=>{
    const txt=overrideInput??input;
    if(!txt.trim()&&atts.length===0)return;
    if(loading)return;

    let cid=activeId;
    let conv=convs.find(c=>c.id===cid);
    if(!conv){
      const nc:Conv={id:uid(),title:"Yeni Sohbet",msgs:[],createdAt:Date.now(),updatedAt:Date.now()};
      conv=nc;cid=nc.id;
      setActiveId(cid);
      setConvs(p=>[nc,...p]);
    }

    const fileParts=atts.filter(a=>a.type==="file");
    const imgParts=atts.filter(a=>a.type==="image");
    let content:string|Part[];
    const parts:Part[]=[];
    if(fileParts.length>0){
      const ctx=fileParts.map(f=>`[Dosya: ${f.name}]\n${f.fileText}`).join("\n\n");
      parts.push({type:"text",text:txt?`${txt}\n\n${ctx}`:`Bu dosyayı analiz et:\n\n${ctx}`});
    }
    imgParts.forEach(img=>parts.push({type:"image_url",image_url:{url:img.data}}));
    if(parts.length===0)content=txt;
    else if(parts.length===1&&parts[0].type==="text"&&imgParts.length===0)content=parts[0].text!;
    else{if(txt.trim()&&fileParts.length===0)parts.unshift({type:"text",text:txt});content=parts;}

    const userMsg:Msg={id:uid(),role:"user",content,ts:Date.now()};
    setInput("");setAtts([]);setLoading(true);

    const newMsgs=[...conv.msgs,userMsg];
    upd(cid!,{msgs:newMsgs,updatedAt:Date.now()});

    const apiMsgs=newMsgs.slice(-24).map(m=>({role:m.role,content:m.content}));
    try{
      const res=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:apiMsgs,model,mode,sysPrompt:sysPrompt||undefined}),
      });
      const d=await res.json();
      if(d.error)throw new Error(d.error);
      if(d.tools?.length)setPendingTools(d.tools);

      const aMsg:Msg={
        id:uid(),role:"assistant",content:d.reply||"",ts:Date.now(),
        model:d.model,imageUrl:d.imageUrl,
        tokens:d.usage,tools:d.tools||[],
      };
      const finalMsgs=[...newMsgs,aMsg];
      upd(cid!,{msgs:finalMsgs,updatedAt:Date.now()});
      setPendingTools([]);

      // Auto-generate title on first message
      if(conv.msgs.length===0){
        fetch("/api/chat/title",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:txt})})
          .then(r=>r.json()).then(d=>{if(d.title)upd(cid!,{title:d.title});}).catch(()=>{});
      }
    }catch(e:any){
      const eMsg:Msg={id:uid(),role:"assistant",content:`// hata: ${e.message}`,ts:Date.now(),err:true};
      upd(cid!,{msgs:[...newMsgs,eMsg],updatedAt:Date.now()});
      setPendingTools([]);
    }finally{setLoading(false);}
  };

  const editMsg=(id:string,newText:string)=>{
    if(!activeConv)return;
    const idx=activeConv.msgs.findIndex(m=>m.id===id);
    if(idx<0)return;
    const trimmed=activeConv.msgs.slice(0,idx+1).map(m=>m.id===id?{...m,content:newText,edited:true}:m);
    upd(activeConv.id,{msgs:trimmed,updatedAt:Date.now()});
    // resend from that point
    setTimeout(()=>send(newText),100);
  };

  const regenerate=(id:string)=>{
    if(!activeConv)return;
    const idx=activeConv.msgs.findIndex(m=>m.id===id);
    if(idx<0)return;
    const prevUser=activeConv.msgs.slice(0,idx).filter(m=>m.role==="user").pop();
    if(!prevUser)return;
    const trimmed=activeConv.msgs.slice(0,idx);
    upd(activeConv.id,{msgs:trimmed,updatedAt:Date.now()});
    setTimeout(()=>send(getText(prevUser)),100);
  };

  const shareConv=async()=>{
    if(!activeConv)return;
    setShareLoading(true);
    try{
      const res=await fetch("/api/chat/share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({msgs:activeConv.msgs,title:activeConv.title,model})});
      const d=await res.json();
      if(d.url){
        const fullUrl=window.location.origin+d.url;
        await navigator.clipboard.writeText(fullUrl);
        showToast("// link kopyalandı: "+fullUrl);
      }
    }catch(e:any){showToast("Paylaşım hatası: "+e.message,"error");}
    finally{setShareLoading(false);}
  };

  const onKey=(e:React.KeyboardEvent)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};

  const startRec=async()=>{
    try{
      const s=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(s);
      chunksRef.current=[];
      mr.ondataavailable=e=>chunksRef.current.push(e.data);
      mr.onstop=async()=>{
        s.getTracks().forEach(t=>t.stop());
        const blob=new Blob(chunksRef.current,{type:"audio/webm"});
        const fd=new FormData();fd.append("audio",blob,"audio.webm");
        try{const r=await fetch("/api/chat/transcribe",{method:"POST",body:fd});const d=await r.json();if(d.text)setInput(p=>p+(p?" ":"")+d.text);}catch{}
      };
      mr.start();mrRef.current=mr;setRec(true);
    }catch{}
  };
  const stopRec=()=>{mrRef.current?.stop();setRec(false);};

  const canSend=!loading&&(input.trim().length>0||atts.length>0);
  const detectedUrls=extractUrls(input);

  // Mobile detection
  const isMobile=typeof window!=="undefined"&&window.innerWidth<768;

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        :root{color-scheme:dark;}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#0d2b1f;border-radius:99px;}
        ::-webkit-scrollbar-thumb:hover{background:#00ebb033;}
        textarea{scrollbar-width:none;}
        textarea::-webkit-scrollbar{display:none;}

        .chat-md p{margin:0 0 .7em;}
        .chat-md p:last-child{margin-bottom:0;}
        .chat-md h1{font-size:1.2em;font-weight:700;color:#e8fdf5;margin:.9em 0 .4em;}
        .chat-md h2{font-size:1.05em;font-weight:600;color:#c8f5e8;margin:.8em 0 .35em;}
        .chat-md h3{font-size:.95em;font-weight:600;color:#a0e8cc;margin:.7em 0 .3em;}
        .chat-md ul{list-style:none;padding-left:1.2em;margin:.4em 0;}
        .chat-md ul li::before{content:"› ";color:#00ebb0;}
        .chat-md ol{list-style:decimal;padding-left:1.4em;margin:.4em 0;}
        .chat-md li{margin:.25em 0;color:#b8e8d4;}
        .chat-md hr{border:none;border-top:1px solid #0d2b1f;margin:1em 0;}
        .chat-md blockquote{border-left:2px solid #00ebb0;padding-left:.9em;margin:.6em 0;color:#2a5a45;font-style:italic;}
        .chat-md strong{color:#00ebb0;}
        .chat-md a.mdl{color:#00ebb0;text-decoration:underline;}
        .chat-md img.mdi{max-width:100%;border-radius:10px;border:1px solid #0d2b1f;margin:.4em 0;}
        .chat-md table{width:100%;border-collapse:collapse;margin:.6em 0;font-size:.85em;}
        .chat-md td{padding:6px 12px;border:1px solid #0d2b1f;color:#b8e8d4;}
        .chat-md tr:first-child td{color:#00ebb0;font-weight:600;background:#030f08;}
        .chat-err{color:#ff4466 !important;}

        code.ci{background:#030f08;border:1px solid #0d2b1f;border-radius:4px;padding:.12em .4em;font-family:'JetBrains Mono',monospace;font-size:.82em;color:#00ebb0;}
        pre.cc{position:relative;background:#030f08;border:1px solid #0d2b1f;border-radius:12px;padding:1.2em 1.2em .8em;overflow-x:auto;margin:.6em 0;font-family:'JetBrains Mono',monospace;font-size:.78em;line-height:1.65;color:#7de8c4;box-shadow:inset 0 0 20px rgba(0,235,176,.02);}
        pre.cc::before{content:attr(data-lang);position:absolute;top:8px;right:40px;font-size:9px;color:#2a5a45;letter-spacing:.06em;text-transform:uppercase;}
        pre.cc code{background:none;border:none;padding:0;color:inherit;font-size:inherit;}
        .cc-copy{position:absolute;top:6px;right:8px;background:rgba(0,235,176,.08);border:1px solid #0d2b1f;border-radius:6px;padding:2px 8px;font-size:10px;color:#2a5a45;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .15s;}
        .cc-copy:hover{color:#00ebb0;border-color:#00ebb044;}

        @keyframes typingBounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp .2s ease forwards;}

        .msg-row:hover .msg-actions{opacity:1 !important;}
        .conv-item-btn:hover .del-btn{opacity:1 !important;}
        .gi-wrap:hover .gi-dl{opacity:1 !important;}

        @media(max-width:768px){
          .sidebar-desktop{display:none !important;}
          .chat-header-title{display:none !important;}
        }
      `}</style>

      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      {showSearch&&<SearchModal convs={convs} onSelect={(cid,_mid)=>{setActiveId(cid);}} onClose={()=>setShowSearch(false)}/>}
      {showSysPrompt&&<SysPromptModal value={sysPrompt} onChange={setSysPrompt} onClose={()=>setShowSysPrompt(false)}/>}

      <div style={{display:"flex",height:"100vh",background:"#000",fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden"}}>

        {/* ══ SIDEBAR ══ */}
        <div className="sidebar-desktop" style={{
          width:sidebarOpen?260:0,flexShrink:0,overflow:"hidden",
          transition:"width .25s ease",borderRight:"1px solid #0d2b1f",
          background:"#030f08",display:"flex",flexDirection:"column",
        }}>
          <div style={{width:260,display:"flex",flexDirection:"column",height:"100%"}}>

            {/* Logo */}
            <div style={{padding:"14px 14px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #0d2b1f"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#00ebb0,#00b884)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 14px rgba(0,235,176,.3)"}}>
                  <Bot size={15} style={{color:"#000"}}/>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#e8fdf5",letterSpacing:".08em",fontFamily:"'JetBrains Mono',monospace"}}>EC_AGENT</div>
                  <div style={{fontSize:9,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>// ai asistan</div>
                </div>
              </div>
              <button onClick={newConv} title="Yeni sohbet (⌘N)"
                style={{width:28,height:28,borderRadius:7,border:"1px solid #0d2b1f",background:"#000",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#2a5a45",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ebb044";e.currentTarget.style.color="#00ebb0";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d2b1f";e.currentTarget.style.color="#2a5a45";}}>
                <Plus size={13}/>
              </button>
            </div>

            {/* Search bar */}
            <div style={{padding:"10px 10px 8px"}}>
              <button onClick={()=>setShowSearch(true)}
                style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"#000",border:"1px solid #0d2b1f",borderRadius:9,padding:"7px 12px",cursor:"pointer",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#00ebb044"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#0d2b1f"}>
                <Search size={12} style={{color:"#2a5a45"}}/>
                <span style={{color:"#2a5a45",fontSize:11,fontFamily:"'JetBrains Mono',monospace",flex:1,textAlign:"left"}}>// ara...</span>
                <kbd style={{fontSize:9,color:"#0d2b1f",padding:"1px 5px",border:"1px solid #0d2b1f",borderRadius:4,fontFamily:"'JetBrains Mono',monospace"}}>⌘K</kbd>
              </button>
            </div>

            {/* Conv list */}
            <div style={{flex:1,overflowY:"auto",padding:"0 8px"}}>
              {convs.length===0&&(
                <div style={{textAlign:"center",padding:"40px 0",color:"#0d2b1f",fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>
                  <MessageSquare size={18} style={{margin:"0 auto 8px",display:"block",color:"#2a5a45"}}/>
                  // henüz sohbet yok
                </div>
              )}
              {filteredPinned.length>0&&<>
                <div style={{fontSize:9,color:"#2a5a45",letterSpacing:".1em",textTransform:"uppercase",padding:"8px 6px 4px",fontFamily:"'JetBrains Mono',monospace",display:"flex",alignItems:"center",gap:4}}>
                  <Pin size={9}/> sabitlendi
                </div>
                {filteredPinned.map(c=><ConvItem key={c.id} c={c} active={c.id===activeId} onClick={()=>setActiveId(c.id)} onDel={(e)=>delConv(c.id,e)} onPin={(e)=>pinConv(c.id,e)}/>)}
              </>}
              {todayUnpinned.length>0&&<>
                <div style={{fontSize:9,color:"#2a5a45",letterSpacing:".1em",textTransform:"uppercase",padding:"8px 6px 4px",fontFamily:"'JetBrains Mono',monospace"}}>// bugün</div>
                {todayUnpinned.map(c=><ConvItem key={c.id} c={c} active={c.id===activeId} onClick={()=>setActiveId(c.id)} onDel={(e)=>delConv(c.id,e)} onPin={(e)=>pinConv(c.id,e)}/>)}
              </>}
              {olderUnpinned.length>0&&<>
                <div style={{fontSize:9,color:"#2a5a45",letterSpacing:".1em",textTransform:"uppercase",padding:"10px 6px 4px",fontFamily:"'JetBrains Mono',monospace"}}>// önceki</div>
                {olderUnpinned.map(c=><ConvItem key={c.id} c={c} active={c.id===activeId} onClick={()=>setActiveId(c.id)} onDel={(e)=>delConv(c.id,e)} onPin={(e)=>pinConv(c.id,e)}/>)}
              </>}
            </div>

            {/* Sidebar footer */}
            <div style={{padding:"10px",borderTop:"1px solid #0d2b1f",display:"flex",flexDirection:"column",gap:2}}>
              <button onClick={()=>setShowSysPrompt(true)}
                style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:"#2a5a45",fontSize:10,padding:"6px 8px",borderRadius:7,width:"100%",transition:"color .15s",fontFamily:"'JetBrains Mono',monospace"}}
                onMouseEnter={e=>e.currentTarget.style.color="#00ebb0"}
                onMouseLeave={e=>e.currentTarget.style.color="#2a5a45"}>
                <Terminal size={11}/> // sistem promptu
              </button>
              <button onClick={()=>{if(confirm("Tüm sohbetler silinsin mi?")){setConvs([]);setActiveId(null);}}}
                style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:"#2a5a45",fontSize:10,padding:"6px 8px",borderRadius:7,width:"100%",transition:"color .15s",fontFamily:"'JetBrains Mono',monospace"}}
                onMouseEnter={e=>e.currentTarget.style.color="#ff4466"}
                onMouseLeave={e=>e.currentTarget.style.color="#2a5a45"}>
                <Trash2 size={11}/> // tümünü temizle
              </button>
              {totalTokens>0&&<div style={{fontSize:9,color:"#0d2b1f",padding:"4px 8px",fontFamily:"'JetBrains Mono',monospace"}}>// {totalTokens.toLocaleString()} tok toplam</div>}
            </div>
          </div>
        </div>

        {/* ══ MAIN ══ */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>

          {/* ── HEADER ── */}
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderBottom:"1px solid #0d2b1f",background:"rgba(0,0,0,.94)",backdropFilter:"blur(12px)",flexShrink:0,zIndex:10}}>
            <button onClick={()=>setSidebarOpen(v=>!v)} title="⌘B"
              style={{width:32,height:32,borderRadius:8,border:"1px solid #0d2b1f",background:"#030f08",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#2a5a45",transition:"all .15s",flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ebb044";e.currentTarget.style.color="#00ebb0";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d2b1f";e.currentTarget.style.color="#2a5a45";}}>
              <ChevronLeft size={14} style={{transform:sidebarOpen?"":"rotate(180deg)",transition:"transform .25s"}}/>
            </button>

            <span className="chat-header-title" style={{flex:1,fontSize:12,fontWeight:600,color:"#2a5a45",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'JetBrains Mono',monospace"}}>
              {activeConv?`// ${activeConv.title}`:"// yeni sohbet"}
            </span>

            {/* Mode toggle */}
            <div style={{display:"flex",alignItems:"center",background:"#030f08",border:"1px solid #0d2b1f",borderRadius:10,padding:3,gap:2}}>
              {(["chat","image"] as const).map(m=>(
                <button key={m} onClick={()=>setMode(m)}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,transition:"all .15s",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".04em",background:mode===m?"rgba(0,235,176,.1)":"transparent",color:mode===m?"#00ebb0":"#2a5a45"}}>
                  {m==="image"?<ImageIcon size={11}/>:<Sparkles size={11}/>}
                  <span style={{}}>{m==="image"?"görsel":"sohbet"}</span>
                </button>
              ))}
            </div>

            {/* Model picker */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowModel(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:9,border:"1px solid #0d2b1f",background:"#030f08",cursor:"pointer",color:"#e8fdf5",fontSize:11,transition:"all .15s",fontFamily:"'JetBrains Mono',monospace"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#00ebb044"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#0d2b1f"}>
                <span style={{width:7,height:7,borderRadius:"50%",background:curModel.color,flexShrink:0,boxShadow:`0 0 8px ${curModel.color}88`}}/>
                <span style={{maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{curModel.label}</span>
                <ChevronDown size={10} style={{color:"#2a5a45"}}/>
              </button>
              {showModel&&(
                <div className="fade-up" style={{position:"absolute",right:0,top:"calc(100% + 6px)",width:240,background:"#030f08",border:"1px solid #0d2b1f",borderRadius:14,zIndex:100,padding:6,boxShadow:"0 20px 60px rgba(0,0,0,.8)"}}>
                  <div style={{fontSize:9,color:"#2a5a45",letterSpacing:".1em",textTransform:"uppercase",padding:"4px 10px 6px",fontFamily:"'JetBrains Mono',monospace"}}>// model seç</div>
                  {MODELS.map(m=>(
                    <button key={m.id} onClick={()=>{setModel(m.id);setShowModel(false);}}
                      style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 10px",borderRadius:9,border:"none",background:model===m.id?"rgba(0,235,176,.08)":"transparent",cursor:"pointer",transition:"background .12s",textAlign:"left"}}
                      onMouseEnter={e=>{if(model!==m.id)e.currentTarget.style.background="rgba(0,235,176,.04)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background=model===m.id?"rgba(0,235,176,.08)":"transparent";}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:m.color,flexShrink:0,boxShadow:`0 0 6px ${m.color}66`}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:500,color:model===m.id?"#00ebb0":"#e8fdf5",fontFamily:"'JetBrains Mono',monospace"}}>{m.label}</div>
                        <div style={{fontSize:9,color:"#2a5a45"}}>{m.sub}</div>
                      </div>
                      <span style={{fontSize:8,padding:"1px 5px",borderRadius:4,background:"rgba(0,235,176,.08)",color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".04em"}}>{m.badge}</span>
                      {model===m.id&&<Check size={11} style={{color:"#00ebb0"}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {activeConv&&activeConv.msgs.length>0&&(
              <div style={{display:"flex",gap:4}}>
                <button onClick={shareConv} disabled={shareLoading} title="Paylaş"
                  style={{width:30,height:30,borderRadius:8,border:"1px solid #0d2b1f",background:"#030f08",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#2a5a45",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ebb044";e.currentTarget.style.color="#00ebb0";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d2b1f";e.currentTarget.style.color="#2a5a45";}}>
                  {shareLoading?<Loader2 size={12} style={{animation:"spin .8s linear infinite"}}/>:<Share2 size={12}/>}
                </button>
                <div style={{position:"relative"}}>
                  <button onClick={()=>setShowExport(v=>!v)} title="Dışa aktar"
                    style={{width:30,height:30,borderRadius:8,border:"1px solid #0d2b1f",background:"#030f08",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#2a5a45",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ebb044";e.currentTarget.style.color="#00ebb0";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d2b1f";e.currentTarget.style.color="#2a5a45";}}>
                    <FileDown size={12}/>
                  </button>
                  {showExport&&(
                    <div className="fade-up" style={{position:"absolute",right:0,top:"calc(100% + 6px)",width:160,background:"#030f08",border:"1px solid #0d2b1f",borderRadius:12,zIndex:100,padding:4,boxShadow:"0 16px 40px rgba(0,0,0,.7)"}}>
                      {[["Markdown (.md)", ()=>{exportMarkdown(activeConv);setShowExport(false);}], ["JSON", ()=>{exportJson(activeConv);setShowExport(false);}]].map(([label,fn])=>(
                        <button key={label as string} onClick={fn as any}
                          style={{display:"flex",width:"100%",padding:"8px 12px",borderRadius:8,border:"none",background:"transparent",cursor:"pointer",fontSize:11,color:"#e8fdf5",fontFamily:"'JetBrains Mono',monospace",textAlign:"left",transition:"background .1s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(0,235,176,.04)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          {label as string}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <a href="/" style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:9,border:"1px solid #0d2b1f",background:"#030f08",color:"#2a5a45",fontSize:10,textDecoration:"none",transition:"all .15s",fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ebb044";e.currentTarget.style.color="#00ebb0";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d2b1f";e.currentTarget.style.color="#2a5a45";}}>
              <ArrowLeft size={11}/>panel
            </a>
          </div>

          {/* ── MESSAGES ── */}
          <div style={{flex:1,overflowY:"auto"}} onClick={()=>{setShowModel(false);setShowExport(false);}}>
            {(!activeConv||activeConv.msgs.length===0)?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:"40px 24px",textAlign:"center",background:"radial-gradient(ellipse at 50% 30%, rgba(0,235,176,.04) 0%, transparent 65%)"}}>
                <div style={{width:60,height:60,borderRadius:16,background:"linear-gradient(135deg,#00ebb0,#00b884)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 40px rgba(0,235,176,.25)",marginBottom:20}}>
                  {mode==="image"?<ImageIcon size={26} style={{color:"#000"}}/>:<Bot size={26} style={{color:"#000"}}/>}
                </div>
                <h2 style={{fontSize:20,fontWeight:700,color:"#e8fdf5",margin:"0 0 8px",fontFamily:"'JetBrains Mono',monospace"}}>
                  {mode==="image"?"// görsel oluştur":"// ec_agent'a sor"}
                </h2>
                <p style={{fontSize:12,color:"#2a5a45",margin:"0 0 10px",maxWidth:380,lineHeight:1.7,fontFamily:"'JetBrains Mono',monospace"}}>
                  {mode==="image"?"DALL-E 3 ile görsel oluştur.":`${curModel.label} · web arama, hava durumu, hesaplama`}
                </p>
                <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32,fontSize:10,color:"#0d2b1f",fontFamily:"'JetBrains Mono',monospace"}}>
                  <span>⌘K ara</span><span>⌘N yeni</span><span>⌘B sidebar</span><span>⌘↵ gönder</span>
                </div>
                {mode==="chat"&&(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,maxWidth:600,width:"100%"}}>
                    {STARTERS.map((s,i)=>{
                      const Icon=s.icon;
                      return(
                        <button key={i} onClick={()=>{setInput(s.prompt);taRef.current?.focus();}}
                          style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:7,padding:"12px",borderRadius:12,border:"1px solid #0d2b1f",background:"#030f08",cursor:"pointer",transition:"all .15s",textAlign:"left"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ebb044";e.currentTarget.style.background="rgba(0,235,176,.04)";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d2b1f";e.currentTarget.style.background="#030f08";}}>
                          <Icon size={13} style={{color:"#00ebb0"}}/>
                          <span style={{fontSize:10,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ):(
              <div>
                {activeConv.msgs.map((m,i)=>(
                  <Message key={m.id} msg={m} isLast={i===activeConv.msgs.length-1} onEdit={editMsg} onRegenerate={regenerate}/>
                ))}
                {loading&&<Typing tools={pendingTools}/>}
                <div ref={bottomRef} style={{height:20}}/>
              </div>
            )}
          </div>

          {/* ── INPUT ── */}
          <div style={{flexShrink:0,padding:"12px 16px",borderTop:"1px solid #0d2b1f",background:"rgba(0,0,0,.96)",backdropFilter:"blur(12px)"}}>
            <div style={{maxWidth:780,margin:"0 auto"}}>

              {/* Attachments */}
              {atts.length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                  {atts.map((a,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 10px 5px 7px",background:"#030f08",border:"1px solid #0d2b1f",borderRadius:9,animation:"msgIn .15s ease"}}>
                      {a.type==="image"
                        ?<img src={a.data} style={{width:22,height:22,borderRadius:4,objectFit:"cover",border:"1px solid #0d2b1f"}}/>
                        :<FileText size={12} style={{color:"#00ebb0"}}/>
                      }
                      <span style={{fontSize:11,color:"#2a5a45",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'JetBrains Mono',monospace"}}>{a.name}</span>
                      <button onClick={()=>setAtts(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:0,color:"#2a5a45",display:"flex",transition:"color .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.color="#ff4466"}
                        onMouseLeave={e=>e.currentTarget.style.color="#2a5a45"}>
                        <X size={11}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Badges */}
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:atts.length>0||mode==="image"||detectedUrls.length>0?0:0}}>
                {mode==="image"&&(
                  <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"rgba(0,235,176,.06)",border:"1px solid rgba(0,235,176,.2)"}}>
                    <ImageIcon size={10} style={{color:"#00ebb0"}}/>
                    <span style={{fontSize:10,color:"#00ebb0",fontFamily:"'JetBrains Mono',monospace"}}>// görsel modu</span>
                  </div>
                )}
                {detectedUrls.length>0&&!loading&&(
                  <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"rgba(0,235,176,.06)",border:"1px solid rgba(0,235,176,.15)"}}>
                    <LinkIcon size={10} style={{color:"#2a5a45"}}/>
                    <span style={{fontSize:10,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>// {detectedUrls.length} url okunacak</span>
                  </div>
                )}
                {sysPrompt&&(
                  <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"rgba(0,235,176,.04)",border:"1px solid #0d2b1f"}}>
                    <Terminal size={9} style={{color:"#2a5a45"}}/>
                    <span style={{fontSize:10,color:"#2a5a45",fontFamily:"'JetBrains Mono',monospace"}}>// özel prompt aktif</span>
                  </div>
                )}
              </div>

              {(mode==="image"||detectedUrls.length>0||sysPrompt)&&<div style={{height:8}}/>}

              {/* Input box */}
              <div style={{display:"flex",alignItems:"flex-end",gap:8,background:"#030f08",border:"1px solid #0d2b1f",borderRadius:14,padding:"10px 10px 10px 16px",transition:"border-color .15s, box-shadow .15s"}}
                onFocusCapture={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="#00ebb044";(e.currentTarget as HTMLDivElement).style.boxShadow="0 0 24px rgba(0,235,176,.06)";}}
                onBlurCapture={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="#0d2b1f";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}>
                <textarea ref={taRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey}
                  placeholder={mode==="image"?"// görseli detaylıca açıkla...":"// mesaj yaz... (⌘↵ gönder)"}
                  disabled={loading} rows={1}
                  style={{flex:1,background:"transparent",border:"none",outline:"none",resize:"none",color:"#e8fdf5",fontSize:13,lineHeight:1.65,fontFamily:"inherit",minHeight:22,maxHeight:200}}/>
                <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
                  <button onClick={()=>fileRef.current?.click()} title="Dosya ekle"
                    style={{width:30,height:30,borderRadius:8,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#2a5a45",transition:"color .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.color="#00ebb0"}
                    onMouseLeave={e=>e.currentTarget.style.color="#2a5a45"}>
                    <Paperclip size={14}/>
                  </button>
                  <button onClick={rec?stopRec:startRec} title={rec?"Kaydı durdur":"Sesli giriş"}
                    style={{width:30,height:30,borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",background:rec?"rgba(255,68,102,.12)":"transparent",color:rec?"#ff4466":"#2a5a45"}}
                    onMouseEnter={e=>{if(!rec)e.currentTarget.style.color="#00ebb0";}}
                    onMouseLeave={e=>{if(!rec)e.currentTarget.style.color="#2a5a45";}}>
                    {rec?<MicOff size={14}/>:<Mic size={14}/>}
                  </button>
                  <button onClick={()=>send()} disabled={!canSend}
                    style={{width:34,height:34,borderRadius:10,border:canSend?"none":"1px solid #0d2b1f",background:canSend?"linear-gradient(90deg,#00ebb0,#00b884)":"#030f08",cursor:canSend?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",color:canSend?"#000":"#0d2b1f",transition:"all .15s",boxShadow:canSend?"0 0 18px rgba(0,235,176,.3)":"none"}}>
                    {loading?<Loader2 size={14} style={{animation:"spin .8s linear infinite"}}/>:<Send size={14}/>}
                  </button>
                </div>
              </div>

              <div style={{textAlign:"center",fontSize:9,color:"#0d2b1f",marginTop:6,fontFamily:"'JetBrains Mono',monospace"}}>
                // ec_agent · {curModel.label} · web arama · hava · hesap · url okuma · yanıtlar hatalı olabilir
              </div>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" multiple
        accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.html,.css,.docx,.doc,.xlsx"
        style={{display:"none"}} onChange={onFile}/>
    </>
  );
}
