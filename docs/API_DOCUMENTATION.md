# API Documentation

Base URL: `http://localhost:3001/api/v1`

## Health Check

```
GET /api/v1/health
→ { "status": "ok", "service": "backend", "version": "1.0.0" }
```

---

## Search

```
GET /api/v1/search
```

| Param         | Type    | Description                          |
|---------------|---------|--------------------------------------|
| `q`           | string  | Natural language or keyword query    |
| `bedrooms`    | number  | Filter by bedroom count              |
| `bathrooms`   | number  | Filter by bathroom count             |
| `min_size`    | number  | Minimum size in sqft                 |
| `max_size`    | number  | Maximum size in sqft                 |
| `min_price`   | number  | Minimum price                        |
| `max_price`   | number  | Maximum price                        |
| `amenities`   | string  | Comma-separated (e.g., `Gym,Pool`)   |
| `location`    | string  | City or state                        |
| `has_garage`  | boolean | Has garage                           |
| `has_pool`    | boolean | Has pool                             |
| `page`        | number  | Page number (default: 1)             |
| `limit`       | number  | Items per page (default: 10, max: 50)|
| `sort`        | string  | relevance/price_asc/price_desc/size_asc/size_desc/newest |

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "properties": [...],
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## Property Detail

```
GET /api/v1/properties/:id
→ { "success": true, "data": { ...property } }
```

---

## Compare Properties

```
GET /api/v1/properties/compare?ids=1,2,5
→ { "success": true, "data": { "properties": [...], "count": 3 } }
```

Max 5 properties per comparison.

---

## Similar Properties

```
GET /api/v1/properties/:id/similar
→ { "success": true, "data": [...properties] }
```

Uses Elasticsearch more_like_this query with attribute-based fallback.

---

## Suggestions / Autocomplete

```
GET /api/v1/suggestions?q=3 bed
→ {
    "success": true,
    "data": {
      "suggestions": ["3 bedroom apartment", "3 bedroom house with gym"],
      "recentSearches": ["luxury villa"],
      "popularSearches": ["2 bedroom condo"]
    }
  }
```

---

## Error Response Format

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "page", "message": "Expected number, received string" }
  ]
}
```
