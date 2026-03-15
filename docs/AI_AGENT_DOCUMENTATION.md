# AI Agent Documentation

## Overview

The AI Agent is a FastAPI microservice that converts natural language property queries into structured JSON filters using Google Gemini.

## Endpoint

```
POST /api/v1/parse-query
Body: { "query": "3 bedroom house with gym" }
Response: {
  "original_query": "3 bedroom house with gym",
  "filters": { "bedrooms": 3, "amenities": ["Gym"] },
  "confidence": 0.95,
  "method": "gemini"
}
```

## Parsing Pipeline

1. **Gemini (Primary)**: Sends structured extraction prompt → returns JSON
2. **Fallback (Regex)**: Rule-based parsing when Gemini is unavailable

## Supported Filters

| Filter          | NL Examples                              |
|-----------------|------------------------------------------|
| `bedrooms`      | "3 bedroom", "3 bhk", "3 bed"            |
| `bathrooms`     | "2 bathroom", "2 bath"                   |
| `min_size_sqft` | "bigger than 2000 sqft", "large"         |
| `max_size_sqft` | "under 1000 sqft", "small"               |
| `min_price`     | "luxury", "over $800k"                   |
| `max_price`     | "budget", "under $400k"                  |
| `amenities`     | "with gym", "with pool"                  |
| `has_garage`    | "with garage"                            |
| `has_pool`      | "with pool", "swimming pool"             |
| `smart_features`| "smart home", "voice control"            |
| `energy_features`| "solar", "energy efficient"             |

## Configuration

Set `GEMINI_API_KEY` in environment variables. If not set, the agent uses the fallback parser with ~0.6 confidence.
