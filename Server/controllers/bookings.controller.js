import prisma from "../config/prisma.js";
import { createBookingSchema } from "../validators/bookings.validator.js";
import Decimal from "decimal.js";

export async function createBooking(req, res, next) {
  const payload = req.body;
  const { error, value } = createBookingSchema.validate(payload);
  if (error) return res.status(400).json({ error: error.message });

  const eventId = value.eventId;
  const quantity = value.quantity;

  try {
    // transaction to avoid race condition
    const result = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({ where: { id: eventId } });
        if (!event) throw { status: 404, message: "Event not found" };

        if (event.availableSeats < quantity) {
          throw { status: 400, message: "Not enough seats available" };
        }

        const newAvailable = event.availableSeats - quantity;

        const updatedEvent = await tx.event.update({
          where: { id: eventId },
          data: { availableSeats: newAvailable },
        });

        const totalAmount = new Decimal(event.price.toString())
          .mul(quantity)
          .toFixed(2);

        const booking = await tx.booking.create({
          data: {
            eventId: eventId,
            name: value.name,
            email: value.email,
            mobile: value.mobile,
            quantity: quantity,
            totalAmount: totalAmount,
            status: "CONFIRMED",
          },
        });

        return { booking, event: updatedEvent };
      },
      { timeout: 5000 }
    );

    res.status(201).json(result.booking);
  } catch (err) {
    if (err?.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}
