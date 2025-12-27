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

  // 단어 데이터 기준 전체 최대 챕터
  const maxChapter = useMemo(
    () => Math.max(...words.map((w) => w.chapter || 1)),
    []
  );

  // 왼쪽에 찍을 현재 페이지 이름
  const getPageTitle = () => {
    switch (activeTab) {
      case 'home':
        return '홈';
      case 'wordlist':
        return '단어장';
      case 'review':
        return '복습';
      case 'study':
        return '암기송';
      case 'about':
        return '정보';
      default:
        return '';
    }
  };

  return (
    <div className="app-root">
      {/* 🔸 상단바: 왼쪽에 페이지 이름, 오른쪽에 챕터 1 / 30 */}
      <header className="top-header">
        <div className="top-title">{getPageTitle()}</div>
        <div className="top-header-right">
          <span className="page-main">
            챕터 : {chapter} / {maxChapter}
          </span>
        </div>
      </header>

      {/* 🔸 메인 영역: 기존과 동일 */}
      <main className="main-content with-header">
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
          />
        )}

        {activeTab === 'review' && (
          <Review
            chapter={chapter}
            setChapter={setChapter}
          />
        )}

        {activeTab === 'study' && (
          <EnglishStudy
            chapter={chapter}
            setChapter={setChapter}
            maxChapter={maxChapter}
          />
        )}

        {activeTab === 'about' && <About />}
      </main>

      {/* 🔸 하단 탭: 그대로 */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
