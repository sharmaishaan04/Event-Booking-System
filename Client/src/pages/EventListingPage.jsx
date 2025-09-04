import React, { useEffect, useState, useMemo } from "react";
import API from "../api";
import useSocket from "../hooks/useSocket";
import EventCard from "../components/EventCard";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function EventListingPage() {
  const user = useAuth();
  const socketRef = useSocket();
  const socket = socketRef.current;
  const [events, setEvents] = useState([]);
  const [q, setQ] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await API.get("/events");
        const data = res.data?.data ?? res.data ?? [];
        if (mounted) setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  // socket subscription: update specific event's availableSeats & lockedSeats
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    const handler = (payload) => {
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.id === payload.eventId) {
            return {
              ...ev,
              availableSeats: payload.availableSeats ?? ev.availableSeats,
              lockedSeats: payload.lockedSeats ?? ev.lockedSeats ?? 0,
            };
          }
          return ev;
        })
      );
    };
    s.on("seat_update", handler);
    return () => s.off("seat_update", handler);
  }, [socketRef]);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      const matchesQ =
        !q ||
        ev.title?.toLowerCase().includes(q.toLowerCase()) ||
        ev.description?.toLowerCase().includes(q.toLowerCase());
      const matchesLocation =
        !locationFilter ||
        ev.location?.toLowerCase().includes(locationFilter.toLowerCase());
      const matchesDate =
        !dateFilter ||
        new Date(ev.date).toISOString().split("T")[0] === dateFilter;
      return matchesQ && matchesLocation && matchesDate;
    });
  }, [events, q, locationFilter, dateFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <header className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Events</h1>
          <p className="text-sm text-gray-600">
            Discover and book events near you
          </p>
        </div>

        <div className="space-x-2">
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
            <Link to="/">Home</Link>
          </button>

          {user?.role === "admin" && (
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
              <Link to={"/admin/dashboard"}> Admin Dashboard</Link>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto mb-8 bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or description"
            className="flex-1 min-w-[200px] p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Location"
            className="p-2 border rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            type="date"
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setQ("");
              setLocationFilter("");
              setDateFilter("");
            }}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          >
            Reset
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((ev) => (
          <EventCard key={ev.id} event={ev} socketRef={socketRef} />
        ))}
      </main>

      {filtered.length === 0 && (
        <div className="max-w-6xl mx-auto mt-12 text-center text-gray-600">
          <p className="text-lg">No events found.</p>
        </div>
      )}
    </div>
  );
}
