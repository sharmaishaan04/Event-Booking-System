import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function EventCard({ event }) {
  const available = event.availableSeats ?? 0;
  const locked = event.lockedSeats ?? 0;

  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.01 }}
      className="bg-white rounded-2xl p-5 shadow-md transition"
    >
      <div className="h-44 w-full overflow-hidden rounded-xl bg-gray-100">
        {event.img ? (
          <img
            src={event.img}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            alt={event.title}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      <h3 className="mt-4 text-xl font-bold text-gray-800 line-clamp-1">
        {event.title}
      </h3>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
        {event.description}
      </p>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="space-y-1 text-gray-500">
          <div>📍 {event.location}</div>
          <div>📅 {new Date(event.date).toLocaleString()}</div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500">Price</div>
          <div className="text-lg font-semibold text-indigo-600">
            ₹{Number(event.price).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={`px-3 py-1 text-xs rounded-full font-medium ${
            available > 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {available > 0 ? `${available} seats left` : "Sold Out"}
        </span>
        <span className="text-xs text-gray-500">Locked: {locked}</span>
      </div>

      <div className="mt-5">
        <Link
          to={`/events/${event.id}`}
          className="block w-full px-4 py-2 bg-indigo-600 text-white font-medium text-center rounded-lg hover:bg-indigo-700 transition"
        >
          View Details
        </Link>
      </div>
    </motion.article>
  );
}
