# 3D Contribution Visualizer

A serverless web tool that fetches GitHub contribution counts and LeetCode submission counts, then renders them as **3D isometric bar charts** (green monochrome) as pure SVG strings. Built with Hono, deployed on Vercel.

## Features

- Isometric 3D bar chart rendered as pure SVG — no canvas, no puppeteer, no JS in the output
- Fetches the last 52 weeks of contribution data from GitHub GraphQL API
- Fetches LeetCode submission calendar from LeetCode GraphQL API
- Combined or per-source charts (GitHub only, LeetCode only, or both merged)
- In-memory caching with TTL
- Web UI to preview and copy Markdown embed snippets
- Painter's algorithm for correct 3D occlusion

## Usage

### API Endpoint

```
GET /api/contributions?github=USERNAME&lc=LCUSERNAME&source=all|github|leetcode
```

| Param | Required | Description |
|-------|----------|-------------|
| `github` | Yes | GitHub username |
| `lc` | No | LeetCode username |
| `source` | No | `all` (default), `github`, or `leetcode` |

### README Embed

```markdown
![Combined](https://your-app.vercel.app/api/contributions?github=torvalds&lc=hxu)
![GitHub](https://your-app.vercel.app/api/contributions?github=torvalds&source=github)
![LeetCode](https://your-app.vercel.app/api/contributions?github=torvalds&lc=hxu&source=leetcode)
```

## Local Development

```bash
# Install dependencies
npm install

# Set your GitHub token
# Create a .env file with:
# GITHUB_TOKEN=ghp_your_token

# Start dev server
node server.js
# → http://localhost:3000
```

## Deploy to Vercel

```bash
npx vercel --prod
```

Set environment variable in Vercel dashboard:
- `GITHUB_TOKEN` — GitHub personal access token with `repo` scope

## Project Structure

```
├── api/
│   └── contributions.js    Vercel serverless handler (Hono)
├── lib/
│   ├── cache.js            In-memory TTL cache
│   ├── github.js           GitHub GraphQL fetch + parse
│   ├── leetcode.js         LeetCode GraphQL fetch + parse
│   ├── normalize.js        Merge both sources into unified grid
│   └── renderer.js         Isometric 3D SVG builder
├── public/
│   └── index.html          Web UI: preview + copy snippets
├── server.js               Local dev server
├── package.json
├── vercel.json
└── .env.example
```

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Hono (lightweight, edge-compatible)
- **Deployment**: Vercel (serverless functions)
- **SVG generation**: Pure string templates
- **Caching**: In-memory Map with TTL
- **Frontend**: Single vanilla HTML file, no build step

## License

MIT
