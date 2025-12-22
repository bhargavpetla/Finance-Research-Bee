# Finance Research Bee - Backend

Node.js + Express backend API for the Finance Research Bee financial data scraper.

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
   - `DATABASE_URL`: MySQL connection string
   - `JWT_SECRET`: Generate using `openssl rand -base64 32`
   - `PERPLEXITY_API_KEY`: Your Perplexity API key (optional)
   - `PORT`: Server port (default: 5000)
   - `CORS_ORIGIN`: Frontend URL for CORS

3. **Setup Database**
   ```bash
   pnpm run db:push
   ```

4. **Run Development Server**
   ```bash
   pnpm run dev
   ```
   
   The API will be available at `http://localhost:5000`

5. **Build for Production**
   ```bash
   pnpm run build
   ```

6. **Run Production Server**
   ```bash
   pnpm start
   ```

## Deployment

This backend is configured for deployment on **Railway**.

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for detailed deployment instructions.

## Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **tRPC** - Type-safe API
- **Drizzle ORM** - Database ORM
- **MySQL** - Database
- **Cheerio** - Web scraping
- **ExcelJS** - Excel generation
- **Jose** - JWT authentication

## API Endpoints

- `POST /api/trpc/*` - tRPC API endpoints
- `GET /api/health` - Health check endpoint
- `POST /api/oauth/callback` - OAuth callback
