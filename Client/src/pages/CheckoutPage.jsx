import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import API from "../api";
import { QRCodeCanvas } from "qrcode.react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socketRef = useSocket();
  const socket = socketRef.current;

  // initial state maybe passed from EventDetailsPage
  const initial = location.state ?? {};
  const [event, setEvent] = useState(initial.event ?? null);
  const [category, setCategory] = useState(
    initial.selectedCategory ?? initial.category ?? "regular"
  );
  const [quantity, setQuantity] = useState(initial.quantity ?? 1);
  const [totalPrice, setTotalPrice] = useState(initial.totalPrice ?? 0);

  // booking form
  const [name, setName] = useState("Guest User");
  const [email, setEmail] = useState("guest@example.com");
  const [mobile, setMobile] = useState("");

  // locking details
  const [lockInfo, setLockInfo] = useState(null); // { lockId, expiresInMs, quantity }
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const countdownRef = useRef(null);
  const refreshRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [confirming, setConfirming] = useState(false);

  // load event if not provided
  useEffect(() => {
    if (event) return;
    let mounted = true;
    API.get(`/events/${id}`)
      .then((res) => {
        if (!mounted) return;
        setEvent(res.data);
        // recalc totalPrice if not provided
        if (!initial.totalPrice) {
          const unit = Number(res.data.price) * (initial.unitMultiplier ?? 1);
          setTotalPrice((unit * (initial.quantity ?? 1)).toFixed(2));
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load event");
      });
    return () => (mounted = false);
  }, [id]);

  // When page mounts, request a lock automatically
  useEffect(() => {
    if (!socket || !event) return;
    // create a client-side lockId
    const lockId = cryptoRandomId();
    const qty = Number(quantity || 1);

    socket.emit(
      "lock_seats",
      { eventId: Number(id), lockId, quantity: qty },
      (res) => {
        if (!res?.success) {
          toast.error(res?.error || "Could not acquire seat lock");
          return;
        }
        // res.expiresInMs expected
        setLockInfo({
          lockId,
          expiresInMs: res.expiresInMs ?? 60000,
          quantity: qty,
        });
        setTimeLeftMs(res.expiresInMs ?? 60000);
        toast.success("Seats locked — complete checkout");
      }
    );

    return () => {
      // release lock on unmount if exists
      if (lockInfo?.lockId && socket) {
        socket.emit(
          "release_lock",
          { eventId: Number(id), lockId: lockInfo.lockId },
          () => {}
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, event]);

  // countdown and auto-refresh logic
  useEffect(() => {
    if (!lockInfo) return;

    // countdown tick
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeLeftMs((ms) => {
        if (ms <= 250) {
          clearInterval(countdownRef.current);
          // notify lock expired
          toast.error("Lock expired");
          return 0;
        }
        return ms - 250;
      });
    }, 250);

    // auto-refresh interval: every half TTL or 20s
    const refreshEvery = Math.min(
      20000,
      Math.max(5000, Math.floor(lockInfo.expiresInMs / 2))
    );
    clearInterval(refreshRef.current);
    refreshRef.current = setInterval(() => {
      if (!socket) return;
      socket.emit(
        "refresh_lock",
        { eventId: Number(id), lockId: lockInfo.lockId },
        (res) => {
          if (!res?.success) {
            toast.error("Failed to refresh lock");
            clearInterval(refreshRef.current);
            clearInterval(countdownRef.current);
            return;
          }
          // reset TTL
          setTimeLeftMs(res.expiresInMs ?? lockInfo.expiresInMs);
        }
      );
    }, refreshEvery);

    return () => {
      clearInterval(countdownRef.current);
      clearInterval(refreshRef.current);
    };
  }, [lockInfo, socket]);

  // subscribe to socket seat_update to update event availability
  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      if (payload.eventId !== Number(id)) return;
      setEvent((ev) =>
        ev ? { ...ev, availableSeats: payload.availableSeats } : ev
      );
    };
    socket.on("seat_update", handler);
    return () => socket.off("seat_update", handler);
  }, [socket]);

  // confirm booking via socket confirm_booking event
  async function handleConfirm() {
    if (!socket || !lockInfo) {
      toast.error("No lock present");
      return;
    }
    setConfirming(true);
    const bookingData = {
      name,
      email,
      mobile,
      quantity: Number(quantity),
    };

    socket.emit(
      "confirm_booking",
      { eventId: Number(id), lockId: lockInfo.lockId, bookingData },
      (res) => {
        setConfirming(false);
        if (!res?.success) {
          toast.error(res?.error || "Booking failed");
          return;
        }
        setBooking(res.booking);
        toast.success("Booking confirmed!");
        // pop confetti
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        // stop timers
        clearInterval(countdownRef.current);
        clearInterval(refreshRef.current);
      }
    );
  }

  function handleCancel() {
    if (socket && lockInfo?.lockId) {
      socket.emit(
        "release_lock",
        { eventId: Number(id), lockId: lockInfo.lockId },
        () => {}
      );
    }
    navigate("/events");
  }

  function downloadQR() {
    const idFor = booking?.id ?? lockInfo?.lockId ?? "ticket";
    try {
      const canvas = document.getElementById(`qr_${idFor}`);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket_${idFor}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    }
  }

  if (!event) {
    return <div className="p-8">Loading checkout...</div>;
  }

  // human friendly time left
  const timeLeftSec = Math.ceil((timeLeftMs || 0) / 1000);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl p-6 shadow">
        <h2 className="text-2xl font-bold">Checkout — {event.title}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {event.location} • {new Date(event.date).toLocaleString()}
        </p>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold">Your details</h3>
            <div className="mt-3 space-y-2">
              <input
                className="w-full p-2 border rounded"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
              <input
                className="w-full p-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
              <input
                className="w-full p-2 border rounded"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile"
              />
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-600">
                Category: <span className="font-semibold">{category}</span>
              </div>
              <div className="text-sm text-gray-600">
                Quantity: <span className="font-semibold">{quantity}</span>
              </div>
              <div className="text-lg font-bold mt-2">
                Total: ₹{Number(totalPrice).toFixed(2)}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-500">
                Lock status:{" "}
                {lockInfo ? `locked (${timeLeftSec}s left)` : "No lock"}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={!lockInfo || confirming}
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                >
                  {confirming ? "Confirming..." : "Confirm & Pay"}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // manual refresh
                    if (socket && lockInfo?.lockId) {
                      socket.emit(
                        "refresh_lock",
                        { eventId: Number(id), lockId: lockInfo.lockId },
                        (res) => {
                          if (!res?.success)
                            toast.error(res?.error || "Refresh failed");
                          else {
                            setTimeLeftMs(
                              res.expiresInMs ?? lockInfo.expiresInMs
                            );
                            toast.success("Lock refreshed");
                          }
                        }
                      );
                    }
                  }}
                  className="px-3 py-2 border rounded"
                >
                  Refresh Lock
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="bg-gray-100 rounded p-4 w-full">
              <div className="text-sm text-gray-600">Event</div>
              <div className="font-semibold">{event.title}</div>
              <div className="text-xs text-gray-500 mt-2">
                Seats left: {event.availableSeats}
              </div>
            </div>

            {booking ? (
              <div className="bg-white rounded shadow p-4 w-full text-center">
                <div className="text-sm text-gray-500">Booking confirmed</div>
                <div className="font-mono font-semibold my-2">
                  ID: {booking.id}
                </div>

                <div className="mx-auto">
                  <QRCodeCanvas
                    id={`qr_${booking.id}`}
                    value={JSON.stringify({
                      bookingId: booking.id,
                      eventId: booking.eventId,
                      name: booking.name,
                      quantity: booking.quantity,
                    })}
                    size={200}
                    includeMargin={true}
                  />
                </div>

                <div className="mt-3 flex justify-center gap-2">
                  <button
                    onClick={downloadQR}
                    className="px-4 py-2 bg-indigo-600 text-white rounded"
                  >
                    Download QR
                  </button>
                  <button
                    onClick={() => navigate("/events")}
                    className="px-4 py-2 border rounded"
                  >
                    Back to events
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded shadow p-4 w-full text-center">
                <div className="text-sm text-gray-500">Locked Seats</div>
                <div className="text-3xl font-bold mt-2">
                  {lockInfo?.quantity ?? "-"}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Complete within time or lock will expire
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// random id
function cryptoRandomId() {
  try {
    // fallback to uuid if not available
    if (crypto && crypto.getRandomValues) {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) {}
  // fallback
  return `lock_${Math.random().toString(36).slice(2, 10)}`;
}
