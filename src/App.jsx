import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthProvider } from './context/AuthContext';

// Public pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyBookingPage from './pages/VerifyBookingPage';

// Customer pages
import SeatSelectionPage from './pages/SeatSelectionPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import MyBookingsPage from './pages/MyBookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import WaitlistPage from './pages/WaitlistPage';
import ProfilePage from './pages/ProfilePage';

// Organiser pages
import OrganiserDashboard from './pages/organiser/OrganiserDashboard';
import OrganiserEvents from './pages/organiser/OrganiserEvents';
import CreateEventPage from './pages/organiser/CreateEventPage';
import EditEventPage from './pages/organiser/EditEventPage';
import EventBookingsPage from './pages/organiser/EventBookingsPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVenues from './pages/admin/AdminVenues';
import AdminEvents from './pages/admin/AdminEvents';
import AdminBookings from './pages/admin/AdminBookings';

const App = () => {
  return (
    <AuthProvider>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify/:reference" element={<VerifyBookingPage />} />

              {/* Customer Protected Routes */}
              <Route path="/seats/:eventId" element={<ProtectedRoute roles={['customer']}><SeatSelectionPage /></ProtectedRoute>} />
              <Route path="/payment/:eventId" element={<ProtectedRoute roles={['customer']}><PaymentPage /></ProtectedRoute>} />
              <Route path="/checkout/:eventId" element={<ProtectedRoute roles={['customer']}><CheckoutPage /></ProtectedRoute>} />
              <Route path="/booking-success/:bookingId" element={<ProtectedRoute roles={['customer']}><BookingSuccessPage /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute roles={['customer']}><MyBookingsPage /></ProtectedRoute>} />
              <Route path="/bookings/:id" element={<ProtectedRoute roles={['customer']}><BookingDetailPage /></ProtectedRoute>} />
              <Route path="/waitlist" element={<ProtectedRoute roles={['customer']}><WaitlistPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute roles={['customer', 'admin', 'organiser']}><ProfilePage /></ProtectedRoute>} />

              {/* Organiser Routes */}
              <Route path="/organiser/dashboard" element={<ProtectedRoute roles={['organiser']}><OrganiserDashboard /></ProtectedRoute>} />
              <Route path="/organiser/events" element={<ProtectedRoute roles={['organiser']}><OrganiserEvents /></ProtectedRoute>} />
              <Route path="/organiser/events/create" element={<ProtectedRoute roles={['organiser']}><CreateEventPage /></ProtectedRoute>} />
              <Route path="/organiser/events/edit/:id" element={<ProtectedRoute roles={['organiser']}><EditEventPage /></ProtectedRoute>} />
              <Route path="/organiser/events/:id/bookings" element={<ProtectedRoute roles={['organiser']}><EventBookingsPage /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/venues" element={<ProtectedRoute roles={['admin']}><AdminVenues /></ProtectedRoute>} />
              <Route path="/admin/events" element={<ProtectedRoute roles={['admin']}><AdminEvents /></ProtectedRoute>} />
              <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><AdminBookings /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
};

export default App;
