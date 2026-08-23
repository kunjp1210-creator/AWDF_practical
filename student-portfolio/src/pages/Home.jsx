import React from 'react';
import Header from '../components/Header';
import About from '../components/About';
import Skills from '../components/Skills';

function Home({ name, title, themeColor, skills }) {
  return (
    <main>
      <HomeWrapper>
        <Header name={name} title={title} themeColor={themeColor} />
        <About />
        <Skills skillList={skills} />
      </HomeWrapper>
    </main>
  );
}

// Simple wrapper container for styling adjustments if needed
const HomeWrapper = ({ children }) => {
  return <>{children}</>;
};

export default Home;
