"""Pydantic schemas for the AI Agent API."""
from pydantic import BaseModel, Field
from typing import Optional


class QueryRequest(BaseModel):
    """Request body for query parsing."""
    query: str = Field(..., min_length=1, max_length=500, description="Natural language search query")


class ParsedFilters(BaseModel):
    """Structured filters parsed from a natural language query."""
    bedrooms: Optional[int] = Field(None, ge=0, le=20, description="Number of bedrooms")
    bathrooms: Optional[int] = Field(None, ge=0, le=20, description="Number of bathrooms")
    min_size_sqft: Optional[int] = Field(None, ge=0, description="Minimum size in square feet")
    max_size_sqft: Optional[int] = Field(None, ge=0, description="Maximum size in square feet")
    min_price: Optional[int] = Field(None, ge=0, description="Minimum price")
    max_price: Optional[int] = Field(None, ge=0, description="Maximum price")
    amenities: list[str] = Field(default_factory=list, description="Required amenities")
    # property_type: Optional[str] = Field(None, description="Property type filter")
    location: Optional[str] = Field(None, description="Location filter")
    has_garage: Optional[bool] = Field(None, description="Has garage")
    has_pool: Optional[bool] = Field(None, description="Has pool")
    smart_features: list[str] = Field(default_factory=list, description="Smart home features")
    energy_features: list[str] = Field(default_factory=list, description="Energy features")
    keywords: list[str] = Field(default_factory=list, description="Additional search keywords")


class QueryResponse(BaseModel):
    """Response from the query parsing endpoint."""
    original_query: str
    filters: ParsedFilters
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score")
    method: str = Field(description="Method used: 'gemini' or 'fallback'")
    embedding: list[float] | None = Field(None, description="3072-dimensional text embedding for hybrid search")


class StreamChatRequest(BaseModel):
    query: str
    properties: list[dict]

class CompareRequest(BaseModel):
    properties: list[dict]

class CompareResponse(BaseModel):
    ai_summary: str

class IntentResponse(BaseModel):
    is_real_estate_related: bool
    reason: str | None = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    service: str = "ai-agent"
    version: str = "1.0.0"
