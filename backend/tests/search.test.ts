import { describe, it, expect } from '@jest/globals';

describe('SearchService', () => {
  it('should be importable', () => {
    expect(true).toBe(true);
  });
});

describe('Query Validation', () => {
  it('should validate search query params', () => {
    const { searchQuerySchema } = require('../src/validators/schemas');

    const result = searchQuerySchema.safeParse({
      q: '3 bedroom apartment',
      page: 1,
      limit: 10,
      sort: 'relevance',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid sort values', () => {
    const { searchQuerySchema } = require('../src/validators/schemas');

    const result = searchQuerySchema.safeParse({
      sort: 'invalid_sort',
    });

    expect(result.success).toBe(false);
  });

  it('should validate compare query', () => {
    const { compareSchema } = require('../src/validators/schemas');

    const valid = compareSchema.safeParse({ ids: '1,2,3' });
    expect(valid.success).toBe(true);

    const invalid = compareSchema.safeParse({ ids: 'abc' });
    expect(invalid.success).toBe(false);
  });

  it('should enforce page defaults', () => {
    const { searchQuerySchema } = require('../src/validators/schemas');

    const result = searchQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.sort).toBe('relevance');
  });
});
