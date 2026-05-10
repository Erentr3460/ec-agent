import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import app from "./src/api/index";

const server = new Hono();

// API routes
server.route("/", app);

// Serve static frontend from vite build output
server.use("/*", serveStatic({ root: "./dist" }));

// SPA fallback — always serve index.html for unknown routes
server.get("/*", serveStatic({ path: "./dist/index.html" }));

const port = Number(process.env.PORT) || 4200;
console.log(`EÇ Agent running on port ${port}`);

serve({ fetch: server.fetch, port });
