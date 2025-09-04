import prisma from "../config/prisma.js";
import {
  createEventSchema,
  updateEventSchema,
} from "../validators/events.validator.js";

export async function createEvent(req, res, next) {
  try {
    const { error, value } = createEventSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const event = await prisma.event.create({
      data: {
        title: value.title,
        description: value.description,
        location: value.location,
        date: new Date(value.date),
        totalSeats: value.totalSeats,
        availableSeats: value.totalSeats,
        price: value.price,
        img: value.img || "",
      },
    });
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

export async function listEvents(req, res, next) {
  try {
    const { q, location, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const where = {};
    if (q)
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: "asc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.event.count({ where });

    res.json({
      meta: { total, page: Number(page), limit: Number(limit) },
      data: events,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEvent(req, res, next) {
  try {
    const id = Number(req.params.id);
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { error, value } = updateEventSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Event not found" });

    let availableSeats = existing.availableSeats;
    if (value.totalSeats !== undefined) {
      const delta = value.totalSeats - existing.totalSeats;
      availableSeats = existing.availableSeats + delta;
      if (availableSeats < 0) availableSeats = 0;
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: value.title ?? undefined,
        description: value.description ?? undefined,
        location: value.location ?? undefined,
        date: value.date ? new Date(value.date) : undefined,
        totalSeats: value.totalSeats ?? undefined,
        availableSeats,
        price: value.price ?? undefined,
        img: value.img ?? undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const id = Number(req.params.id);
    await prisma.event.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
