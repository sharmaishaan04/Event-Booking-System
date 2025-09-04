import Joi from "joi";

export const createBookingSchema = Joi.object({
  eventId: Joi.number().integer().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});
