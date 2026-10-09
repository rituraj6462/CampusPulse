import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { LandingPage } from './pages/LandingPage';
import { EventDiscoveryPage } from './pages/EventDiscoveryPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { TicketViewPage } from './pages/TicketViewPage';
import { PulseMatchPage } from './pages/PulseMatchPage';
import { TeamUpPage } from './pages/TeamUpPage';
import { CampusPassportPage } from './pages/CampusPassportPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/events" element={<EventDiscoveryPage />} />
          <Route path="/events/:slug" element={<EventDetailPage />} />
          <Route path="/tickets/:ticketCode" element={<TicketViewPage />} />
          <Route path="/dashboard" element={<StudentDashboardPage />} />
          <Route path="/pulse-match" element={<PulseMatchPage />} />
          <Route path="/team-up" element={<TeamUpPage />} />
          <Route path="/passport" element={<CampusPassportPage />} />
          <Route path="/passport/:userId" element={<CampusPassportPage />} />
          <Route path="/organizer" element={<OrganizerDashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
