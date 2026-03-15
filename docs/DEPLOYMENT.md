# Deployment Guide

This guide outlines how to deploy the PropertyAI Real Estate platform to production.

## 1. Node.js Backend & Python AI Agent (Render)

We recommend deploying the API services on [Render](https://render.com) using Web Services.

### Backend Setup
1. Create a new "Web Service" in Render.
2. Connect your GitHub repository.
3. Set the Root Directory to `backend/`.
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas URI.
   - `REDIS_URL`: Your managed Redis URL (e.g., Upstash or Render Redis).
   - `ELASTICSEARCH_URL`: Your managed ES URL (e.g., Elastic Cloud).
   - `AI_AGENT_URL`: The URL of your deployed AI Agent service.
   - `PORT`: `3001`

### AI Agent Setup
1. Create a new "Web Service" in Render.
2. Set Root Directory to `ai-agent/`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. Environment Variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key.

## 2. React Frontend (Vercel)

Deploy the frontend onto [Vercel](https://vercel.com) for edge CDN delivery.

1. Connect your GitHub repository to Vercel.
2. Set the Root Directory to `frontend/`.
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL`: Your deployed Backend URL (e.g., `https://propertyai-api.onrender.com/api/v1`).

## 3. Databases

### MongoDB
Use **MongoDB Atlas** for a highly available, managed database. Provide the connection string (`mongodb+srv://...`) to the Backend `MONGODB_URI`.

### Elasticsearch
Use **Elastic Cloud** for managed Elasticsearch. Configure the connection URL in the backend environment variables.

### Redis
Use **Upstash** or **Render Redis** to handle the BullMQ message queue and semantic caching.

## 4. Environment Checklist

Make sure you've configured these critical secrets in production before launch:
* [ ] `GEMINI_API_KEY`
* [ ] `MONGODB_URI`
* [ ] `ELASTICSEARCH_URL`
* [ ] `REDIS_URL`
* [ ] `VITE_API_URL`
