import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().max(500).optional(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  bathrooms: z.coerce.number().int().min(0).max(20).optional(),
  min_size: z.coerce.number().int().min(0).optional(),
  max_size: z.coerce.number().int().min(0).optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  amenities: z.string().optional(), // comma-separated
  // property_type: z.string().optional(),
  location: z.string().optional(),
  has_garage: z.coerce.boolean().optional(),
  has_pool: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'size_asc', 'size_desc', 'newest']).default('relevance'),
});

export const compareSchema = z.object({
  ids: z.string().min(1).refine(
    (val) => val.split(',').every((id) => !isNaN(parseInt(id, 10))),
    { message: 'ids must be comma-separated integers' }
  ),
});

export const suggestionSchema = z.object({
  q: z.string().min(1).max(200),
});

export const propertyIdSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type CompareQuery = z.infer<typeof compareSchema>;
export type SuggestionQuery = z.infer<typeof suggestionSchema>;
