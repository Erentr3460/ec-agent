import { Hono } from "hono";
import { generateText } from "ai";
import { gateway } from "../agent/gateway";

export const chatRouter = new Hono();

const MODELS: Record<string, string> = {
  "gpt-4o":            "openai/gpt-4o",
  "gpt-4o-mini":       "openai/gpt-4o-mini",
  "gpt-4.1":           "openai/gpt-4.1",
  "o4-mini":           "openai/o4-mini",
  "gemini-2.5-flash":  "google/gemini-2.5-flash-preview-05-20",
  "gemini-2.5-pro":    "google/gemini-2.5-pro-preview-06-05",
  "claude-sonnet-4-5": "anthropic/claude-sonnet-4-5",
  "claude-haiku-4-5":  "anthropic/claude-haiku-4-5",
};

const SYSTEM_PROMPT = `Sen EÇ Agent'sın — Eren Çetin'in kişisel AI asistanı. Akıllı, yardımcı, kısa ama kapsamlı cevaplar verirsin.
Kullanıcı hangi dilde yazarsa o dilde cevap verirsin.
Markdown kullanabilirsin: **bold**, *italic*, \`kod\`, kod blokları, listeler, tablolar.
Görselleri analiz edebilir, kod yazabilir, dosya içeriklerini analiz edebilirsin.
Tarih: ${new Date().toLocaleDateString("tr-TR")}`;

/* ══════════════════════════════════════════
   TOOLS
══════════════════════════════════════════ */

async function toolWebSearch(query: string): Promise<string> {
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&search_lang=tr`;
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY || "",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: any = await res.json();
    const results = data.web?.results || [];
    if (!results.length) return "Arama sonucu bulunamadı.";
    return results.slice(0, 5).map((r: any, i: number) =>
      `${i + 1}. **${r.title}**\n${r.description || ""}\n${r.url}`
    ).join("\n\n");
  } catch (e: any) {
    // Fallback: DuckDuckGo instant answer
    try {
      const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const d: any = await res.json();
      const text = d.AbstractText || d.Answer || "";
      if (text) return text;
    } catch {}
    return `Web arama şu an kullanılamıyor: ${e.message}`;
  }
}

async function toolWeather(location: string): Promise<string> {
  try {
    // Geocode
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=tr`,
      { signal: AbortSignal.timeout(5000) }
    );
    const geoData: any = await geoRes.json();
    const geo = geoData.results?.[0];
    if (!geo) return `"${location}" konumu bulunamadı.`;

    const wRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode,apparent_temperature&timezone=auto`,
      { signal: AbortSignal.timeout(5000) }
    );
    const wData: any = await wRes.json();
    const c = wData.current;

    const WMO: Record<number, string> = {
      0:"Açık",1:"Az bulutlu",2:"Parçalı bulutlu",3:"Kapalı",
      45:"Sisli",48:"Sisli",51:"Çisenti",53:"Çisenti",55:"Çisenti",
      61:"Yağmurlu",63:"Yağmurlu",65:"Şiddetli yağmur",
      71:"Karlı",73:"Karlı",75:"Yoğun kar",80:"Sağanak",81:"Sağanak",82:"Şiddetli sağanak",
      95:"Fırtına",96:"Dolu",99:"Şiddetli dolu",
    };
    const desc = WMO[c.weathercode] || "Bilinmiyor";

    return `📍 **${geo.name}, ${geo.country}**
🌡️ ${c.temperature_2m}°C (hissedilen ${c.apparent_temperature}°C)
☁️ ${desc}
💧 Nem: %${c.relative_humidity_2m}
💨 Rüzgar: ${c.wind_speed_10m} km/s`;
  } catch (e: any) {
    return `Hava durumu alınamadı: ${e.message}`;
  }
}

function toolCalculator(expr: string): string {
  try {
    // Safe eval — only math
    const sanitized = expr.replace(/[^0-9+\-*/.()%\s^]/g, "");
    if (!sanitized.trim()) return "Geçersiz ifade";
    const result = Function('"use strict"; return (' + sanitized + ')')();
    if (typeof result !== "number" || !isFinite(result)) return "Hesaplanamadı";
    return `${expr} = **${result}**`;
  } catch (e: any) {
    return `Hesaplama hatası: ${e.message}`;
  }
}

async function toolFetchUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ECAgent/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || new URL(url).hostname;
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6]|br|tr|article|section)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&[a-z]+;/gi," ")
      .replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim()
      .slice(0, 10000);
    return `[${title}]\nURL: ${url}\n\n${text}`;
  } catch (e: any) {
    return `URL okunamadı: ${e.message}`;
  }
}

function toolDateTime(): string {
  const now = new Date();
  return `Şu an: **${now.toLocaleDateString("tr-TR", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}**, saat **${now.toLocaleTimeString("tr-TR", {hour:"2-digit",minute:"2-digit"})}**`;
}

/* ══════════════════════════════════════════
   TOOL DETECTION — parse user intent
══════════════════════════════════════════ */
interface ToolCall { tool: string; args: Record<string, string> }

async function detectTools(text: string): Promise<ToolCall[]> {
  const calls: ToolCall[] = [];
  const lower = text.toLowerCase();

  // URL detection
  const urlMatches = text.match(/https?:\/\/[^\s"'<>()]+/g) || [];
  for (const url of urlMatches.slice(0, 3)) calls.push({ tool: "fetch_url", args: { url } });

  // Calculator — math expressions
  const mathPatterns = [
    /(\d[\d\s+\-*/.()%^]*\d)\s*=\s*\?/,
    /hesapla[:\s]+([^.?\n]+)/i,
    /(\d+)\s*[\+\-\*\/]\s*(\d+)/,
    /kaç(?:tır|a|ıncı)[\s:]+([^.?\n]+)/i,
  ];
  for (const p of mathPatterns) {
    const m = text.match(p);
    if (m) { calls.push({ tool: "calculator", args: { expr: m[1] || m[0] } }); break; }
  }

  // Weather
  const weatherPatterns = [
    /hava(?:\s+durumu)?(?:\s+\w+)?\s+(.+?)(?:\?|$)/i,
    /(.+?)\s+hava(?:sı|lar)?/i,
    /weather\s+(?:in\s+)?(.+)/i,
  ];
  if (/hava\s*(durumu)?|weather|sıcaklık|yağmur|kar\s+yağ/i.test(lower)) {
    for (const p of weatherPatterns) {
      const m = text.match(p);
      if (m?.[1] && m[1].length < 50) { calls.push({ tool: "weather", args: { location: m[1].trim() } }); break; }
    }
    if (!calls.some(c => c.tool === "weather")) {
      calls.push({ tool: "weather", args: { location: "İstanbul" } });
    }
  }

  // Web search
  const searchPatterns = [
    /ara[:\s]+(.+)/i,
    /search[:\s]+(.+)/i,
    /\b(?:son\s+dakika|güncel|2024|2025|bugün)\b/i,
    /haberler?|news\b/i,
  ];
  if (urlMatches.length === 0 && !calls.some(c=>c.tool==="weather")) {
    for (const p of searchPatterns) {
      const m = text.match(p);
      if (m) { calls.push({ tool: "web_search", args: { query: m[1] || text.slice(0,100) } }); break; }
    }
  }

  // DateTime
  if (/saat kaç|tarih\s*(ne|nedir)|bugün\s*(ne|hangi)/i.test(lower)) {
    calls.push({ tool: "datetime", args: {} });
  }

  return calls;
}

async function executeTools(calls: ToolCall[]): Promise<string> {
  const results: string[] = [];
  for (const call of calls) {
    let result = "";
    try {
      if (call.tool === "web_search") result = await toolWebSearch(call.args.query);
      else if (call.tool === "weather") result = await toolWeather(call.args.location);
      else if (call.tool === "calculator") result = toolCalculator(call.args.expr);
      else if (call.tool === "fetch_url") result = await toolFetchUrl(call.args.url);
      else if (call.tool === "datetime") result = toolDateTime();
    } catch (e: any) { result = `[Hata: ${e.message}]`; }
    if (result) results.push(`[${call.tool.toUpperCase()}: ${JSON.stringify(call.args)}]\n${result}`);
  }
  return results.join("\n\n---\n\n");
}

/* ══════════════════════════════════════════
   MAIN CHAT ENDPOINT
══════════════════════════════════════════ */
chatRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { messages, model: modelKey = "gpt-4o", mode, sysPrompt } = body;
    if (!messages || !Array.isArray(messages)) return c.json({ error: "messages required" }, 400);

    // IMAGE GENERATION
    if (mode === "image") {
      const lastMsg = messages[messages.length - 1];
      const prompt = typeof lastMsg.content === "string" ? lastMsg.content : lastMsg.content?.[0]?.text || "";
      try {
        const { files } = await generateText({
          model: gateway("google/gemini-3-pro-image"),
          providerOptions: { google: { responseModalities: ["TEXT", "IMAGE"] } },
          prompt: `Generate an image: ${prompt}`,
        });
        if (files && files.length > 0) {
          const file = files[0]!;
          const base64 = Buffer.from(file.uint8Array).toString("base64");
          return c.json({ reply: "✓ Görsel oluşturuldu", imageUrl: `data:${file.mediaType};base64,${base64}` });
        }
        throw new Error("Görsel dosyası üretilemedi");
      } catch (e: any) {
        return c.json({ error: `Görsel oluşturulamadı: ${e.message}` }, 500);
      }
    }

    // TOOL DETECTION on last user message
    const lastMsg = messages[messages.length - 1];
    const lastText = typeof lastMsg?.content === "string" ? lastMsg.content
      : Array.isArray(lastMsg?.content) ? lastMsg.content.map((p:any) => p.text || "").join(" ")
      : "";

    let toolContext = "";
    const toolCalls = await detectTools(lastText);
    if (toolCalls.length > 0) {
      toolContext = await executeTools(toolCalls);
    }

    // MODEL RESOLUTION
    const modelId = MODELS[modelKey] || MODELS["gpt-4o"];
    const hasImage = messages.some((m: any) =>
      Array.isArray(m.content) && m.content.some((p: any) => p.type === "image_url")
    );
    const resolvedModelId = hasImage && (modelKey === "gpt-4o-mini" || modelKey.startsWith("claude"))
      ? MODELS["gemini-2.5-flash"] : modelId;

    const model = gateway(resolvedModelId);

    const formattedMessages = messages.map((m: any) => {
      if (Array.isArray(m.content)) {
        return {
          role: m.role,
          content: m.content.map((part: any) => {
            if (part.type === "image_url") return { type: "image", image: part.image_url.url };
            return { type: "text", text: part.text };
          }),
        };
      }
      return { role: m.role, content: m.content };
    });

    // Inject custom system prompt + tool context
    const baseSystem = sysPrompt
      ? `${SYSTEM_PROMPT}\n\n## Özel Talimatlar:\n${sysPrompt}`
      : SYSTEM_PROMPT;
    const systemWithTools = toolContext
      ? `${baseSystem}\n\n## Araç Sonuçları (bunları yanıtında kullan):\n${toolContext}`
      : baseSystem;

    const { text, usage } = await generateText({
      model,
      system: systemWithTools,
      messages: formattedMessages as any,
      maxTokens: 4000,
    });

    return c.json({
      reply: text,
      model: resolvedModelId,
      tools: toolCalls.map(t => t.tool),
      usage: usage ? { input: usage.promptTokens, output: usage.completionTokens, total: usage.totalTokens } : null,
    });
  } catch (e: any) {
    console.error("Chat error:", e);
    return c.json({ error: e.message || "AI hatası" }, 500);
  }
});

/* ══════════════════════════════════════════
   TITLE GENERATION
══════════════════════════════════════════ */
chatRouter.post("/title", async (c) => {
  try {
    const { message } = await c.req.json();
    if (!message) return c.json({ title: "Yeni Sohbet" });
    const { text } = await generateText({
      model: gateway("openai/gpt-4o-mini"),
      prompt: `Bu kullanıcı mesajına kısa, 4-6 kelimelik Türkçe bir sohbet başlığı üret. Sadece başlığı yaz, tırnak işareti kullanma:\n\n"${message.slice(0, 200)}"`,
      maxTokens: 30,
    });
    return c.json({ title: text.trim().replace(/['"]/g, "").slice(0, 60) });
  } catch {
    return c.json({ title: "Yeni Sohbet" });
  }
});

/* ══════════════════════════════════════════
   SHARE ENDPOINT
══════════════════════════════════════════ */
const sharedConvs = new Map<string, { msgs: any[]; title: string; model: string; createdAt: number }>();

chatRouter.post("/share", async (c) => {
  try {
    const { msgs, title, model } = await c.req.json();
    const id = Math.random().toString(36).slice(2, 10);
    sharedConvs.set(id, { msgs, title: title || "Sohbet", model: model || "gpt-4o", createdAt: Date.now() });
    // Clean old shares (> 7 days)
    for (const [k, v] of sharedConvs) {
      if (Date.now() - v.createdAt > 7 * 86400000) sharedConvs.delete(k);
    }
    return c.json({ id, url: `/share/${id}` });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

chatRouter.get("/share/:id", async (c) => {
  const conv = sharedConvs.get(c.req.param("id"));
  if (!conv) return c.json({ error: "Bulunamadı" }, 404);
  return c.json(conv);
});

/* ══════════════════════════════════════════
   FILE PARSE
══════════════════════════════════════════ */
chatRouter.post("/parse-file", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    if (!file) return c.json({ error: "file required" }, 400);

    const fileName = file.name.toLowerCase();
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text = "";
    let fileType = "unknown";

    if (fileName.endsWith(".pdf")) {
      fileType = "pdf";
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const result = await pdfParse(Buffer.from(bytes));
        text = result.text?.slice(0, 8000) || "";
      } catch { text = "[PDF içeriği okunamadı]"; }
    } else if ([".txt",".md",".csv",".json"].some(e => fileName.endsWith(e))) {
      fileType = "text";
      text = new TextDecoder().decode(bytes).slice(0, 8000);
    } else if ([".js",".ts",".py",".html",".css",".xml",".jsx",".tsx"].some(e => fileName.endsWith(e))) {
      fileType = "code";
      text = new TextDecoder().decode(bytes).slice(0, 8000);
    } else if ([".xlsx",".xls"].some(e => fileName.endsWith(e))) {
      fileType = "excel";
      text = "[Excel dosyası yüklendi — analiz için metin olarak gönderin]";
    } else if ([".docx",".doc"].some(e => fileName.endsWith(e))) {
      fileType = "word";
      try {
        const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        text = decoded.replace(/[^\x20-\x7E\n\r\t\u00C0-\u024F]/g, " ").replace(/\s{3,}/g, " ").slice(0, 6000);
      } catch { text = "[Word dosyası içeriği okunamadı]"; }
    }

    return c.json({ text, fileType, fileName: file.name, size: file.size });
  } catch (e: any) {
    return c.json({ error: e.message || "Dosya okunamadı" }, 500);
  }
});

/* ══════════════════════════════════════════
   URL FETCH (direct)
══════════════════════════════════════════ */
chatRouter.post("/fetch-url", async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) return c.json({ error: "url required" }, 400);
    let parsed: URL;
    try { parsed = new URL(url); } catch { return c.json({ error: "Geçersiz URL" }, 400); }
    if (!["http:", "https:"].includes(parsed.protocol)) return c.json({ error: "Sadece http/https" }, 400);

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ECAgent/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return c.json({ error: `HTTP ${res.status}` }, 400);

    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || parsed.hostname;
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
      .replace(/<nav[\s\S]*?<\/nav>/gi," ").replace(/<footer[\s\S]*?<\/footer>/gi," ")
      .replace(/<\/(p|div|li|h[1-6]|br|tr|article|section)>/gi,"\n")
      .replace(/<[^>]+>/g," ")
      .replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
      .replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim().slice(0, 12000);

    return c.json({ title, text, url, chars: text.length });
  } catch (e: any) {
    if (e.name === "TimeoutError") return c.json({ error: "Zaman aşımı" }, 408);
    return c.json({ error: e.message }, 500);
  }
});

/* ══════════════════════════════════════════
   TRANSCRIBE
══════════════════════════════════════════ */
chatRouter.post("/transcribe", async (c) => {
  try {
    const formData = await c.req.formData();
    const audioFile = formData.get("audio") as File;
    if (!audioFile) return c.json({ text: "" });
    const fd = new FormData();
    fd.append("file", audioFile, "audio.webm");
    fd.append("model", "whisper-1");
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` },
      body: fd,
    });
    if (!res.ok) return c.json({ text: "" });
    const data: any = await res.json();
    return c.json({ text: data.text || "" });
  } catch {
    return c.json({ text: "" });
  }
});
