// src/components/Review.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import words from '../data/words.json';

function Review({ chapter, setChapter, maxChapter }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterPage, setChapterPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [randomIndices, setRandomIndices] = useState([]);
  const [showNavDialog, setShowNavDialog] = useState(false);
  const [navDialogType, setNavDialogType] = useState(''); // 'first' or 'last'
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const CHAPTERS_PER_PAGE = 10;

  // 현재 챕터의 단어들
  const chapterWords = useMemo(
    () => words.filter((w) => (w.chapter || 1) === chapter),
    [chapter]
  );

  // 랜덤 순서 생성
  useEffect(() => {
    if (isRandomMode && chapterWords.length > 0) {
      const indices = Array.from({ length: chapterWords.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setRandomIndices(indices);
    }
  }, [isRandomMode, chapterWords.length, chapter]);

  // 챕터가 변경되면 리셋
  useEffect(() => {
    setCurrentWordIndex(0);
    setShowMeaning(false);
  }, [chapter]);

  // 랜덤 모드 변경 시 초기화
  const handleRandomModeToggle = () => {
    setIsRandomMode(!isRandomMode);
    setCurrentWordIndex(0);
    setShowMeaning(false);
  };

  const getCurrentIndex = () => {
    if (isRandomMode && randomIndices.length > 0) {
      return randomIndices[currentWordIndex];
    }
    return currentWordIndex;
  };

  const currentWord = chapterWords[getCurrentIndex()] || {};

  // 다음 단어로 이동
  const handleNextWord = () => {
    if (currentWordIndex >= chapterWords.length - 1) {
      // 마지막 단어
      setNavDialogType('last');
      setShowNavDialog(true);
    } else {
      setCurrentWordIndex((prev) => prev + 1);
      setShowMeaning(false);
    }
  };

  // 이전 단어로 이동
  const handlePrevWord = () => {
    if (currentWordIndex === 0) {
      // 첫 단어
      setNavDialogType('first');
      setShowNavDialog(true);
    } else {
      setCurrentWordIndex((prev) => prev - 1);
      setShowMeaning(false);
    }
  };

  // 챕터 이동 다이얼로그 처리
  const handleNavDialog = (goToChapter) => {
    setShowNavDialog(false);
    if (goToChapter) {
      if (navDialogType === 'first' && chapter > 1) {
        setChapter(chapter - 1);
        setCurrentWordIndex(0);
      } else if (navDialogType === 'last' && chapter < maxChapter) {
        setChapter(chapter + 1);
        setCurrentWordIndex(0);
      }
    } else {
      // 취소 시 첫 단어 또는 마지막 단어 유지
      if (navDialogType === 'first') {
        setCurrentWordIndex(0);
      } else {
        setCurrentWordIndex(chapterWords.length - 1);
      }
    }
    setShowMeaning(false);
  };

  // 챕터 변경
  const handleChangeChapter = (nextChapter) => {
    setChapter(nextChapter);
    setCurrentWordIndex(0);
    setShowChapterModal(false);
    setShowMeaning(false);
  };

  const openChapterModal = () => {
    const currentPage = Math.floor((chapter - 1) / CHAPTERS_PER_PAGE) + 1;
    setChapterPage(currentPage);
    setShowChapterModal(true);
  };

  // 챕터 리스트
  const chapterList = Array.from({ length: maxChapter }, (_, i) => i + 1);
  const chapterTotalPages = Math.max(
    1,
    Math.ceil(chapterList.length / CHAPTERS_PER_PAGE)
  );
  const startChapterIndex = (chapterPage - 1) * CHAPTERS_PER_PAGE;
  const chapterPageItems = chapterList.slice(
    startChapterIndex,
    startChapterIndex + CHAPTERS_PER_PAGE
  );

  // pos와 meaning 파싱
  const parseMeanings = (pos, meaning) => {
    if (!meaning) return [];
    const meanings = [];
    const parts = meaning.split(',').map(m => m.trim());

    if (pos && pos.includes(',')) {
      const posList = pos.split(',').map(p => p.trim());
      posList.forEach((p, index) => {
        if (parts[index]) {
          meanings.push({ pos: p, meaning: parts[index] });
        }
      });
    } else if (pos) {
      meanings.push({ pos, meaning });
    } else {
      meanings.push({ pos: '', meaning });
    }
    return meanings;
  };

  const meanings = parseMeanings(currentWord.pos, currentWord.meaning);

  // 카드 클릭 처리
  const handleCardClick = () => {
    if (!showMeaning) {
      // 뜻이 안 보이면 뜻 보이기
      setShowMeaning(true);
    } else {
      // 뜻이 보이면 다음 단어로
      handleNextWord();
    }
  };

  // 스와이프 감지
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const swipeDistanceX = touchStartX.current - touchEndX.current;
    const swipeDistanceY = Math.abs(touchStartY.current - touchEndY.current);
    const minSwipeDistance = 50;

    // 세로 스와이프는 무시
    if (swipeDistanceY > 50) return;

    if (Math.abs(swipeDistanceX) > minSwipeDistance) {
      if (swipeDistanceX > 0) {
        // 왼쪽으로 스와이프 = 다음 단어
        if (showMeaning) {
          handleNextWord();
        }
      } else {
        // 오른쪽으로 스와이프 = 이전 단어
        handlePrevWord();
      }
    }
  };

  return (
    <div className="main-content">
      <div className="review-container">
        {/* Level 버튼 */}
        <button className="level-title-button" onClick={openChapterModal}>
          Level {chapter}
        </button>

        {/* 랜덤 모드 버튼 */}
        <button className="random-btn-text" onClick={handleRandomModeToggle}>
          {isRandomMode ? '🔀 랜덤' : '📖 순서'}
        </button>

        {/* 설정 버튼 */}
        <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
          ⚙️
        </button>

        {/* 설정 패널 */}
        {showSettings && (
          <div className="settings-panel">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={isRandomMode}
                  onChange={handleRandomModeToggle}
                />
                랜덤 모드
              </label>
            </div>
          </div>
        )}

        {/* 플래시카드 */}
        <div
          className="review-flashcard"
          onClick={handleCardClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 단어 */}
          <div className="flashcard-word">{currentWord.word}</div>

          {/* 뜻 (showMeaning이 true일 때만 표시) */}
          {showMeaning && (
            <>
              <div className="flashcard-meanings">
                {meanings.map((m, i) => (
                  <div key={i} className="flashcard-meaning">
                    {m.pos && <span className="pos-tag">[{m.pos}]</span>}
                    {m.meaning}
                  </div>
                ))}
              </div>

              {/* 예문 */}
              {currentWord.example && (
                <div className="flashcard-example">
                  <div className="example-en">{currentWord.example}</div>
                  {currentWord.exampleKo && (
                    <div className="example-ko">{currentWord.exampleKo}</div>
                  )}
                </div>
              )}
            </>
          )}

          {/* 네비게이션 (화면 하단) */}
          <div className="flashcard-nav">
            <button className="nav-btn" onClick={(e) => { e.stopPropagation(); handlePrevWord(); }}>
              ◀
            </button>
            <span className="word-indicator">
              {currentWordIndex + 1} / {chapterWords.length}
            </span>
            <button className="nav-btn" onClick={(e) => { e.stopPropagation(); handleNextWord(); }}>
              ▶
            </button>
          </div>
        </div>

        {/* 챕터 선택 모달 */}
        {showChapterModal && (
          <div className="chapter-modal-backdrop" onClick={() => setShowChapterModal(false)}>
            <div className="chapter-modal" onClick={(e) => e.stopPropagation()}>
              <div className="chapter-modal-list">
                {chapterPageItems.map((ch) => (
                  <button
                    key={ch}
                    className={`chapter-modal-item ${ch === chapter ? 'active' : ''}`}
                    onClick={() => handleChangeChapter(ch)}
                  >
                    Level {ch}
                  </button>
                ))}
              </div>
              <div className="chapter-modal-footer">
                {chapterPage} / {chapterTotalPages}
              </div>
              <div className="chapter-modal-page-buttons">
                <button
                  disabled={chapterPage === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setChapterPage((p) => p - 1);
                  }}
                >
                  ◀
                </button>
                <button
                  disabled={chapterPage >= chapterTotalPages}
                  onClick={(e) => {
                    e.stopPropagation();
                    setChapterPage((p) => p + 1);
                  }}
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 챕터 이동 확인 다이얼로그 */}
        {showNavDialog && (
          <div className="end-dialog-backdrop">
            <div className="end-dialog">
              <h3>
                {navDialogType === 'first' 
                  ? '첫 단어입니다' 
                  : '마지막 단어입니다'}
              </h3>
              <p>
                {navDialogType === 'first'
                  ? '이전 챕터로 이동하시겠습니까?'
                  : '다음 챕터로 이동하시겠습니까?'}
              </p>
              <div className="end-dialog-buttons">
                <button onClick={() => handleNavDialog(false)}>취소</button>
                <button onClick={() => handleNavDialog(true)}>
                  {navDialogType === 'first' ? '이전 챕터' : '다음 챕터'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Review;
