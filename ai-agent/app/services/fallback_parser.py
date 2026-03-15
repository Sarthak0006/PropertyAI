"""Rule-based fallback parser for when Gemini is unavailable."""
import re
import logging
from app.schemas import ParsedFilters

logger = logging.getLogger(__name__)

AMENITY_KEYWORDS = {
    "gym": "Gym",
    "fitness": "Fitness Center",
    "swimming pool": "Swimming Pool",
    "pool": "Swimming Pool",
    "parking": "Parking",
    "garage": "Garage",
    "garden": "Private Garden",
    "balcony": "Balcony",
    "security": "Security",
    "concierge": "24/7 Concierge",
    "laundry": "Laundry",
    "dock": "Private Dock",
    "bbq": "BBQ Area",
    "backyard": "Backyard",
    "pet friendly": "Pet Friendly",
    "home office": "Home Office",
    "rooftop": "Rooftop Terrace",
    "elevator": "Private Elevator",
    "beach": "Beach Access",
}

# PROPERTY_TYPES = {
#     "apartment": "Apartment",
#     "house": "House",
#     "villa": "Villa",
#     "condo": "Condo",
#     "penthouse": "Penthouse",
#     "studio": "Studio",
#     "townhouse": "Townhouse",
#     "duplex": "Duplex",
# }

SMART_KEYWORDS = {
    "smart home": "Smart Appliances",
    "smart appliances": "Smart Appliances",
    "smart security": "Smart Security",
    "smart lighting": "Smart Lighting",
    "voice control": "Voice Control",
}

ENERGY_KEYWORDS = {
    "solar": "Solar Panels",
    "energy efficient": "Energy Efficient Windows",
    "smart grid": "Smart Grid",
}


def parse_query_fallback(query: str) -> ParsedFilters:
    """Parse a natural language query using regex and keyword matching."""
    q = query.lower().strip()
    filters = ParsedFilters()

    # ── Bedrooms ───────────────────────────────────────
    bed_match = re.search(r"(\d+)\s*(?:bed(?:room)?s?|bhk|br)", q)
    if bed_match:
        filters.bedrooms = int(bed_match.group(1))

    # ── Bathrooms ──────────────────────────────────────
    bath_match = re.search(r"(\d+)\s*(?:bath(?:room)?s?|ba)", q)
    if bath_match:
        filters.bathrooms = int(bath_match.group(1))

    # ── Size ───────────────────────────────────────────
    size_over = re.search(r"(?:bigger|larger|over|above|more than|greater than)\s*(?:than\s*)?(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet)?", q)
    size_under = re.search(r"(?:under|below|less than|smaller than|up to)\s*(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet)?", q)
    if size_over:
        filters.min_size_sqft = int(size_over.group(1).replace(",", ""))
    if size_under:
        filters.max_size_sqft = int(size_under.group(1).replace(",", ""))

    if "small" in q and not filters.max_size_sqft:
        filters.max_size_sqft = 1000
    if ("large" in q or "big" in q or "spacious" in q) and not filters.min_size_sqft:
        filters.min_size_sqft = 2000

    # ── Price ──────────────────────────────────────────
    price_under = re.search(r"(?:under|below|less than|up to|max)\s*\$?([\d,]+k?)", q)
    price_over = re.search(r"(?:over|above|more than|min(?:imum)?)\s*\$?([\d,]+k?)", q)

    def parse_price(val: str) -> int:
        val = val.replace(",", "")
        if val.endswith("k"):
            return int(float(val[:-1]) * 1000)
        return int(val)

    if price_under:
        filters.max_price = parse_price(price_under.group(1))
    if price_over:
        filters.min_price = parse_price(price_over.group(1))

    if any(w in q for w in ["budget", "cheap", "affordable"]):
        filters.max_price = filters.max_price or 400000
    if any(w in q for w in ["luxury", "premium", "expensive", "high-end"]):
        filters.min_price = filters.min_price or 800000

    # # ── Property type ──────────────────────────────────
    # for keyword, ptype in PROPERTY_TYPES.items():
    #     if keyword in q:
    #         filters.property_type = ptype
    #         break

    # ── Amenities ──────────────────────────────────────
    for keyword, amenity in AMENITY_KEYWORDS.items():
        if keyword in q and amenity not in filters.amenities:
            filters.amenities.append(amenity)

    # ── Garage / Pool ──────────────────────────────────
    if "garage" in q:
        filters.has_garage = True
    if "pool" in q or "swimming pool" in q:
        filters.has_pool = True

    # ── Smart features ─────────────────────────────────
    for keyword, feature in SMART_KEYWORDS.items():
        if keyword in q and feature not in filters.smart_features:
            filters.smart_features.append(feature)

    # ── Energy features ────────────────────────────────
    for keyword, feature in ENERGY_KEYWORDS.items():
        if keyword in q and feature not in filters.energy_features:
            filters.energy_features.append(feature)

    # ── Location ───────────────────────────────────────
    loc_match = re.search(r"in\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z]{2})?)", query)
    if loc_match:
        filters.location = loc_match.group(1).strip()

    logger.info(f"Fallback parser extracted filters: {filters.model_dump(exclude_none=True, exclude_defaults=True)}")
    return filters
