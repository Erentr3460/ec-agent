import { Hono } from 'hono';
import { cors } from "hono/cors";
import { tasksRouter } from "./routes/tasks";
import { settingsRouter } from "./routes/settings";
import { chatRouter } from "./routes/chat";

const app = new Hono()
  .basePath('api')
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))
  .get('/health', (c) => c.json({ status: 'ok' }, 200))
  .route('/tasks', tasksRouter)
  .route('/settings', settingsRouter)
  .route('/chat', chatRouter)
  .post('/transcribe', async (c) => {
    const formData = await c.req.formData();
    const audioFile = formData.get("audio") as File;
    if (!audioFile) return c.json({ text: "" });

    const fd = new FormData();
    fd.append("file", audioFile, "audio.webm");
    fd.append("model", "whisper-1");

    try {
      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` },
        body: fd,
      });
      const data = await res.json();
      return c.json({ text: data.text || "" });
    } catch {
      return c.json({ text: "" });
    }
  });

export type AppType = typeof app;
export default app;
