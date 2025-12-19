# PeelJoy - Design Assets for Developers

Download free icons, 3D icons, illustrations, and animated graphics for your projects.

## Features

- **Icons** - Vector icons for UI/UX design
- **3D Icons** - Modern 3D-style vector graphics with depth
- **Illustrations** - Beautiful vector illustrations
- **Animations** - Motion and animated vector graphics

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add your Freepik API key to `.env`:

```
FREEPIK_API_KEY=your_api_key_here
```

3. Start the server:

```bash
node server.js
```

4. Open http://localhost:3000 in your browser

## API Endpoints

The server proxies requests to Freepik API:

- `GET /api/icons` - Search icons
- `GET /api/3d-icons` - Search 3D-style vectors
- `GET /api/illustrations` - Search illustrations
- `GET /api/lottie` - Search animated/motion vectors

Query parameters:

- `q` - Search query (default: "popular")
- `page` - Page number (default: 1)
- `per_page` - Results per page (default: 20)

## Tech Stack

- Frontend: HTML, TailwindCSS, Vanilla JavaScript
- Backend: Node.js, Express
- API: Freepik REST API

## License

Powered by Freepik API. Assets are subject to Freepik's licensing terms.
