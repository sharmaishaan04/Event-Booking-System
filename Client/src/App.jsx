import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import EventListingPage from "./pages/EventListingPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/events" element={<EventListingPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/checkout/:id" element={<CheckoutPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
