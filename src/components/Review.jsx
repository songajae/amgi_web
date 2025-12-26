// src/components/Review.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import words from '../data/words.json';

function Review({ chapter, setChapter, maxChapter }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterPage, setChapterPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [randomIndices, setRandomIndices] = useState([]);
  const [studiedWords, setStudiedWords] = useState(new Set());
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [reviewMode, setReviewMode] = useState('word-first');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [nextChapterDirection, setNextChapterDirection] = useState(null);
  
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
    setShowContent(false);
    setStudiedWords(new Set());
  }, [chapter]);

  // 랜덤 모드 변경 시 초기화
  const handleRandomModeToggle = () => {
    setIsRandomMode(!isRandomMode);
    setCurrentWordIndex(0);
    setShowContent(false);
    setStudiedWords(new Set());
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
    if (currentWordIndex < chapterWords.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
      setShowContent(false);
      
      // 현재 단어를 학습한 것으로 표시
      const newStudiedWords = new Set(studiedWords);
      newStudiedWords.add(getCurrentIndex());
      setStudiedWords(newStudiedWords);
      
      // 모든 단어를 학습했는지 확인
      if (newStudiedWords.size >= chapterWords.length) {
        setShowEndDialog(true);
      }
    } else {
      // 마지막 단어
      setNextChapterDirection('next');
      setShowConfirmDialog(true);
    }
  };

  // 이전 단어로 이동
  const handlePrevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex((prev) => prev - 1);
      setShowContent(false);
    } else {
      // 첫 단어
      setNextChapterDirection('prev');
      setShowConfirmDialog(true);
    }
  };

  // 챕터 이동 확인 다이얼로그
  const handleConfirmChapterChange = (confirm) => {
    setShowConfirmDialog(false);
    if (confirm) {
      if (nextChapterDirection === 'next') {
        if (chapter < maxChapter) {
          setChapter(chapter + 1);
          setCurrentWordIndex(0);
          setShowContent(false);
          setStudiedWords(new Set());
        }
      } else if (nextChapterDirection === 'prev') {
        if (chapter > 1) {
          setChapter(chapter - 1);
          setCurrentWordIndex(0);
          setShowContent(false);
          setStudiedWords(new Set());
        }
      }
    } else {
      // 취소시 첫 단어나 마지막 단어로 이동
      if (nextChapterDirection === 'next') {
        setCurrentWordIndex(0);
        setShowContent(false);
      } else if (nextChapterDirection === 'prev') {
        setCurrentWordIndex(chapterWords.length - 1);
        setShowContent(false);
      }
    }
    setNextChapterDirection(null);
  };

  const handleChapterEnd = (action) => {
    setShowEndDialog(false);
    if (action === 'next' && chapter < maxChapter) {
      setChapter(chapter + 1);
      setCurrentWordIndex(0);
      setStudiedWords(new Set());
    } else {
      setCurrentWordIndex(0);
      setStudiedWords(new Set());
    }
  };

  // 챕터 변경
  const handleChangeChapter = (nextChapter) => {
    setChapter(nextChapter);
    setCurrentWordIndex(0);
    setShowChapterModal(false);
    setShowContent(false);
    setStudiedWords(new Set());
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

  // 터치/클릭으로 내용 보이기
  const handleCardClick = () => {
    if (!showContent) {
      // 단어만 보이는 상태 → 뜻 표시
      setShowContent(true);
    } else {
      // 뜻이 보이는 상태 → 다음 단어
      handleNextWord();
    }
  };

  // 학습 모드 변경 및 설정 닫기
  const handleReviewModeChange = (e) => {
    setReviewMode(e.target.value);
    setShowContent(false);
    setCurrentWordIndex(0);
    setStudiedWords(new Set());
    setShowSettings(false); // 모달 닫기
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

    if (swipeDistanceY > 50) return;

    if (Math.abs(swipeDistanceX) > minSwipeDistance) {
      if (swipeDistanceX > 0) {
        // 왼쪽으로 스와이프 = 다음 단어
        handleNextWord();
      } else {
        // 오른쪽으로 스와이프 = 이전 단어
        handlePrevWord();
      }
    }
  };

  return (
    <div className="review-container">
      {/* 단어 카드 */}
      <div
        className="flashcard review-flashcard"
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Level 표시 (주황색 박스) */}
        <button
          className="review-level-btn"
          onClick={(e) => {
            e.stopPropagation();
            openChapterModal();
          }}
        >
          Level {chapter}
          <span className="level-arrow">▼</span>
        </button>

        {/* 설정 버튼 */}
        <button
          className="settings-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowSettings(!showSettings);
          }}
        >
          ⚙️
        </button>

        {/* 랜덤 학습 버튼 */}
        <button
          className="random-btn-text"
          onClick={(e) => {
            e.stopPropagation();
            handleRandomModeToggle();
          }}
        >
          단어 순서 랜덤 : {isRandomMode ? 'ON' : 'OFF'}
        </button>

        {/* 설정 패널 */}
        {showSettings && (
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="setting-item">
              <label>학습 모드:</label>
              <select
                value={reviewMode}
                onChange={handleReviewModeChange}
              >
                <option value="word-first">단어 → 뜻</option>
                <option value="meaning-first">뜻 → 단어</option>
              </select>
            </div>
          </div>
        )}

        {/* 단어 먼저 모드 */}
        {reviewMode === 'word-first' && (
          <>
            <div className="flashcard-word">{currentWord.word || 'No word'}</div>
            
            {showContent && (
              <>
                <div className="flashcard-meanings">
                  {meanings.map((m, index) => (
                    <div key={index} className="flashcard-meaning">
                      {m.pos && <span className="pos-tag">{m.pos}</span>} {m.meaning}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* 뜻 먼저 모드 */}
        {reviewMode === 'meaning-first' && (
          <>
            <div className="flashcard-meanings meanings-first">
              {meanings.map((m, index) => (
                <div key={index} className="flashcard-meaning">
                  {m.pos && <span className="pos-tag">{m.pos}</span>} {m.meaning}
                </div>
              ))}
            </div>
            
            {showContent && (
              <>
                <div className="flashcard-word">{currentWord.word || 'No word'}</div>
              </>
            )}
          </>
        )}

        {/* 카드 네비게이션 (박스 맨 아래 고정) */}
        <div className="flashcard-nav-fixed">
          <button
            className="nav-btn"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevWord();
            }}
          >
            ◀
          </button>
          <span className="word-indicator">
            {currentWordIndex + 1} / {chapterWords.length}
          </span>
          <button
            className="nav-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleNextWord();
            }}
          >
            ▶
          </button>
        </div>

        {/* 예문 (네비게이션 위) */}
        {showContent && (currentWord.example || currentWord.exampleMeaning) && (
          <div className="flashcard-example-above-nav">
            {currentWord.example && (
              <div className="example-en">{currentWord.example}</div>
            )}
            {currentWord.exampleMeaning && (
              <div className="example-ko">{currentWord.exampleMeaning}</div>
            )}
          </div>
        )}
      </div>

      {/* 챕터 이동 확인 다이얼로그 */}
      {showConfirmDialog && (
        <div className="end-dialog-backdrop">
          <div className="end-dialog">
            <h3>
              {nextChapterDirection === 'next'
                ? '마지막 단어입니다'
                : '첫 단어입니다'}
            </h3>
            <p>
              {nextChapterDirection === 'next'
                ? '다음 챕터로 이동하시겠습니까?'
                : '이전 챕터로 이동하시겠습니까?'}
            </p>
            <div className="end-dialog-buttons">
              <button onClick={() => handleConfirmChapterChange(false)}>
                취소
              </button>
              <button onClick={() => handleConfirmChapterChange(true)}>
                이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 챕터 끝 다이얼로그 */}
      {showEndDialog && (
        <div className="end-dialog-backdrop" onClick={(e) => e.stopPropagation()}>
          <div className="end-dialog">
            <h3>챕터 완료!</h3>
            <p>모든 단어를 학습했습니다.</p>
            <div className="end-dialog-buttons">
              <button onClick={() => handleChapterEnd('repeat')}>
                처음부터 다시
              </button>
              {chapter < maxChapter && (
                <button onClick={() => handleChapterEnd('next')}>
                  다음 챕터
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 챕터 선택 모달 */}
      {showChapterModal && (
        <div
          className="chapter-modal-backdrop"
          onClick={() => setShowChapterModal(false)}
        >
          <div className="chapter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chapter-modal-list">
              {chapterPageItems.map((ch) => (
                <button
                  key={ch}
                  className={
                    ch === chapter
                      ? 'chapter-modal-item active'
                      : 'chapter-modal-item'
                  }
                  onClick={() => handleChangeChapter(ch)}
                >
                  ch{ch}. Level {ch}(40)
                </button>
              ))}
            </div>

            <div className="chapter-modal-footer">
              {chapterPage} / {chapterTotalPages}
            </div>

            <div className="chapter-modal-page-buttons">
              <button
                onClick={() => setChapterPage((p) => Math.max(1, p - 1))}
                disabled={chapterPage === 1}
              >
                ◀
              </button>
              <button
                onClick={() =>
                  setChapterPage((p) => Math.min(chapterTotalPages, p + 1))
                }
                disabled={chapterPage === chapterTotalPages}
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Review;
