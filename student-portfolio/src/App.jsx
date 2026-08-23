import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Projects from './components/Projects';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Footer from './components/Footer';

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
      <Footer />
    </>
  );
}

export default App;
