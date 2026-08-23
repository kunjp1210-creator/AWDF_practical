import React from 'react';

function Skills({ skillList }) {
  return (
    <section id="skills" className="container">
      <h2 className="section-title">My Skills</h2>
      <div className="skills-wrapper">
        <ul className="skills-list">
          {skillList.map((skill) => (
            <li key={skill} className="skill-badge glass-panel">
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Skills;
