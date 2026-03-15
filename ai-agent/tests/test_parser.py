"""Tests for the AI Agent query parser."""
import pytest
from app.services.fallback_parser import parse_query_fallback


class TestFallbackParser:
    """Tests for the regex/rule-based fallback parser."""

    def test_parse_bedrooms(self):
        result = parse_query_fallback("3 bedroom apartment")
        assert result.bedrooms == 3

    def test_parse_bhk(self):
        result = parse_query_fallback("2 bhk condo")
        assert result.bedrooms == 2

    def test_parse_bathrooms(self):
        result = parse_query_fallback("2 bathroom house")
        assert result.bathrooms == 2

    def test_parse_amenity_gym(self):
        result = parse_query_fallback("apartment with gym")
        assert "Gym" in result.amenities

    def test_parse_amenity_pool(self):
        result = parse_query_fallback("house with swimming pool")
        assert "Swimming Pool" in result.amenities
        assert result.has_pool is True

    def test_parse_size_over(self):
        result = parse_query_fallback("houses bigger than 2000 sqft")
        assert result.min_size_sqft == 2000

    def test_parse_size_under(self):
        result = parse_query_fallback("small apartments under 1000 sqft")
        assert result.max_size_sqft == 1000

    def test_parse_small_keyword(self):
        result = parse_query_fallback("small apartment")
        assert result.max_size_sqft == 1000

    def test_parse_large_keyword(self):
        result = parse_query_fallback("large house")
        assert result.min_size_sqft == 2000

    def test_parse_budget(self):
        result = parse_query_fallback("budget apartment")
        assert result.max_price == 400000

    def test_parse_luxury(self):
        result = parse_query_fallback("luxury villa")
        assert result.min_price == 800000
        assert result.property_type == "Villa"

    def test_parse_property_type(self):
        result = parse_query_fallback("modern condo with balcony")
        assert result.property_type == "Condo"
        assert "Balcony" in result.amenities

    def test_parse_garage(self):
        result = parse_query_fallback("house with garage")
        assert result.has_garage is True

    def test_parse_smart_home(self):
        result = parse_query_fallback("smart home with voice control")
        assert "Smart Appliances" in result.smart_features
        assert "Voice Control" in result.smart_features

    def test_parse_energy_features(self):
        result = parse_query_fallback("energy efficient house with solar")
        assert len(result.energy_features) >= 1

    def test_parse_complex_query(self):
        result = parse_query_fallback("3 bedroom house with gym bigger than 2000 sqft")
        assert result.bedrooms == 3
        assert "Gym" in result.amenities
        assert result.min_size_sqft == 2000
        assert result.property_type == "House"

    def test_empty_query(self):
        result = parse_query_fallback("")
        assert result.bedrooms is None
        assert result.bathrooms is None
        assert len(result.amenities) == 0
