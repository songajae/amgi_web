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
  const [tempReviewMode, setTempReviewMode] = useState('word-first'); // 모달용 임시 상태
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [nextChapterDirection, setNextChapterDirection] = useState(null);
  const [modalTouchStart, setModalTouchStart] = useState(0);
  const [modalTouchEnd, setModalTouchEnd] = useState(0);

  const [autoPronounce, setAutoPronounce] = useState(true); // 전체 소리 ON/OFF
  const [pronounceExample, setPronounceExample] = useState(true); // 예문 발음 ON/OFF

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const CHAPTERS_PER_PAGE = 20; // 2열 x 10행

  // TTS 함수: 한 문장 읽기
  const speakText = (text) => {
    if (!text || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // 단어 + 예문을 순서대로 읽기 (뜻→단어 모드에서 사용)
  const speakWordThenExample = (wordText, exampleText, enableExample) => {
    if (!wordText || !autoPronounce || !window.speechSynthesis) return;

    const wordUtter = new SpeechSynthesisUtterance(wordText);
    wordUtter.lang = 'en-US';
    wordUtter.rate = 0.95;
    wordUtter.volume = 1;

    wordUtter.onend = () => {
      if (enableExample && exampleText && autoPronounce) {
        const exUtter = new SpeechSynthesisUtterance(exampleText);
        exUtter.lang = 'en-US';
        exUtter.rate = 0.95;
        exUtter.volume = 1;
        window.speechSynthesis.speak(exUtter);
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(wordUtter);
  };

  const chapterWords = useMemo(
    () => words.filter((w) => (w.chapter || 1) === chapter),
    [chapter]
  );

  // 랜덤 인덱스 생성
  useEffect(() => {
    if (isRandomMode && chapterWords.length > 0) {
      const indices = Array.from({ length: chapterWords.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setRandomIndices(indices);
    } else {
      setRandomIndices([]);
    }
  }, [isRandomMode, chapterWords.length, chapter]);

  // 챕터 변경 시 인덱스 초기화
  useEffect(() => {
    setCurrentWordIndex(0);
    setShowContent(false);
    setStudiedWords(new Set());
  }, [chapter]);

  // 첫 단어 자동 발음
  useEffect(() => {
    if (!autoPronounce) return;
    if (chapterWords.length === 0) return;

    const idx =
      isRandomMode && randomIndices.length > 0
        ? randomIndices[0]
        : 0;
    const firstWord = chapterWords[idx];

    if (!firstWord?.word) return;

    if (reviewMode === 'word-first') {
      speakText(firstWord.word);
    } else if (reviewMode === 'meaning-first') {
      // 뜻 먼저 모드: 처음엔 무음
    }
  }, [chapterWords, isRandomMode, randomIndices, reviewMode, autoPronounce]);

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

  const handleNextWord = () => {
    const lastIndex = chapterWords.length - 1;
    const isLast = currentWordIndex >= lastIndex;

    if (!isLast) {
      const nextIdx = currentWordIndex + 1;
      setCurrentWordIndex(nextIdx);
      setShowContent(false);

      const newStudiedWords = new Set(studiedWords);
      newStudiedWords.add(getCurrentIndex());
      setStudiedWords(newStudiedWords);

      if (newStudiedWords.size >= chapterWords.length) {
        setShowEndDialog(true);
      }

      const realIndex =
        isRandomMode && randomIndices.length > 0
          ? randomIndices[nextIdx]
          : nextIdx;
      const nextWord = chapterWords[realIndex];

      if (autoPronounce && nextWord?.word) {
        if (reviewMode === 'word-first') {
          speakText(nextWord.word);
        } else if (reviewMode === 'meaning-first') {
          // 뜻 화면에서는 무음
        }
      }
    } else {
      setNextChapterDirection('next');
      setShowConfirmDialog(true);
    }
  };

  const handlePrevWord = () => {
    if (currentWordIndex > 0) {
      const prevIdx = currentWordIndex - 1;
      setCurrentWordIndex(prevIdx);
      setShowContent(false);

      const realIndex =
        isRandomMode && randomIndices.length > 0
          ? randomIndices[prevIdx]
          : prevIdx;
      const prevWord = chapterWords[realIndex];

      if (autoPronounce && prevWord?.word) {
        if (reviewMode === 'word-first') {
          speakText(prevWord.word);
        } else if (reviewMode === 'meaning-first') {
          // 뜻 화면에서는 무음
        }
      }
    } else {
      setNextChapterDirection('prev');
      setShowConfirmDialog(true);
    }
  };

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

  const parseMeanings = (pos, meaning) => {
    if (!meaning) return [];

    const meanings = [];
    const parts = meaning.split(',').map((m) => m.trim());

    if (pos && pos.includes(',')) {
      const posList = pos.split(',').map((p) => p.trim());
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

  // 카드 탭 시 발음 규칙
  const handleCardClick = () => {
    if (!showContent) {
      setShowContent(true);

      if (!autoPronounce) return;

      if (reviewMode === 'word-first') {
        // 단어→뜻: 예문만
        if (pronounceExample && currentWord.example) {
          speakText(currentWord.example);
        }
      } else if (reviewMode === 'meaning-first') {
        // 뜻→단어: 단어 먼저, 끝나면 예문
        speakWordThenExample(
          currentWord.word,
          currentWord.example,
          pronounceExample
        );
      }
    } else {
      handleNextWord();
    }
  };

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
        handleNextWord();
      } else {
        handlePrevWord();
      }
    }
  };

  // 모달 스와이프 핸들러
  const handleModalTouchStart = (e) => {
    setModalTouchStart(e.touches[0].clientX);
  };

  const handleModalTouchEnd = (e) => {
    setModalTouchEnd(e.changedTouches[0].clientX);

    const swipeDistance = modalTouchStart - e.changedTouches[0].clientX;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        setChapterPage((p) => Math.min(chapterTotalPages, p + 1));
      } else {
        setChapterPage((p) => Math.max(1, p - 1));
      }
    }
  };

  // 모달에서 학습 모드 토글 (단어→뜻 / 뜻→단어) + 즉시 적용
  const handleReviewModeToggleClick = () => {
    setTempReviewMode((prev) => {
      const next = prev === 'word-first' ? 'meaning-first' : 'word-first';
      setReviewMode(next);
      setShowContent(false);
      setCurrentWordIndex(0);
      setStudiedWords(new Set());
      return next;
    });
  };

  const speakerIcon = autoPronounce ? '🔊' : '🔇';

  return (
    <div className="review-container">
      {/* 상단 컨트롤 바 (박스 밖) */}
      <div className="review-controls">
        <button
          className="review-level-btn-outside"
          onClick={openChapterModal}
        >
          Level {chapter}
          <span className="level-arrow">▼</span>
        </button>

        <button
          className="review-random-btn-outside"
          onClick={handleRandomModeToggle}
        >
          {isRandomMode ? '랜덤' : '순차'}
        </button>

        {/* 스피커 토글 버튼 */}
        <button
          className="review-auto-btn-outside"
          onClick={() => setAutoPronounce((prev) => !prev)}
        >
          {speakerIcon}
        </button>

        <button
          className="review-settings-btn-outside"
          onClick={() => {
            setTempReviewMode(reviewMode);
            setShowSettings(true);
          }}
        >
          ⚙️
        </button>
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div
          className="review-settings-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="review-settings-header">
            <span className="review-settings-title">학습 설정</span>
            <button
              className="settings-close-btn"
              onClick={() => setShowSettings(false)}
            >
              ✕
            </button>
          </div>

          <div className="setting-item review-setting-item-row">
            <span className="review-setting-label">학습 모드:</span>
            <button
              className="review-mode-toggle-btn"
              onClick={handleReviewModeToggleClick}
            >
              {tempReviewMode === 'word-first' ? '단어 → 뜻' : '뜻 → 단어'}
            </button>
          </div>

          <div className="setting-item review-setting-item-row">
            <span className="review-setting-label">예문 발음:</span>
            <button
              className="review-mode-toggle-btn"
              onClick={() => setPronounceExample((prev) => !prev)}
            >
              {pronounceExample ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}

      {/* 단어 카드 */}
      <div
        className="flashcard review-flashcard"
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 단어 먼저 모드 */}
        {reviewMode === 'word-first' && (
          <div className="review-content-top">
            <div className="flashcard-word">
              {currentWord.word || 'No word'}
            </div>

            {showContent && (
              <>
                <div className="flashcard-meanings">
                  {meanings.map((m, index) => (
                    <div key={index} className="flashcard-meaning">
                      {m.pos && <span className="pos-tag">{m.pos}</span>}{' '}
                      {m.meaning}
                    </div>
                  ))}
                </div>

                {(currentWord.example || currentWord.exampleMeaning) && (
                  <div className="flashcard-example-inline">
                    {currentWord.example && (
                      <div className="example-en">{currentWord.example}</div>
                    )}
                    {currentWord.exampleMeaning && (
                      <div className="example-ko">
                        {currentWord.exampleMeaning}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 뜻 먼저 모드 */}
        {reviewMode === 'meaning-first' && (
          <div className="review-content-top">
            <div className="flashcard-meanings meanings-first">
              {meanings.map((m, index) => (
                <div key={index} className="flashcard-meaning">
                  {m.pos && <span className="pos-tag">{m.pos}</span>}{' '}
                  {m.meaning}
                </div>
              ))}
            </div>

            {showContent && (
              <>
                <div className="flashcard-word">
                  {currentWord.word || 'No word'}
                </div>

                {(currentWord.example || currentWord.exampleMeaning) && (
                  <div className="flashcard-example-inline">
                    {currentWord.example && (
                      <div className="example-en">{currentWord.example}</div>
                    )}
                    {currentWord.exampleMeaning && (
                      <div className="example-ko">
                        {currentWord.exampleMeaning}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
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
        <div
          className="end-dialog-backdrop"
          onClick={(e) => e.stopPropagation()}
        >
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
          <div
            className="chapter-modal"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleModalTouchStart}
            onTouchEnd={handleModalTouchEnd}
          >
            <div className="chapter-modal-list">
              <div className="chapter-modal-grid">
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
                    Level {ch}
                  </button>
                ))}
              </div>
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
