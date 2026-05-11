import { Hono } from "hono";
import { generateText } from "ai";
import { gateway } from "../agent/gateway";

export const chatRouter = new Hono();

// Chat endpoint
chatRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "messages required" }, 400);
    }

    // Check if any message has image content
    const hasImage = messages.some(m =>
      Array.isArray(m.content) && m.content.some((p: any) => p.type === "image_url")
    );

    const model = hasImage
      ? gateway("google/gemini-2.5-flash-preview-05-20") // vision model
      : gateway("openai/gpt-5.4");

    const formattedMessages = messages.map((m: any) => {
      if (Array.isArray(m.content)) {
        return {
          role: m.role,
          content: m.content.map((part: any) => {
            if (part.type === "image_url") {
              return {
                type: "image",
                image: part.image_url.url,
              };
            }
            return { type: "text", text: part.text };
          }),
        };
      }
      return { role: m.role, content: m.content };
    });

    const { text } = await generateText({
      model,
      system: `Sen EÇ Agent'sın — Eren Çetin'in kişisel AI asistanı. Türkçe konuşursun ama kullanıcı başka dilde yazarsa o dilde cevap verirsin. 
Yardımcı, zeki ve kısa cevaplar verirsin. Görselleri analiz edebilir, kod yazabilir, analiz yapabilirsin.
Tarih: ${new Date().toLocaleDateString("tr-TR")}`,
      messages: formattedMessages as any,
      maxTokens: 2000,
    });

    return c.json({ reply: text });
  } catch (e: any) {
    console.error("Chat error:", e);
    return c.json({ error: e.message || "AI hatası" }, 500);
  }
});

// Transcribe endpoint
chatRouter.post("/transcribe", async (c) => {
  try {
    const formData = await c.req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return c.json({ error: "audio file required" }, 400);
    }

    // Use OpenAI Whisper via gateway
    const fd = new FormData();
    fd.append("file", audioFile, "audio.webm");
    fd.append("model", "whisper-1");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      },
      body: fd,
    });

    if (!res.ok) {
      // Fallback — return empty
      return c.json({ text: "" });
    }

    const data = await res.json();
    return c.json({ text: data.text || "" });
  } catch (e: any) {
    console.error("Transcribe error:", e);
    return c.json({ text: "" });
  }
});
