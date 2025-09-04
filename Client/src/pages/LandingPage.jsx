import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Ticket,
  ArrowRight,
  Play,
  Star,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import API from "../api";
import useAuth from "../hooks/useAuth";

function AnimatedBlobs() {
  const { scrollYProgress } = useScroll();

  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const blob1X = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const blob2X = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const blob3Y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Fade out blobs as you scroll (0 → 40% → 80%)
  const opacity = useTransform(scrollYProgress, [0, 0.4, 0.8], [1, 0.5, 0]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        style={{ y: blob1Y, x: blob1X, opacity }}
        className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        style={{ y: blob2Y, x: blob2X, opacity }}
        className="absolute -top-20 -right-32 w-64 h-64 bg-gradient-to-br from-pink-400/25 to-orange-500/25 rounded-full blur-2xl"
        animate={{
          scale: [1, 0.8, 1.1, 1],
          rotate: [0, -90, 180, 270, 360],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        style={{ y: blob3Y, opacity }}
        className="absolute top-1/2 -left-32 w-56 h-56 bg-gradient-to-br from-green-400/20 to-teal-500/20 rounded-full blur-2xl"
        animate={{
          scale: [1, 1.3, 0.9, 1],
          x: [0, 50, -50, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Floating event cards
function FloatingEventCard({ event, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateY: -15 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      whileHover={{
        y: -10,
        rotateY: 5,
        boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
        transition: { duration: 0.3 },
      }}
      className="bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-white/20 group"
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={event.img}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-800">
          {event.category}
        </div>
        <motion.div
          className="absolute bottom-3 left-3 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className="font-semibold text-sm">{event.title}</h4>
          <div className="text-xs opacity-90 flex items-center gap-1">
            <MapPin size={10} />
            {event.location}
          </div>
        </motion.div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users size={12} />
            <span>{event.attendees}</span>
            <Clock size={12} className="ml-2" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">From</div>
            <div className="font-bold text-sm text-indigo-600">
              {event.price === 0 ? "Free" : `₹${event.price}`}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Feature card component
function FeatureCard({ icon: Icon, title, description, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-white/20 hover:bg-white/70 transition-all duration-300 hover:shadow-2xl"
    >
      <div className="relative">
        <motion.div
          className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
          whileHover={{ rotate: 5 }}
        >
          <Icon className="text-white" size={24} />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// Stats counter component
function StatCard({ number, label, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          setCount((prev) => {
            if (prev >= number) {
              clearInterval(interval);
              return number;
            }
            return prev + Math.ceil(number / 50);
          });
        }, 50);
        return () => clearInterval(interval);
      }, index * 200);
      return () => clearTimeout(timer);
    }
  }, [isInView, number, index]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="text-center"
    >
      <div className="text-4xl font-bold text-white mb-2">
        {count.toLocaleString()}+
      </div>
      <div className="text-white/80 text-sm uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
}

export default function ModernLandingPage() {
  const user = useAuth();
  const { scrollYProgress } = useScroll();
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const fetchEvents = async () => {
      const res = await API.get("/events");
      setEvents(res.data.data || []);
    };
    fetchEvents();
  }, []);
  const heroRef = useRef(null);
  const eventsRef = useRef(null);

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2, 0.4], [1, 0.7, 0]);

  const scrollToEvents = () => {
    eventsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity }}
        ref={heroRef}
        className="relative min-h-screen flex items-center"
      >
        <AnimatedBlobs />

        {/* Navigation */}
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div
              className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              EventFlow
            </motion.div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#events"
                className="hover:text-blue-300 transition-colors"
              >
                Events
              </a>
              <a
                href="#features"
                className="hover:text-blue-300 transition-colors"
              >
                Features
              </a>
              <a
                href="#about"
                className="hover:text-blue-300 transition-colors"
              >
                About
              </a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300"
              >
                {!user && (
                  <button className="btn">
                    <Link to={"/admin/login"}>Login</Link>
                  </button>
                )}

                {user?.role === "admin" && (
                  <button className="btn">
                    <Link to={"/admin/dashboard"}> Admin Dashboard</Link>
                  </button>
                )}
              </motion.button>
            </div>
          </div>
        </motion.nav>

        <div className="max-w-7xl mx-auto px-6 pt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            style={{ y: textY }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 text-sm"
            >
              <Star className="mr-2" size={16} />
              <span>Trusted by 10,000+ event organizers</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-5xl md:text-7xl font-bold leading-tight"
            >
              Discover
              <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Amazing Events
              </span>
              Near You
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-xl text-gray-300 leading-relaxed max-w-lg"
            >
              Experience seamless event booking with real-time availability,
              instant confirmations, and beautiful QR tickets. Join thousands
              who trust EventFlow.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToEvents}
                className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-2 hover:shadow-2xl transition-all duration-300"
              >
                Explore Events
                <ArrowRight size={20} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-2 hover:bg-white/20 transition-all duration-300"
              >
                <Play size={20} />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex items-center gap-6 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span>Instant Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span>24/7 Support</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Floating Event Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto lg:max-w-none">
              {events.slice(0, 3).map((event, index) => (
                <FloatingEventCard key={event.id} event={event} index={index} />
              ))}
            </div>

            {/* Decorative elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-10 -right-10 w-20 h-20 border border-blue-400/30 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-10 -left-10 w-16 h-16 border border-purple-400/30 rounded-full"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-purple-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20"
        />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number={10000} label="Events Hosted" index={0} />
            <StatCard number={50000} label="Happy Attendees" index={1} />
            <StatCard number={500} label="Event Organizers" index={2} />
            <StatCard number={25} label="Cities Covered" index={3} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent"
        />
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
              Why Choose EventFlow?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Experience the future of event booking with cutting-edge features
              designed for both organizers and attendees.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Ticket}
              title="Smart Ticketing"
              description="Generate beautiful QR tickets with real-time validation, seat selection, and instant delivery to your phone."
              index={0}
            />
            <FeatureCard
              icon={Calendar}
              title="Real-time Updates"
              description="Live seat availability, instant booking confirmations, and automatic calendar sync across all your devices."
              index={1}
            />
            <FeatureCard
              icon={MapPin}
              title="Smart Locations"
              description="Integrated maps, venue details, parking info, and turn-by-turn navigation to never miss an event."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* Events Preview */}
      <section ref={eventsRef} id="events" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
              Trending Events
            </h2>
            <p className="text-xl text-gray-400">
              Discover what's happening in your city
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={event.img}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-800">
                    {event.category}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-4 text-white/80 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        {event.attendees}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {event.price === 0 ? "Free" : `₹${event.price}`}
                      </div>
                      <div className="text-xs text-gray-400">per person</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <Link to={"/events"}>Book Now</Link>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mt-16"
          >
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 px-12 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300"
            >
              <Link to={"/events"}>View All Events</Link>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                EventFlow
              </h3>
              <p className="text-gray-400 leading-relaxed">
                The future of event booking. Seamless, secure, and spectacular.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-gray-400">
                <div>Browse Events</div>
                <div>Create Events</div>
                <div>Manage Bookings</div>
                <div>Analytics</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-gray-400">
                <div>Help Center</div>
                <div>Contact Us</div>
                <div>Community</div>
                <div>Status</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-gray-400">
                <div>About</div>
                <div>Careers</div>
                <div>Privacy</div>
                <div>Terms</div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>© {new Date().getFullYear()} EventFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
