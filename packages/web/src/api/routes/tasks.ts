import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { generateText } from "ai";
import { gateway } from "../agent/gateway";

async function sendTelegramMessage(chatId: string | null | undefined, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const id = chatId || process.env.TELEGRAM_CHAT_ID;
  if (!token || !id) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: id, text, parse_mode: "Markdown" }),
    });
  } catch (e) {
    console.error("Telegram error:", e);
  }
}

async function addLog(taskId: number, line: string) {
  const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId));
  if (!task) return;
  const logs = JSON.parse(task.logs || "[]");
  logs.push({ time: new Date().toISOString(), message: line });
  await db.update(schema.tasks).set({ logs: JSON.stringify(logs), updatedAt: new Date() }).where(eq(schema.tasks.id, taskId));
}

async function runBlogAgent(taskId: number, input: any, telegramChatId?: string | null) {
  await addLog(taskId, "Blog yazma ajanı başlatıldı...");
  const { topic, keywords, length } = input;

  await addLog(taskId, `Konu analiz ediliyor: "${topic}"`);
  await addLog(taskId, `SEO anahtar kelimeler: ${keywords || "otomatik"}`);

  const prompt = `Sen bir uzman SEO blog yazarısın. Türkçe olarak aşağıdaki konuda kapsamlı bir blog yazısı yaz.

Konu: ${topic}
Hedef anahtar kelimeler: ${keywords || "konuya uygun otomatik seç"}
Uzunluk: ${length || "orta"} (kısa: ~500, orta: ~1000, uzun: ~2000 kelime)

Şunları içersin:
- Dikkat çekici başlık (H1)
- Alt başlıklar (H2, H3)
- Giriş paragrafı
- Ana içerik bölümleri
- SEO meta açıklaması (sonunda, "META:" ile başlayarak)
- Sonuç ve CTA

Markdown formatında yaz.`;

  await addLog(taskId, "GPT-4o ile içerik üretiliyor...");

  const { text } = await generateText({
    model: gateway("openai/gpt-5.4"),
    prompt,
    maxTokens: 3000,
  });

  await addLog(taskId, "Blog yazısı tamamlandı ✓");

  const result = { type: "blog", content: text, topic, keywords };
  await db.update(schema.tasks).set({
    status: "done",
    result: JSON.stringify(result),
    updatedAt: new Date()
  }).where(eq(schema.tasks.id, taskId));

  if (telegramChatId) {
    await sendTelegramMessage(telegramChatId,
      `✅ *EÇ AGENT — Blog Tamamlandı*\n\n📝 Konu: ${topic}\n\n${text.slice(0, 500)}...\n\n_Tam içerik için dashboard'u ziyaret edin._`
    );
  }
}

async function runSeoAgent(taskId: number, input: any, telegramChatId?: string | null) {
  await addLog(taskId, "SEO analiz ajanı başlatıldı...");
  const { url, targetKeywords } = input;

  await addLog(taskId, `URL analiz ediliyor: ${url}`);

  let pageContent = "";
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const html = await res.text();
    pageContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 3000);
    await addLog(taskId, "Sayfa içeriği başarıyla çekildi ✓");
  } catch (e) {
    await addLog(taskId, "Sayfa içeriği çekilemedi, genel analiz yapılacak");
    pageContent = "Sayfa erişilemedi";
  }

  const prompt = `Sen bir SEO uzmanısın. Aşağıdaki web sayfasını analiz et ve detaylı SEO raporu hazırla.

URL: ${url}
Hedef Anahtar Kelimeler: ${targetKeywords || "belirsiz"}
Sayfa İçeriği (kısaltılmış): ${pageContent}

Şunları değerlendir ve Türkçe olarak raporla:
1. **Teknik SEO** (başlık etiketi, meta açıklama, H1-H6 yapısı)
2. **Anahtar Kelime Kullanımı** (yoğunluk, yerleşim)
3. **İçerik Kalitesi** (özgünlük, uzunluk, okunabilirlik)
4. **Sayfa Hızı Önerileri**
5. **Backlink Stratejisi**
6. **1. Sayfaya Çıkma Planı** (adım adım aksiyon planı)
7. **Puan**: /100

Her madde için spesifik öneriler ver.`;

  await addLog(taskId, "SEO skoru hesaplanıyor...");
  await addLog(taskId, "Rakip analizi yapılıyor...");

  const { text } = await generateText({
    model: gateway("openai/gpt-5.4"),
    prompt,
    maxTokens: 2000,
  });

  await addLog(taskId, "SEO raporu hazırlandı ✓");

  const result = { type: "seo", report: text, url, targetKeywords };
  await db.update(schema.tasks).set({
    status: "done",
    result: JSON.stringify(result),
    updatedAt: new Date()
  }).where(eq(schema.tasks.id, taskId));

  if (telegramChatId) {
    await sendTelegramMessage(telegramChatId,
      `📊 *EÇ AGENT — SEO Raporu Tamamlandı*\n\n🌐 URL: ${url}\n\n${text.slice(0, 500)}...\n\n_Tam rapor için dashboard'u ziyaret edin._`
    );
  }
}

async function runPriceAgent(taskId: number, input: any, telegramChatId?: string | null) {
  await addLog(taskId, "Fiyat takip ajanı başlatıldı...");
  const { productUrl, productName, targetPrice } = input;

  await addLog(taskId, `Ürün: ${productName}`);
  await addLog(taskId, `URL kontrol ediliyor: ${productUrl}`);

  let pageContent = "";
  let currentPrice = null;
  
  try {
    const res = await fetch(productUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    const html = await res.text();
    pageContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 5000);
    await addLog(taskId, "Sayfa verisi çekildi, fiyat ayrıştırılıyor...");
  } catch (e) {
    await addLog(taskId, "Sayfa erişilemedi");
    pageContent = "Erişim hatası";
  }

  const prompt = `Sen bir e-ticaret fiyat analisti'sin. Aşağıdaki sayfa içeriğini analiz et.

Ürün Adı: ${productName}
URL: ${productUrl}
Hedef Fiyat: ${targetPrice ? `${targetPrice} TL` : "belirsiz"}
Sayfa İçeriği: ${pageContent}

Şunları çıkar ve Türkçe raporla:
1. **Mevcut Fiyat**: Sayfadan fiyatı bul (bulamazsan belirt)
2. **Fiyat Değerlendirmesi**: Hedef fiyatla karşılaştır
3. **Fırsat Analizi**: Şu an alınmalı mı?
4. **Fiyat Tahmin**: Fiyat düşer mi yükselir mi?
5. **Öneri**: Net karar ver

JSON formatında başla, sonra açıklama yap:
{"currentPrice": number|null, "recommendation": "buy"|"wait", "priceMatch": boolean}`;

  const { text } = await generateText({
    model: gateway("openai/gpt-5.4"),
    prompt,
    maxTokens: 1000,
  });

  // Try to extract price from response
  try {
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      currentPrice = parsed.currentPrice;
      await addLog(taskId, `Mevcut fiyat: ${currentPrice ? `${currentPrice} TL` : "bulunamadı"}`);
      if (targetPrice && currentPrice && currentPrice <= targetPrice) {
        await addLog(taskId, `🎯 HEDEF FİYATA ULAŞILDI! ${currentPrice} TL ≤ ${targetPrice} TL`);
        if (telegramChatId) {
          await sendTelegramMessage(telegramChatId,
            `🎯 *EÇ AGENT — FİYAT ALARMI!*\n\n✅ ${productName}\n💰 Mevcut Fiyat: *${currentPrice} TL*\n🎯 Hedef: ${targetPrice} TL\n\n🛒 Hemen satın almak için: ${productUrl}`
          );
        }
      } else {
        await addLog(taskId, `Henüz hedef fiyata ulaşılmadı`);
        if (telegramChatId) {
          await sendTelegramMessage(telegramChatId,
            `📦 *EÇ AGENT — Fiyat Kontrolü*\n\n${productName}\n💰 Mevcut: ${currentPrice ? `${currentPrice} TL` : "bilinmiyor"}\n🎯 Hedef: ${targetPrice ? `${targetPrice} TL` : "belirsiz"}\n\nHenüz hedef fiyata ulaşılmadı.`
          );
        }
      }
    }
  } catch {}

  await addLog(taskId, "Fiyat analizi tamamlandı ✓");

  const result = { type: "price", analysis: text, productName, productUrl, currentPrice, targetPrice };
  await db.update(schema.tasks).set({
    status: "done",
    result: JSON.stringify(result),
    updatedAt: new Date()
  }).where(eq(schema.tasks.id, taskId));
}

async function runImageAgent(taskId: number, input: any, telegramChatId?: string | null) {
  await addLog(taskId, "Görsel üretim ajanı başlatıldı...");
  const { prompt: userPrompt, style, size } = input;

  await addLog(taskId, `Prompt hazırlanıyor: "${userPrompt}"`);
  await addLog(taskId, `Stil: ${style || "otomatik"}`);

  const enhancedPromptResult = await generateText({
    model: gateway("openai/gpt-5.4"),
    prompt: `Aşağıdaki görsel talebini profesyonel bir image prompt'a çevir. Sadece İngilizce prompt döndür, başka açıklama yapma.

Kullanıcı talebi: ${userPrompt}
Stil tercihi: ${style || "realistic, high quality"}

Kısa ama detaylı, görsel açıdan zengin bir prompt yaz (max 200 karakter):`,
    maxTokens: 200,
  });

  const enhancedPrompt = enhancedPromptResult.text.trim();
  await addLog(taskId, `Optimize prompt: "${enhancedPrompt}"`);
  await addLog(taskId, "Görsel oluşturuluyor (Gemini Pro Image)...");

  try {
    const { files } = await generateText({
      model: gateway("google/gemini-3-pro-image"),
      providerOptions: { google: { responseModalities: ["TEXT", "IMAGE"] } },
      prompt: `Generate an image: ${enhancedPrompt}`,
    });

    if (files && files.length > 0) {
      const file = files[0]!;
      const base64 = Buffer.from(file.uint8Array).toString("base64");
      const dataUrl = `data:${file.mediaType};base64,${base64}`;

      await addLog(taskId, "Görsel başarıyla oluşturuldu ✓");

      const result = { type: "image", imageData: dataUrl, prompt: userPrompt, enhancedPrompt };
      await db.update(schema.tasks).set({
        status: "done",
        result: JSON.stringify(result),
        updatedAt: new Date()
      }).where(eq(schema.tasks.id, taskId));

      if (telegramChatId) {
        await sendTelegramMessage(telegramChatId,
          `🎨 *EÇ AGENT — Görsel Tamamlandı*\n\n📝 Talep: ${userPrompt}\n✨ Optimize prompt: ${enhancedPrompt}\n\nGörseli dashboard'dan indirebilirsiniz.`
        );
      }
    } else {
      throw new Error("Görsel dosyası üretilemedi");
    }
  } catch (e: any) {
    await addLog(taskId, `Görsel üretilemedi: ${e.message}`);
    const result = { type: "image", error: e.message, prompt: userPrompt, enhancedPrompt };
    await db.update(schema.tasks).set({
      status: "error",
      result: JSON.stringify(result),
      updatedAt: new Date()
    }).where(eq(schema.tasks.id, taskId));
    return;
  }
}

export async function executeTask(taskId: number) {
  const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId));
  if (!task) return;

  await db.update(schema.tasks).set({ status: "running", updatedAt: new Date() }).where(eq(schema.tasks.id, taskId));

  let input: any = {};
  try { input = JSON.parse(task.input); } catch {}

  try {
    if (task.agentType === "blog") await runBlogAgent(taskId, input, task.telegramChatId);
    else if (task.agentType === "seo") await runSeoAgent(taskId, input, task.telegramChatId);
    else if (task.agentType === "price") await runPriceAgent(taskId, input, task.telegramChatId);
    else if (task.agentType === "image") await runImageAgent(taskId, input, task.telegramChatId);
  } catch (e: any) {
    await addLog(taskId, `Hata: ${e.message}`);
    await db.update(schema.tasks).set({ status: "error", updatedAt: new Date() }).where(eq(schema.tasks.id, taskId));
  }
}

export const tasksRouter = new Hono()
  .get("/", async (c) => {
    const tasks = await db.select().from(schema.tasks).orderBy(desc(schema.tasks.createdAt));
    return c.json({ tasks }, 200);
  })
  .get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    if (!task) return c.json({ error: "Not found" }, 404);
    return c.json({ task }, 200);
  })
  .post("/", async (c) => {
    const body = await c.req.json();
    const { agentType, title, input, telegramChatId, cronExpression } = body;

    const [task] = await db.insert(schema.tasks).values({
      agentType,
      title,
      input: JSON.stringify(input),
      status: "pending",
      telegramChatId: telegramChatId || null,
      cronExpression: cronExpression || null,
    }).returning();

    // Run immediately in background (non-blocking)
    executeTask(task.id).catch(console.error);

    return c.json({ task }, 201);
  })
  .delete("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
    return c.json({ success: true }, 200);
  })
  .post("/:id/retry", async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.update(schema.tasks).set({ status: "pending", logs: "[]", result: null, updatedAt: new Date() }).where(eq(schema.tasks.id, id));
    executeTask(id).catch(console.error);
    return c.json({ success: true }, 200);
  });

// ─── Cron Runner ────────────────────────────────────────────────────────────

/** Parse a simple cron expression and get next Date after `from`.
 *  Supports "minute hour * * *" syntax (daily/hourly patterns). */
function getNextRun(cronExpr: string, from: Date = new Date()): Date {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return new Date(from.getTime() + 24 * 60 * 60 * 1000);
  const [minute, hour] = parts;
  const m = parseInt(minute), h = parseInt(hour);
  const next = new Date(from);
  next.setSeconds(0, 0);
  // Try today first
  next.setHours(isNaN(h) ? next.getHours() : h, isNaN(m) ? next.getMinutes() + 1 : m, 0, 0);
  if (next <= from) {
    // Advance by appropriate interval
    if (!isNaN(h)) {
      next.setDate(next.getDate() + 1); // daily
    } else {
      next.setHours(next.getHours() + 1); // hourly
    }
  }
  return next;
}

async function runCronTasks() {
  const now = new Date();
  try {
    const allTasks = await db.select().from(schema.tasks);
    for (const task of allTasks) {
      if (!task.cronExpression) continue;
      if (task.status === "running") continue;

      const nextRun = task.nextRunAt;
      if (!nextRun || nextRun <= now) {
        // Clone task as a new run
        const [newTask] = await db.insert(schema.tasks).values({
          agentType: task.agentType,
          title: task.title,
          input: task.input,
          status: "pending",
          telegramChatId: task.telegramChatId,
          cronExpression: null, // one-shot clone
        }).returning();

        // Update parent task's nextRunAt
        const next = getNextRun(task.cronExpression, now);
        await db.update(schema.tasks)
          .set({ nextRunAt: next, updatedAt: now })
          .where(eq(schema.tasks.id, task.id));

        console.log(`[cron] Firing task ${task.id} ("${task.title}"), next run: ${next.toISOString()}`);
        executeTask(newTask.id).catch(console.error);
      }
    }
  } catch (e) {
    console.error("[cron] Error:", e);
  }
}

// Initialize nextRunAt for tasks that don't have it yet
async function initCronTasks() {
  const allTasks = await db.select().from(schema.tasks);
  for (const task of allTasks) {
    if (task.cronExpression && !task.nextRunAt) {
      const next = getNextRun(task.cronExpression, new Date());
      await db.update(schema.tasks)
        .set({ nextRunAt: next })
        .where(eq(schema.tasks.id, task.id));
    }
  }
}

// Start cron loop (runs every 60 seconds)
initCronTasks().catch(console.error);
setInterval(() => runCronTasks().catch(console.error), 60_000);
