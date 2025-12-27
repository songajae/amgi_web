// src/App.jsx
import { useMemo, useState } from 'react';
import Home from './components/Home.jsx';
import WordList from './components/WordList.jsx';
import Review from './components/Review.jsx';
import About from './components/About.jsx';
import EnglishStudy from './components/EnglishStudy.jsx';
import BottomNav from './components/BottomNav.jsx';
import words from './data/words.json';

function App() {
  const [chapter, setChapter] = useState(1);
  const [activeTab, setActiveTab] = useState('home');

  const maxChapter = useMemo(
    () => Math.max(...words.map((w) => w.chapter || 1)),
    []
  );

  // 탭별 제목 표시
  const getPageTitle = () => {
    switch (activeTab) {
      case 'home':
        return '홈';
      case 'wordlist':
        return '단어장';
      case 'review':
        return '복습';
      case 'study':
        return '암기송';  // 변경
      case 'about':
        return '정보';
      default:
        return '';
    }
  };

  return (
    <div className="app-root">
      {/* 상단 헤더 - 모든 탭에 표시 */}
      <div className="top-header">
        <span className="top-title">{getPageTitle()}</span>

        {/* 🔹 EnglishStudy(study 탭)일 때는 "챕터" 표시 숨기기 */}
        {activeTab !== 'about' && activeTab !== 'study' && (
          <div className="top-header-right">
            <span className="page-main">챕터 :{chapter}</span>
            <span className="page-sub">/ {maxChapter}</span>
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="main-content">
        {activeTab === 'home' && (
          <Home
            chapter={chapter}
            setChapter={setChapter}
            maxChapter={maxChapter}
          />
        )}
        {activeTab === 'wordlist' && (
          <WordList
            chapter={chapter}
            setChapter={setChapter}
            maxChapter={maxChapter}
          />
        )}
        {activeTab === 'review' && (
          <Review
            chapter={chapter}
            setChapter={setChapter}
            maxChapter={maxChapter}
          />
        )}
        {activeTab === 'study' && (
          <EnglishStudy
            chapter={chapter}
            setChapter={setChapter}
            maxStudyChapter={maxChapter} // prop 이름은 필요시 그대로 놔둬도 동작에는 영향 없음
          />
        )}
        {activeTab === 'about' && <About />}
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
