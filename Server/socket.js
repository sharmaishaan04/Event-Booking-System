import { Server } from "socket.io";
import prisma from "./config/prisma.js";

let io = null;

// in-memory lock store
// Map<eventId, Map<lockId, { quantity, expiresAt: Date, ownerSocketId }>>
// locks = {
//   "7": { // eventId = 7
//     "lock123": { quantity: 2, expiresAt: 1693848293, ownerSocketId: "abcd" }
//   }
// }

const locks = new Map();

// configuration
const LOCK_TTL_MS = Number(process.env.SOCKET_LOCK_TTL_MS || 60000); // default 60s
const CLEANUP_INTERVAL_MS = Number(
  process.env.SOCKET_CLEANUP_INTERVAL_MS || 5000
);

//Counts how many seats are currently locked (not yet booked).
function getLockedCount(eventId) {
  const map = locks.get(String(eventId));
  if (!map) return 0;
  let total = 0;
  for (const v of map.values()) total += v.quantity;
  return total;
}

// Fetches event’s available seats from DB.
// Adjusts for temporary locks.
// Broadcasts an update to everyone in the same event room via "seat_update" event.
async function broadcastAvailability(eventId) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
    });
    if (!event) return;
    const locked = getLockedCount(eventId);
    const available = Math.max(0, event.availableSeats - locked);
    io.to(`event_${eventId}`).emit("seat_update", {
      eventId: Number(eventId),
      availableSeats: available,
      lockedSeats: locked,
      baseAvailableSeats: event.availableSeats,
    });
  } catch (err) {
    console.error("broadcastAvailability error", err);
  }
}

function scheduleCleanup() {
  setInterval(async () => {
    const now = Date.now();
    let changed = new Set();
    for (const [eventId, map] of locks.entries()) {
      for (const [lockId, lock] of map.entries()) {
        if (lock.expiresAt <= now) {
          map.delete(lockId);
          changed.add(eventId);
        }
      }
      if (map.size === 0) locks.delete(eventId);
    }
    // broadcast availability for changed events
    for (const ev of changed) {
      await broadcastAvailability(ev);
    }
  }, CLEANUP_INTERVAL_MS);
}

export function initSocket(server) {
  io = new Server(server, {
    path: "/socket.io",
    cors: { origin: true }, // adjust origin in production
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // join event rooms to receive updates
    socket.on("join_event_room", async ({ eventId }) => {
      if (!eventId) return;
      socket.join(`event_${eventId}`);
      // immediately send current availability
      await broadcastAvailability(eventId);
    });

    socket.on("leave_event_room", ({ eventId }) => {
      if (!eventId) return;
      socket.leave(`event_${eventId}`);
    });

    socket.on("lock_seats", async (payload, callback) => {
      try {
        const { eventId, lockId, quantity } = payload || {};
        if (!eventId || !lockId || !quantity) {
          return callback?.({ success: false, error: "Invalid payload" });
        }

        // fetch event's current availableSeats
        const event = await prisma.event.findUnique({
          where: { id: Number(eventId) },
        });
        if (!event)
          return callback?.({ success: false, error: "Event not found" });

        const lockedCount = getLockedCount(eventId);
        const effectiveAvailable = event.availableSeats - lockedCount;

        if (effectiveAvailable < quantity) {
          return callback?.({
            success: false,
            error: "Not enough seats available",
            availableSeats: effectiveAvailable,
          });
        }

        // add lock
        const key = String(eventId);
        if (!locks.has(key)) locks.set(key, new Map());
        const eventMap = locks.get(key);
        // If same lockId already exists, update expiry/quantity
        eventMap.set(String(lockId), {
          quantity: Number(quantity),
          expiresAt: Date.now() + LOCK_TTL_MS,
          ownerSocketId: socket.id,
        });

        // respond success
        callback?.({ success: true, lockId, expiresInMs: LOCK_TTL_MS });

        // broadcast updated availability to room
        await broadcastAvailability(eventId);
      } catch (err) {
        console.error("lock_seats error", err);
        callback?.({ success: false, error: "Internal error" });
      }
    });

    socket.on("refresh_lock", async (payload, callback) => {
      try {
        const { eventId, lockId } = payload || {};
        if (!eventId || !lockId)
          return callback?.({ success: false, error: "Invalid payload" });
        const map = locks.get(String(eventId));
        if (!map)
          return callback?.({ success: false, error: "Lock not found" });

        const lock = map.get(String(lockId));
        if (!lock)
          return callback?.({ success: false, error: "Lock not found" });
        if (lock.ownerSocketId !== socket.id)
          return callback?.({ success: false, error: "Not lock owner" });

        lock.expiresAt = Date.now() + LOCK_TTL_MS;
        map.set(String(lockId), lock);
        callback?.({ success: true, lockId, expiresInMs: LOCK_TTL_MS });
      } catch (err) {
        console.error("refresh_lock", err);
        callback?.({ success: false, error: "Internal error" });
      }
    });

    socket.on("release_lock", async (payload, callback) => {
      try {
        const { eventId, lockId } = payload || {};
        if (!eventId || !lockId)
          return callback?.({ success: false, error: "Invalid payload" });

        const map = locks.get(String(eventId));
        if (!map)
          return callback?.({ success: false, error: "Lock not found" });

        const lock = map.get(String(lockId));
        if (!lock)
          return callback?.({ success: false, error: "Lock not found" });
        if (lock.ownerSocketId !== socket.id)
          return callback?.({ success: false, error: "Not lock owner" });

        map.delete(String(lockId));
        if (map.size === 0) locks.delete(String(eventId));
        callback?.({ success: true, released: lockId });

        await broadcastAvailability(eventId);
      } catch (err) {
        console.error("release_lock", err);
        callback?.({ success: false, error: "Internal error" });
      }
    });

    socket.on("confirm_booking", async (payload, callback) => {
      try {
        const { eventId, lockId, bookingData } = payload || {};
        if (!eventId || !lockId || !bookingData)
          return callback?.({ success: false, error: "Invalid payload" });

        const map = locks.get(String(eventId));
        if (!map)
          return callback?.({ success: false, error: "Lock not found" });

        const lock = map.get(String(lockId));
        if (!lock)
          return callback?.({ success: false, error: "Lock not found" });
        if (lock.ownerSocketId !== socket.id)
          return callback?.({ success: false, error: "Not lock owner" });

        // ensure requested quantity matches lock quantity
        const qty = Number(bookingData.quantity);
        if (qty !== lock.quantity)
          return callback?.({
            success: false,
            error: "Quantity mismatch with lock",
          });

        // perform transaction to finalize booking and decrement availableSeats
        const result = await prisma.$transaction(async (tx) => {
          const ev = await tx.event.findUnique({
            where: { id: Number(eventId) },
          });
          if (!ev) throw new Error("Event not found");

          // compute currently locked count (excluding this lock)
          let lockedCount = 0;
          const mapCopy = locks.get(String(eventId));
          if (mapCopy) {
            for (const [k, v] of mapCopy.entries()) {
              if (String(k) === String(lockId)) continue;
              lockedCount += v.quantity;
            }
          }

          // check availability
          if (ev.availableSeats - lockedCount < qty) {
            throw new Error("Not enough seats available to confirm");
          }

          const newAvailable = ev.availableSeats - qty;

          const updatedEvent = await tx.event.update({
            where: { id: Number(eventId) },
            data: { availableSeats: newAvailable },
          });

          const totalAmount = Number(ev.price) * qty;

          const booking = await tx.booking.create({
            data: {
              eventId: Number(eventId),
              name: bookingData.name,
              email: bookingData.email,
              mobile: bookingData.mobile,
              quantity: qty,
              totalAmount: totalAmount,
              status: "CONFIRMED",
            },
          });

          return { booking, updatedEvent };
        });

        // remove the lock
        map.delete(String(lockId));
        if (map.size === 0) locks.delete(String(eventId));
        callback?.({ success: true, booking: result.booking });

        // broadcast availability
        await broadcastAvailability(eventId);
      } catch (err) {
        console.error("confirm_booking error", err);
        callback?.({ success: false, error: err.message || "Internal error" });
      }
    });

    socket.on("disconnect", async () => {
      const socketId = socket.id;
      let changed = new Set();
      for (const [eventId, map] of locks.entries()) {
        for (const [lockId, lock] of map.entries()) {
          if (lock.ownerSocketId === socketId) {
            map.delete(lockId);
            changed.add(eventId);
          }
        }
        if (map.size === 0) locks.delete(eventId);
      }
      for (const ev of changed) await broadcastAvailability(ev);
      console.log("Socket disconnected:", socket.id);
    });
  });

  scheduleCleanup();
  console.log("Socket.io initialized");
}
