import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

import SyllabusTracker from './pages/SyllabusTracker';

// Placeholders for now
import ActivitiesTracker from './pages/ActivitiesTracker';
import StudyNotes from './pages/StudyNotes';
import DailyTracker from './pages/DailyTracker';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily" element={<DailyTracker />} />
          <Route path="/syllabus" element={<SyllabusTracker />} />
          <Route path="/activities" element={<ActivitiesTracker />} />
          <Route path="/notes" element={<StudyNotes />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
