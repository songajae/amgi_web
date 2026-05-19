// ==============================
// 파일명 : src/App.jsx
// 역할 : 앱의 최상위 컴포넌트로서 현재 챕터 상태와 탭 전환 상태를 공통 관리하고, 홈/단어장/복습/암기송/정보 화면에 필요한 props를 전달해 전체 학습 흐름을 연결한다.
// 수정일 : 2026-04-28
// 수정사항: 챕터 최대값 계산 시 단어 데이터와 암기송(video-subtitles) 데이터를 함께 반영하도록 개선
// 수정일 : 2026-05-19
// 수정사항: 홈 탭에서 암기송 화면을 표시하고 study 탭(단어공부)에서 기존 홈 학습 화면을 표시하도록 화면 매핑을 교체

// ==============================
// src/App.jsx
import { useMemo, useState } from 'react';
import Home from './components/Home.jsx';
import WordList from './components/WordList.jsx';
import Review from './components/Review.jsx';
import About from './components/About.jsx';
import EnglishStudy from './components/EnglishStudy.jsx';
import BottomNav from './components/BottomNav.jsx';
import words from './data/words.json';
import videoData from './data/video-subtitles.json';
import { TAB_LABELS } from './components/navigationLabels.js';

function App() {
  const [chapter, setChapter] = useState(1);
  const [activeTab, setActiveTab] = useState('home');

  const maxChapter = useMemo(
    () => {
      const wordMaxChapter = Math.max(...words.map((w) => w.chapter || 1)); // 단어 데이터 최대 챕터
      const videoMaxChapter = Math.max( // 영상 데이터 최대 챕터
        ...videoData
          .map((video) => video.chapter)
          .filter((chapterNum) => typeof chapterNum === 'number')
      );
      return Math.max(wordMaxChapter, videoMaxChapter); // 전체 최대 챕터
    },
    []
  );

  // 탭별 제목 표시
  const getPageTitle = () => { // 현재 활성 탭의 상단 제목 반환 함수
    switch (activeTab) {
      case 'home':
        return TAB_LABELS.home;
      case 'wordlist':
        return TAB_LABELS.wordlist;
      case 'review':
        return TAB_LABELS.review;
      case 'study':
        return TAB_LABELS.study;
      case 'about':
        return TAB_LABELS.about;
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
          <EnglishStudy
            chapter={chapter}
            setChapter={setChapter}
            maxStudyChapter={maxChapter} // prop 이름은 필요시 그대로 놔둬도 동작에는 영향 없음
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
          <Home
            chapter={chapter}
            setChapter={setChapter}
            maxChapter={maxChapter}
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
