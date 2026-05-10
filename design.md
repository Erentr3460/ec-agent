# EÇ AGENT — Design Direction

## Vibe
Dark, futuristic, minimal. Like a mission control center for AI operations.
Inspired by scheduling/tasking agent dashboards with neon glow accents.

## Colors
- Background: `#0a0a0f` (near-black)
- Surface: `#111118` (card bg)
- Border: `#1e1e2e` (subtle)
- Primary accent: `#7c3aed` (violet/purple neon)
- Secondary accent: `#06d6a0` (mint/cyan green)
- Warning: `#f59e0b` (amber)
- Danger: `#ef4444` (red)
- Text primary: `#f0f0ff`
- Text muted: `#6b7280`

## Typography
- Font: Syne (display/headings) + Inter (body/mono) — Google Fonts
- Heading: Syne 700, letter-spacing tight
- Body: Inter 400/500
- Code/logs: JetBrains Mono

## Layout
- Sidebar nav (left, 240px)
- Main content area with tight grid
- Cards with subtle border + slight glow on hover
- Status pills with colored dots

## Agent Cards
- Each agent has a color identity: Blog=violet, SEO=cyan, Price=amber, Image=green
- Status badge: idle / running / done / error
- Live log stream (monospace, scrollable)

## Motion
- Subtle fade-in on page load
- Pulsing dot animation for "running" state
- Log lines slide in from bottom
