# Observability

## Stack

- **Prometheus** — Metrics collection (port 9090)
- **Grafana** — Dashboards (port 3000, login: admin/admin)

## Metrics Collected

### Backend (Node.js)
| Metric                          | Type      | Description              |
|---------------------------------|-----------|--------------------------|
| `http_requests_total`           | Counter   | Total HTTP requests       |
| `http_request_duration_seconds` | Histogram | Request latency           |
| `search_latency_seconds`        | Histogram | ES search latency         |
| `cache_hits_total`              | Counter   | Cache hit count           |
| `cache_misses_total`            | Counter   | Cache miss count          |

### AI Agent (Python)
| Metric                              | Type      | Description            |
|--------------------------------------|-----------|------------------------|
| `ai_agent_requests_total`            | Counter   | Total agent requests   |
| `ai_agent_request_duration_seconds`  | Histogram | Agent latency          |
| `ai_agent_parse_method_total`        | Counter   | Gemini vs fallback     |

## Grafana Dashboard

Pre-provisioned dashboard at `infra/grafana/provisioning/dashboards/json/api-dashboard.json` with panels:
- Request rate
- Request latency (p95)
- Search latency (p95)
- Cache hit/miss rate
- Error rate
- AI parse method distribution
