# Finance Research Bee - Frontend

React + Vite frontend application for the Finance Research Bee financial data scraper.

## Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `VITE_API_URL`: Your backend API URL (default: `http://localhost:5000`)

3. **Run Development Server**
   ```bash
   pnpm run dev
   ```
   
   The app will be available at `http://localhost:3000`

4. **Build for Production**
   ```bash
   pnpm run build
   ```

## Deployment

This frontend is configured for deployment on **Vercel**.

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for detailed deployment instructions.

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **tRPC** - Type-safe API client
- **React Query** - Data fetching and caching
- **Wouter** - Routing
