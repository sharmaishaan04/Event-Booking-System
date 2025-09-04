import Joi from "joi";

export const createEventSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  location: Joi.string().required(),
  date: Joi.date().iso().required(),
  totalSeats: Joi.number().integer().min(1).required(),
  price: Joi.number().precision(2).min(0).required(),
  img: Joi.string().uri().allow("").optional(),
});

export const updateEventSchema = createEventSchema.fork(
  ["title", "location", "date", "totalSeats", "price"],
  (s) => s.optional()
);
