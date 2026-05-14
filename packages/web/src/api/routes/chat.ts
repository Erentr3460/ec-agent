import { Hono } from "hono";
import { generateText, generateObject } from "ai";
import { gateway } from "../agent/gateway";

export const chatRouter = new Hono();

const MODELS: Record<string, string> = {
  "gpt-4o": "openai/gpt-4o",
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "gemini-2.5-flash": "google/gemini-2.5-flash-preview-05-20",
  "claude-3.5-sonnet": "anthropic/claude-sonnet-4-5",
  "claude-3.5-haiku": "anthropic/claude-haiku-4-5",
};

const SYSTEM_PROMPT = `Sen EÇ Agent'sın — Eren Çetin'in kişisel AI asistanı. Akıllı, yardımcı ve kısa ama kapsamlı cevaplar verirsin.
Kullanıcı hangi dilde yazarsa o dilde cevap verirsin. Markdown kullanabilirsin: **bold**, *italic*, \`kod\`, kod blokları, listeler, tablolar.
Görselleri analiz edebilir, kod yazabilir, dosya içeriklerini analiz edebilirsin.
Tarih: ${new Date().toLocaleDateString("tr-TR")}`;

// Main chat endpoint
chatRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { messages, model: modelKey = "gpt-4o", mode } = body;

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "messages required" }, 400);
    }

    // IMAGE GENERATION MODE — Gemini Pro Image via gateway
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
          const dataUrl = `data:${file.mediaType};base64,${base64}`;
          return c.json({ reply: "Görsel oluşturuldu ✓", imageUrl: dataUrl });
        } else {
          throw new Error("Görsel dosyası üretilemedi");
        }
      } catch (e: any) {
        return c.json({ error: `Görsel oluşturulamadı: ${e.message}` }, 500);
      }
    }

    // CHAT MODE
    const modelId = MODELS[modelKey] || MODELS["gpt-4o"];

    // Check for vision content
    const hasImage = messages.some(
      (m: any) => Array.isArray(m.content) && m.content.some((p: any) => p.type === "image_url")
    );

    // Use gemini for vision if model doesn't support it
    const resolvedModelId =
      hasImage && (modelKey === "gpt-4o-mini" || modelKey.startsWith("claude"))
        ? MODELS["gemini-2.5-flash"]
        : modelId;

    const model = gateway(resolvedModelId);

    const formattedMessages = messages.map((m: any) => {
      if (Array.isArray(m.content)) {
        return {
          role: m.role,
          content: m.content.map((part: any) => {
            if (part.type === "image_url") {
              return { type: "image", image: part.image_url.url };
            }
            return { type: "text", text: part.text };
          }),
        };
      }
      return { role: m.role, content: m.content };
    });

    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      messages: formattedMessages as any,
      maxTokens: 4000,
    });

    return c.json({ reply: text, model: resolvedModelId });
  } catch (e: any) {
    console.error("Chat error:", e);
    return c.json({ error: e.message || "AI hatası" }, 500);
  }
});

// File parse endpoint
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
        // Dynamic import to avoid top-level issues
        const pdfParse = (await import("pdf-parse")).default;
        const result = await pdfParse(Buffer.from(bytes));
        text = result.text?.slice(0, 8000) || "";
      } catch (e) {
        text = "[PDF içeriği okunamadı]";
      }
    } else if (
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".json")
    ) {
      fileType = fileName.endsWith(".json") ? "json" : "text";
      text = new TextDecoder().decode(bytes).slice(0, 8000);
    } else if (fileName.endsWith(".js") || fileName.endsWith(".ts") || fileName.endsWith(".py") ||
               fileName.endsWith(".html") || fileName.endsWith(".css") || fileName.endsWith(".xml")) {
      fileType = "code";
      text = new TextDecoder().decode(bytes).slice(0, 8000);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      fileType = "excel";
      text = "[Excel dosyası yüklendi — içerik analizi için metin formatında gönderin]";
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      fileType = "word";
      // Try reading as text
      try {
        const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        // Extract readable text (rough extraction)
        const readable = decoded.replace(/[^\x20-\x7E\n\r\t\u00C0-\u024F]/g, " ")
          .replace(/\s{3,}/g, " ")
          .slice(0, 6000);
        text = readable || "[Word dosyası içeriği okunamadı]";
      } catch {
        text = "[Word dosyası içeriği okunamadı]";
      }
    }

    return c.json({ text, fileType, fileName: file.name, size: file.size });
  } catch (e: any) {
    console.error("Parse error:", e);
    return c.json({ error: e.message || "Dosya okunamadı" }, 500);
  }
});

// URL fetch endpoint — scrape web page content
chatRouter.post("/fetch-url", async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url || typeof url !== "string") return c.json({ error: "url required" }, 400);

    // Validate URL
    let parsed: URL;
    try { parsed = new URL(url); } catch { return c.json({ error: "Geçersiz URL" }, 400); }
    if (!["http:", "https:"].includes(parsed.protocol)) return c.json({ error: "Sadece http/https" }, 400);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ECAgent/1.0)",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return c.json({ error: `Sayfa alınamadı: HTTP ${res.status}` }, 400);

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml")) {
      return c.json({ error: "Desteklenmeyen içerik tipi" }, 400);
    }

    const html = await res.text();

    // Strip HTML tags, extract readable text
    let text = html
      // Remove scripts, styles, nav, footer, header noise
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      // Convert block tags to newlines
      .replace(/<\/(p|div|li|h[1-6]|br|tr|article|section|blockquote)>/gi, "\n")
      // Strip remaining tags
      .replace(/<[^>]+>/g, " ")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&[a-z]+;/gi, " ")
      // Collapse whitespace
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : parsed.hostname;

    // Limit content size
    const MAX = 12000;
    const truncated = text.length > MAX;
    if (truncated) text = text.slice(0, MAX) + "\n\n[... içerik kısaltıldı]";

    return c.json({ title, text, url, truncated, chars: text.length });
  } catch (e: any) {
    console.error("Fetch URL error:", e);
    if (e.name === "TimeoutError") return c.json({ error: "Bağlantı zaman aşımı (12s)" }, 408);
    return c.json({ error: e.message || "URL içeriği alınamadı" }, 500);
  }
});

// Transcribe endpoint  
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
