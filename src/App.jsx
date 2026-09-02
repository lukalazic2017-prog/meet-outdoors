import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

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
import ExploreMap from "./pages/ExploreMap";
import AddPlace from "./pages/AddPlace";
import PlaceDetails from "./pages/PlaceDetails";
import AdminExplore from "./pages/AdminExplore";
import BlockedAccount from "./pages/BlockedAccount";

function AppRoutes() {
  const {
    loading,
    isBanned,
    isSuspended,
  } = useAuth();

  const location = useLocation();

  if (
    !loading &&
    (isBanned || isSuspended) &&
    location.pathname !== "/blocked"
  ) {
    return (
      <Navigate
        to="/blocked"
        replace
      />
    );
  }

  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/register"
          element={
            <Navigate
              to="/signup"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/blocked"
          element={<BlockedAccount />}
        />

        <Route
          path="/u/:username"
          element={<UserProfile />}
        />

        <Route
          path="/h/:username"
          element={<HostProfile />}
        />

        <Route
          path="/edit-profile"
          element={<EditProfile />}
        />

        <Route
          path="/hosts"
          element={<Hosts />}
        />

        <Route
          path="/activities"
          element={<Activities />}
        />

        <Route
          path="/create-event"
          element={<CreateEvent />}
        />

        <Route
          path="/events"
          element={<Events />}
        />

        <Route
          path="/event/:id"
          element={<EventDetails />}
        />

        <Route
          path="/dashboard"
          element={<HostDashboard />}
        />

        <Route
          path="/edit-event/:id"
          element={<EditEvent />}
        />

        <Route
          path="/event/:id/interested"
          element={<InterestedUsers />}
        />

        <Route
          path="/my-events"
          element={<MyInterestedEvents />}
        />

        <Route
          path="/notifications"
          element={<Notifications />}
        />

        <Route
          path="/create-package"
          element={<CreatePackage />}
        />

        <Route
          path="/packages"
          element={<Packages />}
        />

        <Route
          path="/package/:id"
          element={<PackageDetails />}
        />
        <Route path="/paketi/:slug" element={<PackageDetails />} />

        <Route
          path="/edit-package/:id"
          element={<EditPackage />}
        />

        <Route
          path="/booking-requests"
          element={<BookingRequests />}
        />

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />

        <Route
          path="/edit-package/:id/gallery"
          element={<EditPackageGallery />}
        />

        <Route
          path="/host-bookings"
          element={<HostBookings />}
        />

        <Route
          path="/explore"
          element={<ExploreMap />}
        />

        <Route
          path="/explore/add"
          element={<AddPlace />}
        />

        <Route
  path="/mesta/:slug"
  element={<PlaceDetails />}
/>

        <Route
          path="/explore/:id"
          element={<PlaceDetails />}
        />

        <Route
          path="/admin/explore"
          element={<AdminExplore />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;