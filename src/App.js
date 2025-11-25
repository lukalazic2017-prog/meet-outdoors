import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// TRIAL SISTEM
import { TrialProvider } from "./i18n/TrialContext";

// STRANICE
import Home from "./pages/Home";
import Activities from "./pages/Activities";
import Contact from "./pages/Contact";
import Tours from "./pages/Tours";
import CreateTour from "./pages/CreateTour";
import MyProfile from "./pages/MyProfile";
import EditProfile from "./pages/EditProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import Chat from "./pages/Chat";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";

function App() {
  return (
      <TrialProvider>
        <BrowserRouter>

          <Navbar />

          <Routes>
            {/* GLAVNE STRANICE */}
            <Route path="/" element={<Home />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/terms" element={<Terms />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/refund" element={<Refund />} />

            {/* CHAT – mora :tourId da bi radilo */}
            <Route path="/chat/:tourId" element={<Chat />} />

            {/* SAMO ULOGOVANI – Create Tour */}
            <Route
              path="/create-tour"
              element={
                <ProtectedRoute>
                  <CreateTour />
                </ProtectedRoute>
              }
            />

            {/* PROFIL */}
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/edit-profile" element={<EditProfile />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>

        </BrowserRouter>
      </TrialProvider>
  );
}

export default App;