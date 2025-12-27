// src/components/BottomNav.jsx
function BottomNav({ activeTab, onTabChange }) {
  return (
    <div className="bottom-nav">
      <button
        className={`bottom-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
      >
        홈
      </button>
      <button
        className={`bottom-nav-btn ${activeTab === 'wordlist' ? 'active' : ''}`}
        onClick={() => onTabChange('wordlist')}
      >
        단어장
      </button>
      <button
        className={`bottom-nav-btn ${activeTab === 'review' ? 'active' : ''}`}
        onClick={() => onTabChange('review')}
      >
        복습
      </button>
      <button
        className={`bottom-nav-btn ${activeTab === 'study' ? 'active' : ''}`}
        onClick={() => onTabChange('study')}
      >
        영어공부
      </button>
      <button
        className={`bottom-nav-btn ${activeTab === 'about' ? 'active' : ''}`}
        onClick={() => onTabChange('about')}
      >
        정보
      </button>
    </div>
  );
}

export default BottomNav;
