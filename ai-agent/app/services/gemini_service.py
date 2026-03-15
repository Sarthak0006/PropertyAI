"""Gemini-based natural language query parser using Structured Output."""
import json
import os
import logging
from typing import Optional

import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from app.schemas import ParsedFilters

logger = logging.getLogger(__name__)

# ── Prompt (no need to describe JSON format — the schema handles that) ───
EXTRACTION_PROMPT = """You are a real estate search query parser. Extract structured search filters from the user's natural language query.

Rules:
- "under X sqft" → max_size_sqft = X
- "bigger than X sqft" or "over X sqft" → min_size_sqft = X
- "small" → max_size_sqft = 1000
- "large" or "big" → min_size_sqft = 2000
- "budget" or "cheap" or "affordable" → max_price = 400000
- "luxury" or "premium" or "expensive" → min_price = 800000
- "smart home" → smart_features = ["Smart Appliances"]
- "garage" → has_garage = true
- "pool" or "swimming pool" → has_pool = true
- Amenity names should be Title Case (e.g. "Gym", "Swimming Pool", "Parking")

User query: "{query}"
"""

# ── JSON Schema for Structured Output ────────────────────────────────────
# Forces the model to respond with valid JSON conforming to this schema.
RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "bedrooms": {
            "type": "integer",
            "description": "Number of bedrooms",
            "nullable": True,
        },
        "bathrooms": {
            "type": "integer",
            "description": "Number of bathrooms",
            "nullable": True,
        },
        "min_size_sqft": {
            "type": "integer",
            "description": "Minimum size in square feet",
            "nullable": True,
        },
        "max_size_sqft": {
            "type": "integer",
            "description": "Maximum size in square feet",
            "nullable": True,
        },
        "min_price": {
            "type": "integer",
            "description": "Minimum price in USD",
            "nullable": True,
        },
        "max_price": {
            "type": "integer",
            "description": "Maximum price in USD",
            "nullable": True,
        },
        "amenities": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Required amenities (Title Case)",
        },
        "location": {
            "type": "string",
            "description": "Location filter (city, state)",
            "nullable": True,
        },
        "has_garage": {
            "type": "boolean",
            "description": "Whether the property must have a garage",
            "nullable": True,
        },
        "has_pool": {
            "type": "boolean",
            "description": "Whether the property must have a pool",
            "nullable": True,
        },
        "smart_features": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Smart home features",
        },
        "energy_features": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Energy efficiency features",
        },
        "keywords": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Additional search keywords",
        },
    },
}


class GeminiService:
    """Service for parsing queries using Gemini Structured Output."""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY", "")
        self._available = bool(api_key)
        if self._available:
            genai.configure(api_key=api_key)
            # Configure the model with structured JSON output
            self._model = genai.GenerativeModel(
                model_name="gemini-3-flash-preview",
                generation_config=GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=RESPONSE_SCHEMA,
                ),
            )
            logger.info("Gemini service initialized with Structured Output")
        else:
            logger.warning("GEMINI_API_KEY not set – Gemini service unavailable")

    @property
    def is_available(self) -> bool:
        return self._available

    async def compare_properties(self, properties: list[dict]):
        """Generates a conversational AI comparison of properties."""
        if not self._available:
            return "AI comparison is currently offline."
        try:
            prompt = f"Write a concise, conversational paragraph (max 4 sentences) comparing these properties and highlighting their pros and cons. Don't use markdown asterisks. Properties: {json.dumps(properties)}"
            model = genai.GenerativeModel("gemini-3-flash-preview")
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini comparison error: {e}")
            return "Unable to generate AI comparison at this time."

    async def parse_query(self, query: str) -> Optional[ParsedFilters]:
        """Parse a natural language query into structured filters using Gemini Structured Output."""
        if not self._available:
            return None

        try:
            prompt = EXTRACTION_PROMPT.format(query=query)

            # Gemini returns guaranteed-valid JSON matching RESPONSE_SCHEMA
            response = self._model.generate_content(prompt)
            data = json.loads(response.text)

            return ParsedFilters(**data)

        except Exception as e:
            logger.error(f"Gemini Structured Output error: {e}")
            return None

    async def embed_query(self, query: str) -> Optional[list[float]]:
        """Generate a 3072-dimensional dense vector for a given query."""
        if not self._available:
            return None
        
        try:
            # We use text-embedding-004 which generates 3072 dimensional vectors by default
            result = genai.embed_content(
                model="gemini-embedding-001",
                content=query,
                task_type="retrieval_query",
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Gemini embedding error: {e}")
            return None

    async def classify_intent(self, query: str):
        """Guardrail to classify if the query is real-estate related."""
        if not self._available:
            return {"is_real_estate_related": True}
        try:
            prompt = f"Determine if the following query is related to real estate, homes, apartments, properties, moving, or property comparison. Query: '{query}'"
            schema = {
                "type": "object",
                "properties": {
                    "is_real_estate_related": {"type": "boolean"},
                    "reason": {"type": "string"}
                }
            }
            model = genai.GenerativeModel(
                model_name="gemini-3-flash-preview",
                generation_config=GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
            response = model.generate_content(prompt)
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Intent classification error: {e}")
            return {"is_real_estate_related": True}

    # async def stream_chat_summary(self, query: str, properties: list[dict]):
    #     """Generates a conversational summary of top properties as an SSE stream."""
    #     if not self._available:
    #         yield "data: {\"text\": \"I'm sorry, I'm offline right now.\"}\n\n"
    #         yield "data: [DONE]\n\n"
    #         return
            
    #     try:
    #         print("Query:", query)
    #         print("Properties:", properties)
    #         prompt = f"The user asked: '{query}'. Here are the top properties I found matching their intent: {json.dumps(properties)}. Write a concise, conversational paragraph (max 3 sentences) summarizing these options and recommending checking them out in the grid in right Side. Do not use markdown like asterisks or bolding, just plain text."
    #         model = genai.GenerativeModel("gemini-3-flash-preview")
    #         response = model.generate_content(prompt, stream=True)
            
    #         for chunk in response:
    #             if chunk.text:
    #                 payload = json.dumps({"text": chunk.text})
    #                 yield f"data: {payload}\n\n"
            
    #     except Exception as e:
    #         logger.error(f"Gemini streaming error: {e}")
    #         yield "data: {\"text\": \"Quota limit exceeded for the AI summarization. However, you can still view the matching properties in right panel.\"}\n\n"
            
    #     finally:
    #         yield "data: [DONE]\n\n"

    async def stream_chat_summary(self, query: str, properties: list[dict]):
        """Stream a short conversational summary of retrieved properties."""

        if not self._available:
            yield 'data: {"text":"AI service is currently unavailable."}\n\n'
            yield "data: [DONE]\n\n"
            return

        try:
            print("Query:", query)

            # Reduce token usage by keeping only useful fields
            compact_props = [
                {
                    "title": p.get("title"),
                    "location": p.get("location"),
                    "price": p.get("price"),
                    "bedrooms": p.get("bedrooms"),
                    "amenities": p.get("amenities", [])[:3]
                }
                for p in properties[:1]  # only top 1
            ]

            props_text = json.dumps(compact_props, separators=(",", ":"))

            prompt = f"""
            User query: {query}

            Properties found:
            {props_text}

            Write a friendly conversational summary.
            Encourage the user to check the property cards on the right side.
            Plain text only.
            """

            # Reuse model if possible (better to initialize in __init__)
            model = genai.GenerativeModel("gemini-3-flash-preview")

            response = model.generate_content(
                prompt,
                stream=True,
                generation_config={
                    "temperature": 0.4,
                    # "max_output_tokens": 120
                }
            )

            for chunk in response:
                text = getattr(chunk, "text", None)
                if not text:
                    continue

                payload = json.dumps({"text": text})
                yield f"data: {payload}\n\n"

        except Exception as e:
            logger.error(f"Gemini streaming error: {e}")

            yield (
                'data: {"text":"AI summary unavailable due to quota limits. '
                'You can still explore the matching properties in the right panel."}\n\n'
            )

        finally:
            yield "data: [DONE]\n\n"
