import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Edit, Trash } from "lucide-react";
import API from "../../api";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    totalSeats: 0,
    price: 0,
    img: "",
  });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("adminToken");
  if (!token) navigate("/admin/login");

  const fetchEvents = async () => {
    const res = await API.get("/events");
    setEvents(res.data.data || []);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/events/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await API.post("/events", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setForm({
        title: "",
        description: "",
        location: "",
        date: "",
        totalSeats: 0,
        price: 0,
        img: "",
      });
      setEditingId(null);
      fetchEvents();
      editingId
        ? alert("Successfully edited event")
        : alert("Successfully created event");
    } catch (err) {
      alert("Error saving event");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await API.delete(`/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(alert("successfully deleted event"))
      .catch((err) => {
        alert(err);
      });

    fetchEvents();
  };

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <h1 className="text-4xl font-extrabold mb-12 text-gray-800 text-center tracking-tight">
        Admin Dashboard
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-3xl shadow-2xl mb-12 grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Event Title</label>
          <input
            type="text"
            placeholder="Enter new title for the Event"
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Location</label>
          <input
            type="text"
            placeholder="Enter new location"
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Date & Time</label>
          <input
            type="datetime-local"
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Total Seats</label>
          <input
            type="number"
            placeholder="Enter total seats"
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.totalSeats}
            onChange={(e) =>
              setForm({ ...form, totalSeats: parseInt(e.target.value) })
            }
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Price</label>
          <input
            type="number"
            placeholder="Enter price"
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: parseFloat(e.target.value) })
            }
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Image URL</label>
          <input
            type="text"
            placeholder="Enter image URL"
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.img}
            onChange={(e) => setForm({ ...form, img: e.target.value })}
          />
        </div>

        <div className="flex flex-col col-span-2">
          <label className="mb-1 font-medium text-gray-700">Description</label>
          <textarea
            placeholder="Enter description"
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <button
          type="submit"
          className="col-span-2 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
        >
          {editingId ? (
            <>
              <Edit size={18} /> Update Event
            </>
          ) : (
            <>
              <Plus size={18} /> Add Event
            </>
          )}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.isArray(events) &&
          events.map((ev) => (
            <motion.div
              key={ev.id}
              className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-transform transform hover:-translate-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <img
                src={ev.img || "https://via.placeholder.com/400x200"}
                alt={ev.title}
                className="w-full h-52 object-cover"
              />
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 truncate">
                  {ev.title}
                </h2>
                <p className="text-gray-600 mb-1">{ev.location}</p>
                <p className="text-sm text-gray-500">
                  {new Date(ev.date).toLocaleString()}
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 justify-center shadow-md transition"
                    onClick={() => {
                      setForm({
                        title: ev.title,
                        description: ev.description,
                        location: ev.location,
                        date: new Date(ev.date).toISOString().slice(0, 16),
                        totalSeats: ev.totalSeats,
                        price: ev.price,
                        img: ev.img,
                      });
                      setEditingId(ev.id);
                    }}
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center gap-2 justify-center shadow-md transition"
                    onClick={() => handleDelete(ev.id)}
                  >
                    <Trash size={16} /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
