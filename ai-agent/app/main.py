"""Real Estate AI Agent – FastAPI Application."""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from app.schemas import QueryRequest, QueryResponse, HealthResponse, ParsedFilters
from app.services.gemini_service import GeminiService
from app.services.fallback_parser import parse_query_fallback

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# ── Prometheus metrics ─────────────────────────────
REQUEST_COUNT = Counter("ai_agent_requests_total", "Total requests", ["endpoint", "method"])
REQUEST_LATENCY = Histogram("ai_agent_request_duration_seconds", "Request latency", ["endpoint"])
PARSE_METHOD = Counter("ai_agent_parse_method_total", "Parsing method used", ["method"])

gemini_service: GeminiService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global gemini_service
    gemini_service = GeminiService()
    logger.info("AI Agent started")
    yield
    logger.info("AI Agent shutting down")


app = FastAPI(
    title="Real Estate AI Agent",
    description="Converts natural language property queries into structured search filters",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    REQUEST_COUNT.labels(endpoint="/health", method="GET").inc()
    return HealthResponse()


@app.post("/api/v1/parse-query", response_model=QueryResponse)
async def parse_query(request: QueryRequest):
    """Parse a natural language query into structured search filters."""
    REQUEST_COUNT.labels(endpoint="/api/v1/parse-query", method="POST").inc()
    start = time.time()

    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    filters: ParsedFilters | None = None
    embedding: list[float] | None = None
    method = "fallback"
    confidence = 0.6

    # Try Gemini first
    if gemini_service and gemini_service.is_available:
        # Fetch structured filters and embedding concurrently
        import asyncio
        filters, embedding = await asyncio.gather(
            gemini_service.parse_query(query),
            gemini_service.embed_query(query),
            return_exceptions=True
        )
        
        if isinstance(filters, Exception):
            logger.error(f"Gemini parse error: {filters}")
            filters = None
        if isinstance(embedding, Exception):
            logger.error(f"Gemini embed error: {embedding}")
            embedding = None

        if filters:
            method = "gemini"
            confidence = 0.95

    # Fallback to rule-based
    if filters is None:
        filters = parse_query_fallback(query)
        method = "fallback"
        confidence = 0.6

    PARSE_METHOD.labels(method=method).inc()
    REQUEST_LATENCY.labels(endpoint="/api/v1/parse-query").observe(time.time() - start)

    return QueryResponse(
        original_query=query,
        filters=filters,
        confidence=confidence,
        method=method,
        embedding=embedding,
    )

from fastapi.responses import StreamingResponse
from app.schemas import StreamChatRequest, IntentResponse, CompareRequest, CompareResponse

@app.post("/api/v1/compare", response_model=CompareResponse)
async def compare_properties(request: CompareRequest):
    """Generates an AI summary comparing multiple properties."""
    REQUEST_COUNT.labels(endpoint="/api/v1/compare", method="POST").inc()
    
    summary = "AI comparison is currently unavailable."
    if gemini_service and gemini_service.is_available:
        summary = await gemini_service.compare_properties(request.properties)
        
    return CompareResponse(ai_summary=summary)

@app.post("/api/v1/chat/stream")
async def stream_chat(request: StreamChatRequest):
    """Guardrails the intent and then streams a conversational summary of top properties."""
    REQUEST_COUNT.labels(endpoint="/api/v1/chat/stream", method="POST").inc()

    # 1. Guardrail: Classify Intent
    # intent: dict = {}
    # if gemini_service and gemini_service.is_available:
        # intent = await gemini_service.classify_intent(request.query)
    
    # is_related = intent.get("is_real_estate_related", True)

    async def stream_generator():
        # if not is_related:
        #     yield "data: {\"text\": \"I'm your real estate assistant! Let's stay focused on finding homes, apartments, or property details. How can I help you with your property search?\"}\n\n"
        #     yield "data: [DONE]\n\n"
        #     return
            
        if gemini_service and gemini_service.is_available:
            async for chunk in gemini_service.stream_chat_summary(request.query, request.properties):
                yield chunk
        else:
            yield "data: {\"text\": \"I'm currently offline, but please check the properties matching your criteria below!\"}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
