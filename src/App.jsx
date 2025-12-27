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
        return '암기송';
      case 'about':
        return '정보';
      default:
        return '';
    }
  };

  return (
    <div className="app-root">
      <header className="top-header">
        <div className="top-title">암기송</div>
        <div className="top-header-right">
          <span className="page-main">{getPageTitle()}</span>
        </div>
      </header>

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
          // EnglishStudy에도 maxChapter 전달
          <EnglishStudy
            chapter={chapter}
            setChapter={setChapter}
            maxChapter={maxChapter} 
          />
        )}

        {activeTab === 'about' && <About />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
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
        return '암기송';
      case 'about':
        return '정보';
      default:
        return '';
    }
  };

  return (
    <div className="app-root">
      <header className="top-header">
        <div className="top-title">암기송</div>
        <div className="top-header-right">
          <span className="page-main">{getPageTitle()}</span>
        </div>
      </header>

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
          // 🔸 EnglishStudy에도 maxChapter 전달 
          <EnglishStudy
            chapter={chapter}
            setChapter={setChapter}
            maxChapter={maxChapter} 
          />
        )}

        {activeTab === 'about' && <About />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
