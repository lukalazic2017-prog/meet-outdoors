import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import UserProfile from "./pages/UserProfile";
import HostProfile from "./pages/HostProfile";
import EditProfile from "./pages/EditProfile";
import Hosts from "./pages/Hosts";
import Activities from "./pages/Activities";
import CreateEvent from "./pages/CreateEvent";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import HostDashboard from "./pages/HostDashboard";
import EditEvent from "./pages/EditEvent";
import InterestedUsers from "./pages/InterestedUsers";
import MyInterestedEvents from "./pages/MyInterestedEvents";
import Notifications from "./pages/Notifications";
import CreatePackage from "./pages/CreatePackage";
import Packages from "./pages/Packages";
import PackageDetails from "./pages/PackageDetails";
import EditPackage from "./pages/EditPackage";
import BookingRequests from "./pages/BookingRequests";
import MyBookings from "./pages/MyBookings";
import EditPackageGallery from "./pages/EditPackageGallery";
import HostBookings from "./pages/HostBookings";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route path="/login" element={<Login />} />

          <Route path="/u/:username" element={<UserProfile />} />
          <Route path="/h/:username" element={<HostProfile />} />
          <Route path="/edit-profile" element={<EditProfile />} />

          <Route path="/hosts" element={<Hosts />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/events" element={<Events />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/dashboard" element={<HostDashboard />} />
<Route path="/edit-event/:id" element={<EditEvent />} />
<Route path="/event/:id/interested" element={<InterestedUsers />} />
<Route path="/my-events" element={<MyInterestedEvents />} />
<Route path="/notifications" element={<Notifications />} />
<Route path="/create-package" element={<CreatePackage />} />
<Route path="/packages" element={<Packages />} />
<Route path="/package/:id" element={<PackageDetails />} />
<Route path="/edit-package/:id" element={<EditPackage />} />
<Route path="/booking-requests" element={<BookingRequests />} />
<Route path="/my-bookings" element={<MyBookings />} />
<Route path="/edit-package/:id/gallery" element={<EditPackageGallery />} />
<Route path="/host-bookings" element={<HostBookings />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;