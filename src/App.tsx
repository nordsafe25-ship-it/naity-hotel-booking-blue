import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HotelsListing from "./pages/HotelsListing";
import SearchResults from "./pages/SearchResults";
import HotelDetails from "./pages/HotelDetails";
import BookingForm from "./pages/BookingForm";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Join from "./pages/Join";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyBookings from "./pages/MyBookings";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminHotels from "./pages/admin/AdminHotels";
import AdminHotelDetail from "./pages/admin/AdminHotelDetail";
import AdminRooms from "./pages/admin/AdminRooms";
import AdminManagers from "./pages/admin/AdminManagers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminSync from "./pages/admin/AdminSync";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminPartners from "./pages/admin/AdminPartners";
import HotelPanel from "./pages/hotel/HotelPanel";
import PartnerDashboard from "./pages/partner/PartnerDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/hotels" element={<HotelsListing />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/hotels/:id" element={<HotelDetails />} />
              <Route path="/booking" element={<BookingForm />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/about" element={<About />} />
              <Route path="/join" element={<Join />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />

              {/* Dashboard redirect */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/hotels" element={<ProtectedRoute requiredRole="admin"><AdminHotels /></ProtectedRoute>} />
              <Route path="/admin/hotels/:id" element={<ProtectedRoute requiredRole="admin"><AdminHotelDetail /></ProtectedRoute>} />
              <Route path="/admin/rooms" element={<ProtectedRoute requiredRole="admin"><AdminRooms /></ProtectedRoute>} />
              <Route path="/admin/managers" element={<ProtectedRoute requiredRole="admin"><AdminManagers /></ProtectedRoute>} />
              <Route path="/admin/bookings" element={<ProtectedRoute requiredRole="admin"><AdminBookings /></ProtectedRoute>} />
              <Route path="/admin/sync" element={<ProtectedRoute requiredRole="admin"><AdminSync /></ProtectedRoute>} />
              <Route path="/admin/messages" element={<ProtectedRoute requiredRole="admin"><AdminMessages /></ProtectedRoute>} />
              <Route path="/admin/partners" element={<ProtectedRoute requiredRole="admin"><AdminPartners /></ProtectedRoute>} />

              {/* Hotel Manager */}
              <Route path="/hotel-panel" element={<ProtectedRoute requiredRole="hotel_manager"><HotelPanel /></ProtectedRoute>} />

              {/* Partner */}
              <Route path="/partner" element={<PartnerDashboard />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
