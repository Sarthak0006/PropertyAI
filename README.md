# 🏠 PropertyAI — Real Estate AI Search Platform

A **production-ready, scalable real estate search platform** featuring AI-powered natural language search, hybrid Elasticsearch queries, Redis caching, background job processing, and full observability.

## 🏗️ Architecture

```
Frontend (React + Vite + TailwindCSS)
 [Floating AI Chatbot + SSE Streaming]
          ↓
Backend API (Node.js + Express)
  [MongoDB for Chat History/Saved]
          ↓
    ┌─────┴─────┐
    ↓           ↓
AI Agent    Elasticsearch
(Python +    (Hybrid Search)
 FastAPI)       ↓
    ↓        Redis (Cache)
Gemini API     ↓
             BullMQ Workers
                ↓
           Prometheus + Grafana
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional) Gemini API key for AI search

### 1. Clone & Configure

```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY if available
```

### 2. Start All Services

```bash
docker-compose up --build -d
```

### 3. Verify

| Service       | URL                          |
|---------------|------------------------------|
| Frontend      | http://localhost:5173         |
| Backend API   | http://localhost:3001/api/v1  |
| AI Agent      | http://localhost:8000         |
| Elasticsearch | http://localhost:9200         |
| Prometheus    | http://localhost:9090         |
| Grafana       | http://localhost:3000         |

Grafana default login: `admin / admin`

## 📁 Project Structure

```
project-root/
├── frontend/          # React + Vite + TailwindCSS
├── backend/           # Node.js + Express (Clean Architecture)
├── ai-agent/          # Python + FastAPI + Gemini
├── worker-service/    # BullMQ background workers
├── search-indexer/    # Data ingestion pipeline
├── data/              # Property JSON dataset
├── infra/             # Prometheus & Grafana configs
├── docs/              # Full documentation
└── docker-compose.yml
```

## 🔍 Search Examples

**Natural Language (AI-powered):**
- `"3 bedroom apartments with gym"`
- `"houses bigger than 2000 sqft"`
- `"luxury villa with garage"`
- `"smart homes under 1000 sqft"`
- `"budget apartment in New York"`

**Filter API:**
```bash
curl "http://localhost:3001/api/v1/search?bedrooms=3&amenities=Gym&page=1&limit=10"
```

**Compare Properties:**
```bash
curl "http://localhost:3001/api/v1/properties/compare?ids=1,2,5"
```

**Similar Properties:**
```bash
curl "http://localhost:3001/api/v1/properties/1/similar"
```

**Suggestions:**
```bash
curl "http://localhost:3001/api/v1/suggestions?q=3%20bed"
```

## 🧠 AI Agent

The AI Agent converts natural language to structured filters using Google Gemini. Falls back to regex-based parsing if Gemini is unavailable.

**Example:**
```
Input:  "3 bedroom house with gym"
Output: { "bedrooms": 3, "amenities": ["Gym"], "property_type": "House" }
```

## ⚙️ Environment Variables

| Variable             | Description                  | Default                    |
|----------------------|------------------------------|----------------------------|
| `GEMINI_API_KEY`     | Google Gemini API key        | *(required for AI agent)*  |
| `ELASTICSEARCH_URL`  | Elasticsearch node URL       | `http://localhost:9200`    |
| `REDIS_URL`          | Redis connection string      | `redis://localhost:6379`   |
| `BACKEND_PORT`       | Backend server port          | `3001`                     |
| `AI_AGENT_URL`       | AI Agent service URL         | `http://localhost:8000`    |
| `VITE_API_URL`       | Frontend API base URL        | `/api/v1`                  |

## 🧪 Testing

```bash
# Backend tests (Jest)
cd backend && npm test

# AI Agent tests (PyTest)
cd ai-agent && pytest tests/ -v

# Frontend tests (Vitest)
cd frontend && npm test
```

## 📚 Documentation

See the [`docs/`](./docs/) folder for complete documentation:
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md)
- [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)
- [SEARCH_ARCHITECTURE.md](./docs/SEARCH_ARCHITECTURE.md)
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 📄 License

MIT
