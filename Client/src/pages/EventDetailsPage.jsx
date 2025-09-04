// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import API from "../api";
// import { motion } from "framer-motion";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// const CATEGORY_INFO = [
//   { id: "regular", label: "Regular", multiplier: 1, desc: "Standard seating" },
//   {
//     id: "vip",
//     label: "VIP",
//     multiplier: 1.5,
//     desc: "Better view, limited seats",
//   },
//   { id: "vvip", label: "VVIP", multiplier: 2, desc: "Front row & perks" },
// ];

// export async function getLatLngFromAddress(address) {
//   const res = await fetch(
//     `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
//       address
//     )}`
//   );
//   const data = await res.json();
//   if (data.length > 0) {
//     return {
//       lat: parseFloat(data[0].lat),
//       lng: parseFloat(data[0].lon),
//     };
//   } else {
//     throw new Error("Location not found");
//   }
// }

// export default function EventDetailsPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [event, setEvent] = useState(null);
//   const [category, setCategory] = useState("regular");
//   const [quantity, setQuantity] = useState(1);
//   const [center, setCenter] = useState(null);

//   useEffect(() => {
//     let mounted = true;
//     async function load() {
//       try {
//         const res = await API.get(`/events/${id}`);
//         if (!mounted) return;
//         setEvent(res.data);
//         if (res.data.location) {
//           getLatLngFromAddress(res.data.location)
//             .then((coords) => {
//               if (mounted) setCenter(coords);
//             })
//             .catch((err) => {
//               console.error(err);
//               // fallback to Mumbai if geocoding fails
//               if (mounted) setCenter({ lat: 19.076, lng: 72.8777 });
//             });
//         }
//       } catch (err) {
//         console.error("Failed to fetch event", err);
//       }
//     }
//     load();

//     return () => (mounted = false);
//   }, [id]);

//   if (!event) {
//     return <div className="p-8">Loading...</div>;
//   }

//   // total price calculation (dynamic pricing by category)
//   const multiplier =
//     CATEGORY_INFO.find((c) => c.id === category)?.multiplier ?? 1;
//   const totalPrice = (Number(event.price) * multiplier * quantity).toFixed(2);

//   function handleBookNow() {
//     // navigate to checkout page and pass selection via location.state
//     navigate(`/checkout/${event.id}`, {
//       state: {
//         selectedCategory: category,
//         quantity,
//         unitMultiplier: multiplier,
//         totalPrice,
//         event,
//       },
//     });
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <motion.div
//         className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6"
//         initial={{ y: 8, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//       >
//         <div className="grid md:grid-cols-3 gap-6">
//           <div className="md:col-span-2">
//             <h1 className="text-3xl font-bold">{event.title}</h1>
//             <p className="text-gray-600 mt-2">
//               {event.location} • {new Date(event.date).toLocaleString()}
//             </p>

//             <p className="text-gray-700 mt-4">{event.description}</p>

//             <div className="mt-6">
//               <h3 className="font-semibold mb-2">Ticket categories</h3>
//               <div className="flex gap-3 flex-wrap">
//                 {CATEGORY_INFO.map((c) => (
//                   <motion.button
//                     key={c.id}
//                     onClick={() => setCategory(c.id)}
//                     whileHover={{ y: -3 }}
//                     className={`px-4 py-2 rounded-lg border ${
//                       category === c.id
//                         ? "bg-indigo-600 text-white border-indigo-600"
//                         : "bg-white"
//                     }`}
//                   >
//                     <div className="font-semibold">{c.label}</div>
//                     <div className="text-xs text-gray-500">{c.desc}</div>
//                     <div className="text-sm mt-1">
//                       ₹{(event.price * c.multiplier).toFixed(2)}
//                     </div>
//                   </motion.button>
//                 ))}
//               </div>
//             </div>

//             <div className="mt-6">
//               <h3 className="font-semibold mb-2">Select quantity</h3>
//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={() => setQuantity((q) => Math.max(1, q - 1))}
//                   className="px-3 py-2 bg-gray-200 rounded"
//                 >
//                   -
//                 </button>
//                 <div className="text-lg font-semibold">{quantity}</div>
//                 <button
//                   onClick={() =>
//                     setQuantity((q) =>
//                       Math.min(event.availableSeats ?? 1, q + 1)
//                     )
//                   }
//                   className="px-3 py-2 bg-gray-200 rounded"
//                 >
//                   +
//                 </button>
//                 <div className="ml-4 text-sm text-gray-600">
//                   Available: {event.availableSeats}
//                 </div>
//               </div>

//               <div className="mt-4 flex items-center justify-between">
//                 <div className="text-xl font-bold">Total: ₹{totalPrice}</div>
//                 <button
//                   onClick={handleBookNow}
//                   className="px-6 py-3 bg-green-600 text-white rounded-xl"
//                 >
//                   Book Now
//                 </button>
//               </div>
//             </div>
//           </div>

//           <aside className="space-y-4">
//             <div className="h-48 bg-gray-100 rounded-lg overflow-hidden">
//               {event.img ? (
//                 <img
//                   src={event.img}
//                   alt={event.title}
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="w-full h-full flex items-center justify-center text-gray-400">
//                   No image
//                 </div>
//               )}
//             </div>

//             <div className="h-60 bg-white rounded-lg p-2 shadow">
//               {center ? (
//                 <MapContainer
//                   center={center}
//                   zoom={12}
//                   style={{ height: "100%", width: "100%" }}
//                 >
//                   <TileLayer
//                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
//                   />
//                   <Marker position={center}>
//                     <Popup>{event.location}</Popup>
//                   </Marker>
//                 </MapContainer>
//               ) : (
//                 <div className="w-full h-full flex items-center justify-center text-gray-500">
//                   Loading map...
//                 </div>
//               )}
//             </div>
//           </aside>
//         </div>
//       </motion.div>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const CATEGORY_INFO = [
  { id: "regular", label: "Regular", multiplier: 1, desc: "Standard seating" },
  {
    id: "vip",
    label: "VIP",
    multiplier: 1.5,
    desc: "Better view, limited seats",
  },
  { id: "vvip", label: "VVIP", multiplier: 2, desc: "Front row & perks" },
];

export async function getLatLngFromAddress(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`
  );
  const data = await res.json();
  if (data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } else {
    throw new Error("Location not found");
  }
}

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [category, setCategory] = useState("regular");
  const [quantity, setQuantity] = useState(1);
  const [center, setCenter] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await API.get(`/events/${id}`);
        if (!mounted) return;
        setEvent(res.data);
        if (res.data.location) {
          getLatLngFromAddress(res.data.location)
            .then((coords) => mounted && setCenter(coords))
            .catch(() => mounted && setCenter({ lat: 19.076, lng: 72.8777 }));
        }
      } catch (err) {
        console.error("Failed to fetch event", err);
      }
    }
    load();
    return () => (mounted = false);
  }, [id]);

  if (!event) {
    return (
      <div className="p-8 text-center text-gray-600">Loading event...</div>
    );
  }

  const multiplier =
    CATEGORY_INFO.find((c) => c.id === category)?.multiplier ?? 1;
  const totalPrice = (Number(event.price) * multiplier * quantity).toFixed(2);

  function handleBookNow() {
    navigate(`/checkout/${event.id}`, {
      state: {
        selectedCategory: category,
        quantity,
        unitMultiplier: multiplier,
        totalPrice,
        event,
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="grid md:grid-cols-3 gap-8">
          {/* Event Info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                {event.title}
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                {event.location} • {new Date(event.date).toLocaleString()}
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed">{event.description}</p>

            {/* Categories */}
            <div>
              <h3 className="font-semibold mb-3 text-lg">Ticket Categories</h3>
              <div className="flex gap-4 flex-wrap">
                {CATEGORY_INFO.map((c) => (
                  <motion.div
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    whileHover={{ y: -3 }}
                    className={`cursor-pointer px-5 py-4 rounded-xl border shadow-sm transition 
                      ${
                        category === c.id
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-700 hover:border-indigo-400"
                      }`}
                  >
                    <div className="font-semibold">{c.label}</div>
                    <div className="text-sm opacity-80">{c.desc}</div>
                    <div className="text-base mt-2 font-medium">
                      ₹{(event.price * c.multiplier).toFixed(2)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <h3 className="font-semibold mb-3 text-lg">Select Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  -
                </button>
                <div className="text-xl font-semibold">{quantity}</div>
                <button
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(event.availableSeats ?? 1, q + 1)
                    )
                  }
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  +
                </button>
                <div className="ml-4 text-sm text-gray-600">
                  Available: {event.availableSeats}
                </div>
              </div>
            </div>

            {/* Total & CTA */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-2xl font-bold text-gray-800">
                Total: ₹{totalPrice}
              </div>
              <button
                onClick={handleBookNow}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
              >
                Book Now
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="h-52 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
              {event.img ? (
                <img
                  src={event.img}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>

            <div className="h-64 bg-white rounded-xl p-2 shadow-sm">
              {center ? (
                <MapContainer
                  center={center}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  />
                  <Marker position={center}>
                    <Popup>{event.location}</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Loading map...
                </div>
              )}
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}
