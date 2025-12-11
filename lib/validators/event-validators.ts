import { z } from "zod";

// ===== CATEGORY VALIDATORS =====
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100),
  description: z.string().max(500).optional(),
  image: z.string().url("Invalid image URL").optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ===== SUBCATEGORY VALIDATORS =====
export const createSubCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Subcategory name must be at least 2 characters")
    .max(100),
  description: z.string().max(500).optional(),
});

export const updateSubCategorySchema = createSubCategorySchema.partial();

// ===== TICKET TYPE VALIDATORS =====
export const ticketTypeSchema = z.object({
  name: z.string().min(1, "Ticket type name is required").max(100),
  price: z.number().positive("Price must be positive"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  description: z.string().max(500).optional(),
});

export const createTicketTypeSchema = ticketTypeSchema;

export const updateTicketTypeSchema = ticketTypeSchema.partial();

// ===== EVENT VALIDATORS =====
export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(3000),
  coverImage: z
    .string()
    .refine(
      (val) => !val || val.startsWith("http"),
      "Cover image must be a valid URL or empty"
    )
    .optional(),
  profileImage: z
    .string()
    .refine(
      (val) => !val || val.startsWith("http"),
      "Profile image must be a valid URL or empty"
    )
    .optional(),
  categoryId: z.string().cuid("Invalid category ID"),
  subCategoryIds: z.array(z.string().cuid()).optional().default([]),
  location: z
    .string()
    .min(3, "Location must be at least 3 characters")
    .max(200),
  eventDate: z
    .string()
    .refine((val) => {
      if (!val) return true; // Allow empty
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, "Event date must be valid and in the future")
    .optional(),
  eventTime: z
    .string()
    .refine(
      (val) => !val || /^\d{2}:\d{2}$/.test(val),
      "Event time must be in HH:MM format or empty"
    )
    .optional(),
  duration: z.number().int().positive("Duration must be positive").optional(),
  ticketTypes: z.array(ticketTypeSchema).optional().default([]),
  status: z.enum(["DRAFT", "PENDING"]).default("DRAFT"),
});

export const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(3000).optional(),
  coverImage: z.string().url().optional(),
  profileImage: z.string().url().optional(),
  categoryId: z.string().cuid().optional(),
  subCategoryIds: z.array(z.string().cuid()).optional(),
  location: z.string().min(3).max(200).optional(),
  eventDate: z.coerce.date().optional(),
  eventTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  duration: z.number().int().positive().optional(),
  status: z
    .enum(["DRAFT", "PENDING", "APPROVED", "HOLD", "CANCELLED"])
    .optional(),
});

export const changeEventStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "APPROVED",
    "HOLD",
    "CANCELLED",
    "COMPLETED",
    "ARCHIVED",
  ]),
  reason: z.string().optional(),
});

export const bulkDeleteEventsSchema = z.object({
  eventIds: z.array(z.string().cuid()).min(1, "Select at least one event"),
});

// ===== PAGINATION VALIDATORS =====
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ===== EVENT FILTERS =====
export const eventFilterSchema = paginationSchema.extend({
  status: z
    .enum([
      "DRAFT",
      "PENDING",
      "APPROVED",
      "HOLD",
      "CANCELLED",
      "COMPLETED",
      "ARCHIVED",
    ])
    .optional(),
  categoryId: z.string().cuid().optional(),
  location: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sort: z.enum(["createdAt", "eventDate", "title"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ===== CATEGORY FILTERS =====
export const categoryFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// ===== SALES FILTERS =====
export const salesFilterSchema = paginationSchema.extend({
  eventId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// Type exports for TypeScript
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateSubCategoryInput = z.infer<typeof createSubCategorySchema>;
export type UpdateSubCategoryInput = z.infer<typeof updateSubCategorySchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ChangeEventStatusInput = z.infer<typeof changeEventStatusSchema>;
export type BulkDeleteEventsInput = z.infer<typeof bulkDeleteEventsSchema>;
export type TicketTypeInput = z.infer<typeof ticketTypeSchema>;
export type EventFilterInput = z.infer<typeof eventFilterSchema>;
export type CategoryFilterInput = z.infer<typeof categoryFilterSchema>;
export type SalesFilterInput = z.infer<typeof salesFilterSchema>;
