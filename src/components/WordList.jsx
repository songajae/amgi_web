// src/components/WordList.jsx
import { useMemo, useState, useRef, useEffect } from 'react';
import words from '../data/words.json';

function WordList({ chapter, setChapter, maxChapter }) {
  const WORDS_PER_PAGE = 10;
  const CHAPTERS_PER_PAGE = 10;

  const [page, setPage] = useState(1);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterPage, setChapterPage] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [nextChapterDirection, setNextChapterDirection] = useState(null);

  // 로컬스토리지에서 표시 모드 불러오기
  const [displayMode, setDisplayMode] = useState(() => {
    return localStorage.getItem('wordlist-display-mode') || 'both';
  });

  // 전체 단어/뜻 표시 상태 (터치로 제어)
  const [showWordsByTouch, setShowWordsByTouch] = useState(true);
  const [showMeaningsByTouch, setShowMeaningsByTouch] = useState(true);

  // 단어/뜻 번갈아 보여주기용 스텝 (word-only / meaning-only 모드에서 사용)
  const [stepToggle, setStepToggle] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // 표시 모드 변경시 로컬스토리지에 저장
  useEffect(() => {
    localStorage.setItem('wordlist-display-mode', displayMode);
  }, [displayMode]);

  // displayMode 변경시 터치 상태 초기화
  useEffect(() => {
    if (displayMode === 'both') {
      setShowWordsByTouch(true);
      setShowMeaningsByTouch(true);
    } else if (displayMode === 'word-only') {
      setShowWordsByTouch(true);
      setShowMeaningsByTouch(false);
    } else if (displayMode === 'meaning-only') {
      setShowWordsByTouch(false);
      setShowMeaningsByTouch(true);
    }
    setStepToggle(false);
  }, [displayMode]);

  // 챕터 변경시 로컬스토리지에 저장
  useEffect(() => {
    localStorage.setItem('wordlist-last-chapter', chapter.toString());
  }, [chapter]);

  // 컴포넌트 마운트 시 마지막 챕터 불러오기
  useEffect(() => {
    const lastChapter = localStorage.getItem('wordlist-last-chapter');
    if (lastChapter && parseInt(lastChapter) !== chapter) {
      setChapter(parseInt(lastChapter));
    }
  }, []); // 최초 마운트 시에만 실행

  const chapterWords = useMemo(
    () => words.filter((w) => (w.chapter || 1) === chapter),
    [chapter],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(chapterWords.length / WORDS_PER_PAGE),
  );

  if (page > totalPages) {
    setPage(1);
  }

  const startIndex = (page - 1) * WORDS_PER_PAGE;
  const pageWords = chapterWords.slice(
    startIndex,
    startIndex + WORDS_PER_PAGE,
  );

  // 챕터 모달용 리스트
  const chapterList = Array.from({ length: maxChapter }, (_, i) => i + 1);
  const chapterTotalPages = Math.max(
    1,
    Math.ceil(chapterList.length / CHAPTERS_PER_PAGE),
  );
  const startChapterIndex = (chapterPage - 1) * CHAPTERS_PER_PAGE;
  const chapterPageItems = chapterList.slice(
    startChapterIndex,
    startChapterIndex + CHAPTERS_PER_PAGE,
  );

  const handleChangeChapter = (nextChapter) => {
    setChapter(nextChapter);
    setPage(1);
    setShowChapterModal(false);
  };

  const openChapterModal = () => {
    const currentPage = Math.floor((chapter - 1) / CHAPTERS_PER_PAGE) + 1;
    setChapterPage(currentPage);
    setShowChapterModal(true);
  };

  // 표시 모드 토글 버튼 (상단 "단어만/뜻만" 버튼)
  const toggleDisplayMode = () => {
    setDisplayMode((prev) => {
      if (prev === 'both') return 'word-only';
      if (prev === 'word-only') return 'meaning-only';
      return 'both';
    });
  };

  // 표시 모드 텍스트
  const getDisplayModeText = () => {
    if (displayMode === 'both') return '둘다 보기';
    if (displayMode === 'word-only') return '단어만';
    return '뜻만';
  };

  // 뜻을 쉼표 기준으로 2개만 추출
  const getTwoMeanings = (meaning) => {
    if (!meaning) return '';
    const parts = meaning.split(',').map((m) => m.trim());
    return parts.slice(0, 2).join(', ');
  };

  // 테이블 셀 클릭 핸들러
  const handleCellClick = (e, side) => {
    // 모달이 열려있거나 버튼 클릭은 무시
    if (e.target.closest('button')) return;

    if (side === 'left') {
      setShowWordsByTouch((prev) => !prev);
    } else {
      setShowMeaningsByTouch((prev) => !prev);
    }
  };

  // 페이지 변경 시 터치 상태 초기화
  useEffect(() => {
    if (displayMode === 'both') {
      setShowWordsByTouch(true);
      setShowMeaningsByTouch(true);
    } else if (displayMode === 'word-only') {
      setShowWordsByTouch(true);
      setShowMeaningsByTouch(false);
    } else if (displayMode === 'meaning-only') {
      setShowWordsByTouch(false);
      setShowMeaningsByTouch(true);
    }
    setStepToggle(false);
  }, [page, displayMode]);

  // 스와이프로 페이지 & 챕터 이동 (오른쪽 스와이프 패턴)
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
    const swipeDistanceY = Math.abs(
      touchStartY.current - touchEndY.current,
    );

    const minSwipeDistance = 30;
    const maxVerticalDelta = 80;

    if (touchEndX.current === 0 && touchEndY.current === 0) return;
    if (swipeDistanceY > maxVerticalDelta) return;
    if (Math.abs(swipeDistanceX) < minSwipeDistance) return;

    if (swipeDistanceX > 0) {
      // 오른쪽 → 왼쪽: 다음 페이지 / 모드별 스텝
      if (displayMode === 'both') {
        if (page < totalPages) {
          setPage((p) => p + 1);
        } else if (chapter < maxChapter) {
          setNextChapterDirection('next');
          setShowConfirmDialog(true);
        }
      } else if (displayMode === 'word-only') {
        if (!stepToggle) {
          setShowMeaningsByTouch(true);
          setStepToggle(true);
        } else {
          if (page < totalPages) {
            setPage((p) => p + 1);
          } else if (chapter < maxChapter) {
            setNextChapterDirection('next');
            setShowConfirmDialog(true);
          }
          setShowMeaningsByTouch(false);
          setStepToggle(false);
        }
      } else if (displayMode === 'meaning-only') {
        if (!stepToggle) {
          setShowWordsByTouch(true);
          setStepToggle(true);
        } else {
          if (page < totalPages) {
            setPage((p) => p + 1);
          } else if (chapter < maxChapter) {
            setNextChapterDirection('next');
            setShowConfirmDialog(true);
          }
          setShowWordsByTouch(false);
          setStepToggle(false);
        }
      }
    } else {
      // 왼쪽 → 오른쪽: 이전 페이지 / 이전 챕터
      if (page > 1) {
        setPage((p) => p - 1);
      } else if (chapter > 1) {
        setNextChapterDirection('prev');
        setShowConfirmDialog(true);
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  const handleConfirmChapterChange = (confirm) => {
    setShowConfirmDialog(false);
    if (confirm) {
      if (nextChapterDirection === 'next') {
        handleChangeChapter(chapter + 1);
      } else if (nextChapterDirection === 'prev') {
        handleChangeChapter(chapter - 1);
      }
    }
    setNextChapterDirection(null);
  };

  // 주황색 페이지/모드 버튼 클릭 시 동작 (스와이프와 동일 패턴)
  const handlePageModeClick = () => {
    if (displayMode === 'both') {
      if (page < totalPages) {
        setPage((p) => p + 1);
      } else if (chapter < maxChapter) {
        setNextChapterDirection('next');
        setShowConfirmDialog(true);
      }
    } else if (displayMode === 'word-only') {
      if (!stepToggle) {
        setShowMeaningsByTouch(true);
        setStepToggle(true);
      } else {
        if (page < totalPages) {
          setPage((p) => p + 1);
        } else if (chapter < maxChapter) {
          setNextChapterDirection('next');
          setShowConfirmDialog(true);
        }
        setShowMeaningsByTouch(false);
        setStepToggle(false);
      }
    } else if (displayMode === 'meaning-only') {
      if (!stepToggle) {
        setShowWordsByTouch(true);
        setStepToggle(true);
      } else {
        if (page < totalPages) {
          setPage((p) => p + 1);
        } else if (chapter < maxChapter) {
          setNextChapterDirection('next');
          setShowConfirmDialog(true);
        }
        setShowWordsByTouch(false);
        setStepToggle(false);
      }
    }
  };

  return (
    <>
      <div className="wordlist-wrap">
        {/* 상단 버튼 그룹 */}
        <div className="wordlist-header-buttons">
          <button
            className="wordlist-level-btn"
            onClick={openChapterModal}
          >
            Level {chapter}
            <span className="level-arrow">▼</span>
          </button>

          <button
            className="wordlist-mode-btn"
            onClick={toggleDisplayMode}
          >
            {getDisplayModeText()}
          </button>
        </div>

        {/* 단어 리스트 (회색 박스 없이 전체 영역 사용) */}
        <div
          className="word-card"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="word-list">
            {pageWords.map((word) => (
              <div key={word.id} className="word-row">
                <div
                  className="word-cell-50 word-left"
                  onClick={(e) => handleCellClick(e, 'left')}
                >
                  {showWordsByTouch && word.word}
                </div>
                <div
                  className="meaning-cell-50 word-right"
                  onClick={(e) => handleCellClick(e, 'right')}
                >
                  {showMeaningsByTouch && getTwoMeanings(word.meaning)}
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 - 홈 카드 네비게이션과 동일 스타일 */}
          <div className="word-card-footer">
            <div className="wordlist-pagination">
              <button
                className="nav-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ◀
              </button>
              <span className="word-indicator">
                {page} / {totalPages}
              </span>
              <button
                className="nav-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 챕터 선택 모달 */}
      {showChapterModal && (
        <div
          className="chapter-modal-backdrop"
          onClick={() => setShowChapterModal(false)}
        >
          <div
            className="chapter-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chapter-modal-list chapter-modal-grid">
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

            <div className="chapter-modal-footer">
              {chapterPage} / {chapterTotalPages}
            </div>

            <div className="chapter-modal-page-buttons">
              <button
                onClick={() =>
                  setChapterPage((p) =>
                    p <= 1 ? chapterTotalPages : p - 1,
                  )
                }
              >
                ◀
              </button>
              <button
                onClick={() =>
                  setChapterPage((p) =>
                    p >= chapterTotalPages ? 1 : p + 1,
                  )
                }
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 다음/이전 챕터 확인 다이얼로그 */}
      {showConfirmDialog && (
        <div className="end-dialog-backdrop">
          <div className="end-dialog">
            <h3>알림</h3>
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
    </>
  );
}

export default WordList;
