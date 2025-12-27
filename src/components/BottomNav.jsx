// src/components/BottomNav.jsx
function BottomNav({ activeTab, onTabChange }) {
  return (
    <div className="bottom-nav">
      <button
        className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
      >
        🏠<br />홈
      </button>
      <button
        className={`nav-item ${activeTab === 'wordlist' ? 'active' : ''}`}
        onClick={() => onTabChange('wordlist')}
      >
        📚<br />단어장
      </button>
      <button
        className={`nav-item ${activeTab === 'review' ? 'active' : ''}`}
        onClick={() => onTabChange('review')}
      >
        ✍️<br />복습
      </button>
      <button
        className={`nav-item ${activeTab === 'study' ? 'active' : ''}`}
        onClick={() => onTabChange('study')}
      >
        🎬<br />영어공부
      </button>
      <button
        className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
        onClick={() => onTabChange('about')}
      >
        ℹ️<br />정보
      </button>
    </div>
  );
}

export default BottomNav;
