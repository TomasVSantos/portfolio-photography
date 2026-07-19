# Tomás Santos Photography

A static-first photography portfolio built with Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion.

## Development

```bash
pnpm install
pnpm dev
```

## Cloudflare Pages

The site uses Next.js static export. Set the Cloudflare Pages build command to `pnpm build:cf` and the output directory to `out`.

## Architecture

- `src/app` — routes and application shell
- `src/components` — reusable UI and portfolio components
- `src/content` — MDX photo content
- `src/lib` — content, image, and metadata adapters
- `public/photos` — local image provider; replaceable with an R2-backed provider later
