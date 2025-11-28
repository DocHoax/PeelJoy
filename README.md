# PeelJoy - Design Assets for Developers

Download free icons, 3D icons, illustrations, and Lottie animations for your projects.

## Features

- **Icons** - Vector icons for UI/UX design
- **3D Icons** - Modern 3D icons with depth and style
- **Illustrations** - Beautiful vector illustrations
- **Lottie Animations** - Lightweight, scalable animations

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add your IconScout API key to `.env`:

```
ICONSCOUT_CLIENT_ID=your_api_key_here
```

3. Start the server:

```bash
node server.js
```

4. Open http://localhost:3000 in your browser

## API Endpoints

The server proxies requests to IconScout API:

- `GET /api/icons` - Search icons
- `GET /api/3d-icons` - Search 3D icons
- `GET /api/illustrations` - Search illustrations
- `GET /api/lottie` - Search Lottie animations

Query parameters:

- `q` - Search query (default: "popular")
- `page` - Page number (default: 1)
- `per_page` - Results per page (default: 20)

## Tech Stack

- Frontend: HTML, TailwindCSS, Vanilla JavaScript
- Backend: Node.js, Express
- API: IconScout REST API
- Animations: Lottie Player

## License

Powered by IconScout API. Assets are subject to IconScout's licensing terms.
