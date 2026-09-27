import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import LoadingFallback from './components/LoadingFallback';
import { lazyWithDelay } from './utils/lazyWithDelay';

// Route-Based Code Splitting via React.lazy with 300ms minimum delay fallback
const Home = lazyWithDelay(() => import('./pages/Home'), 300);
const Projects = lazyWithDelay(() => import('./components/Projects'), 300);
const Contact = lazyWithDelay(() => import('./pages/Contact'), 300);
const NotFound = lazyWithDelay(() => import('./pages/NotFound'), 300);

function App() {
  const [isLightMode, setIsLightMode] = useState(false);

  // Synchronize state with document.body class
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLightMode]);

  const toggleTheme = () => {
    setIsLightMode((prev) => !prev);
  };

  const studentData = {
    name: 'Kunj Patel',
    title: 'Undergraduate Computer Science & Technology Student | Aspiring Web Systems Architect',
    themeColor: '#22d3ee', // Neon Cyan accent
    skills: [
      'React & Component Architecture',
      'JavaScript (ES6+ / Modern APIs)',
      'CSS Grid / Flexbox & Custom Variables',
      'Vite & Build Scaffolding',
      'Node.js & API Engineering',
      'Git & GitHub Workflows'
    ]
  };

  return (
    <>
      <NavBar isLightMode={isLightMode} toggleTheme={toggleTheme} />
      {/* Route-level Suspense boundary with meaningful loading fallback */}
      <Suspense fallback={<LoadingFallback message="Loading page module..." />}>
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                name={studentData.name} 
                title={studentData.title} 
                themeColor={studentData.themeColor} 
                skills={studentData.skills} 
              />
            } 
          />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

export default App;
