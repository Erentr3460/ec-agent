import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";

export const settingsRouter = new Hono()
  .get("/", async (c) => {
    const rows = await db.select().from(schema.settings);
    const result: Record<string, string> = {};
    for (const row of rows) result[row.key] = row.value;
    return c.json({ settings: result }, 200);
  })
  .post("/", async (c) => {
    const body = await c.req.json();
    for (const [key, value] of Object.entries(body)) {
      const existing = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
      if (existing.length > 0) {
        await db.update(schema.settings).set({ value: String(value) }).where(eq(schema.settings.key, key));
      } else {
        await db.insert(schema.settings).values({ key, value: String(value) });
      }
    }
    return c.json({ success: true }, 200);
  });
