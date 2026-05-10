import { Hono } from 'hono';
import { cors } from "hono/cors";
import { tasksRouter } from "./routes/tasks";
import { settingsRouter } from "./routes/settings";

const app = new Hono()
  .basePath('api')
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))
  .get('/health', (c) => c.json({ status: 'ok' }, 200))
  .route('/tasks', tasksRouter)
  .route('/settings', settingsRouter);

export type AppType = typeof app;
export default app;
