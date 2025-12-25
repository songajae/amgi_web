// src/components/About.jsx
import aboutData from '../data/about.json';

function About() {
  const handleEmailClick = () => {
    window.location.href = `mailto:${aboutData.developer.email}`;
  };

  return (
    <div className="about-container">
      <div className="about-content">
        <div className="about-section">
          <h2 className="about-title">단어복습 앱</h2>
          <p className="about-description">{aboutData.description}</p>
        </div>

        <div className="about-section">
          <div className="about-item">
            <span className="about-label">버전</span>
            <span className="about-value">v{aboutData.version}</span>
          </div>
          <div className="about-item">
            <span className="about-label">개발자</span>
            <span className="about-value">{aboutData.developer.name}</span>
          </div>
          <div className="about-item">
            <span className="about-label">문의</span>
            <button className="about-email-btn" onClick={handleEmailClick}>
              {aboutData.developer.email}
            </button>
          </div>
        </div>

        <div className="about-section">
          <p className="about-footer">
            © 2025 {aboutData.developer.name}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;
