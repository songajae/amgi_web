// src/App.jsx
import { useState } from 'react';
import Home from './components/Home';
import WordList from './components/WordList';
import Review from './components/Review';
import EnglishStudy from './components/EnglishStudy';
import About from './components/About';
import BottomNav from './components/BottomNav';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [chapter, setChapter] = useState(1);
  const [showChapterModal, setShowChapterModal] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'wordlist':
        return <WordList chapter={chapter} setChapter={setChapter} />;
      case 'review':
        return <Review chapter={chapter} setChapter={setChapter} />;
      case 'study':
        return <EnglishStudy chapter={chapter} />;
      case 'about':
        return <About />;
      default:
        return <Home />;
    }
  };

  const handleChapterSelect = (newChapter) => {
    setChapter(newChapter);
    setShowChapterModal(false);
  };

  return (
    <div className="app-root">
      {/* 상단 헤더 - Study 탭일 때 Level 선택 표시 */}
      {activeTab === 'study' && (
        <div className="top-header">
          <span className="top-title">영어 공부</span>
          <div className="top-header-right">
            <button 
              className="level-selector"
              onClick={() => setShowChapterModal(true)}
            >
              Level {chapter}
            </button>
          </div>
        </div>
      )}
      
      {/* 메인 콘텐츠 */}
      <div className={`main-content ${activeTab === 'study' ? 'with-header' : ''}`}>
        {renderContent()}
      </div>
      
      {/* 챕터 선택 모달 */}
      {showChapterModal && (
        <div className="modal-overlay" onClick={() => setShowChapterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">레벨 선택</h3>
            <div className="chapter-grid">
              {[1, 2].map(ch => (
                <button
                  key={ch}
                  className={`chapter-btn ${chapter === ch ? 'active' : ''}`}
                  onClick={() => handleChapterSelect(ch)}
                >
                  Level {ch}
                </button>
              ))}
            </div>
            <button className="modal-close-btn" onClick={() => setShowChapterModal(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
      
      {/* 하단 네비게이션 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
