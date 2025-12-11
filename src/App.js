import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";


// STRANICE
import Home from "./pages/Home";
import Activities from "./pages/Activities";
import Contact from "./pages/Contact";
import CreateTour from "./pages/CreateTour";
import Tours from "./pages/Tours";
import Profile from "./pages/Profile";
import FollowersList from "./pages/FollowersList";
import EditTour from "./pages/EditTour";
import Chat from "./pages/Chat";
import TourDetails from "./pages/TourDetails";
import MyTours from "./pages/MyTours";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import SafetyTips from "./pages/SafetyTips";
import HostGuidelines from "./pages/HostGuidelines";
import About from "./pages/About";
import TermsOfService from "./pages/TermsOfService";
import Timeline from "./pages/Timeline";
import AddPost from "./pages/AddPost";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Notifications from "./pages/Notifications";
import CreateEvent from "./pages/CreateEvent";
import Event from "./pages/Event";
import EventDetails from "./pages/EventDetails";
import Events from "./pages/Events";

// AUTH STRANICE
import Login from "./pages/Login";
import Register from "./pages/Register";


import Refund from "./pages/Refund";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* JAVNE STRANICE */}
          <Route path="/" element={<Home />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/followers" element={<FollowersList />} />
          <Route path="/edit-tour/:id" element={<EditTour />} />  
          <Route path="/chat/:tourId" element={<Chat />} />
          <Route path="/tour/:id" element={<TourDetails/>} />
          <Route path="my-tours" element={<MyTours/>} />
          <Route path="edit-profile" element={<EditProfile/>} />
          <Route path="settings" element={<Settings/>} />
          <Route path="/safety-tips" element={<SafetyTips />} />
          <Route path="/host-guidelines" element={<HostGuidelines />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/add-post" element={<AddPost />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/event" element={<Event />} />
          <Route path="/event-details" element={<EventDetails />} />
          <Route path ="/events" element={<Events />} />
          <Route path ="/event/:id" element={<EventDetails />} />
          

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          

          {/* STRANICE ZA ULOGOVANE */}
          <Route
            path="/create-tour"
            element={
              <ProtectedRoute>
                <CreateTour />
              </ProtectedRoute>
            }
          />

          <Route
            
          />

          <Route
            path="/tours"
            element={
              <ProtectedRoute>
                <Tours />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;