// src/App.jsx
import { useMemo, useState } from 'react';
import WordList from './components/WordList.jsx';
import BottomNav from './components/BottomNav.jsx';
import words from './data/words.json';

function App() {
  const [chapter, setChapter] = useState(1);

  const maxChapter = useMemo(
    () => Math.max(...words.map((w) => w.chapter || 1)),
    [],
  );

  return (
    <div className="app-root">
      {/* 상단 상태바 */}
      <header className="status-bar">
        <span className="status-time">9:30</span>
        <div className="status-icons" />
      </header>

      {/* 상단 타이틀: 단어장 + 현재/총 챕터 */}
      <header className="top-header">
        <div className="top-title">단어장</div>
        <div className="top-header-right">
          <span className="page-main">{chapter}</span>
          <span className="page-sub"> / {maxChapter}</span>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="main-content">
        <WordList
          chapter={chapter}
          setChapter={setChapter}
          maxChapter={maxChapter}
        />
      </main>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}

export default App;
