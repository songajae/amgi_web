// src/App.jsx
import { useMemo, useState, useEffect } from 'react';
import Home from './components/Home.jsx';
import WordList from './components/WordList.jsx';
import Review from './components/Review.jsx';
import About from './components/About.jsx';
import BottomNav from './components/BottomNav.jsx';
import words from './data/words.json';

function App() {
  const [chapter, setChapter] = useState(() => {
    const saved = localStorage.getItem('lastChapter');
    return saved ? Number(saved) : 1;
  });
  const [activeTab, setActiveTab] = useState('home');

  const maxChapter = useMemo(
    () => Math.max(...words.map((w) => w.chapter || 1)),
    [],
  );

  // 챕터 변경 시 마지막 공부한 챕터 저장
  useEffect(() => {
    if (chapter) {
      localStorage.setItem('lastChapter', String(chapter));
    }
  }, [chapter]);


  return (
    <div className="app-root">
      <header className="top-header">
        <div className="top-title">
          {activeTab === 'wordlist' && '단어장'}
          {activeTab === 'home' && '단어복습'}
          {activeTab === 'review' && '단어복습'}
          {activeTab === 'more' && 'About'}
        </div>
        {activeTab !== 'more' && (
          <div className="top-header-right">
            <span className="page-sub">챕터 : </span>
            <span className="page-main">{chapter}</span>
            <span className="page-sub"> / {maxChapter}</span>
          </div>
        )}
      </header>

      <main className="main-content">
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
        {activeTab === 'more' && <About />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
