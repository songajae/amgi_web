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
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // 표시 모드 변경시 로컬스토리지에 저장
  useEffect(() => {
    localStorage.setItem('wordlist-display-mode', displayMode);
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
  }, []); // 빈 배열: 최초 마운트 시에만 실행

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
    // 페이지 변경 시 터치 상태 초기화
    setShowWordsByTouch(true);
    setShowMeaningsByTouch(true);
  };

  const openChapterModal = () => {
    const currentPage = Math.floor((chapter - 1) / CHAPTERS_PER_PAGE) + 1;
    setChapterPage(currentPage);
    setShowChapterModal(true);
  };

  // 표시 모드 순환
  const toggleDisplayMode = () => {
    setDisplayMode((prev) => {
      if (prev === 'both') return 'word-only';
      if (prev === 'word-only') return 'meaning-only';
      return 'both';
    });
    // 옵션 변경 시 터치 상태 초기화
    setShowWordsByTouch(true);
    setShowMeaningsByTouch(true);
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
    const parts = meaning.split(',').map(m => m.trim());
    return parts.slice(0, 2).join(', ');
  };

  // 테이블 셀 클릭 핸들러
  const handleCellClick = (e, side) => {
    // 모달이 열려있거나 버튼 클릭은 무시
    if (e.target.closest('button')) return;
    
    if (side === 'left') {
      setShowWordsByTouch(prev => !prev);
    } else {
      setShowMeaningsByTouch(prev => !prev);
    }
  };

  // 페이지 변경 시 터치 상태 초기화
  useEffect(() => {
    setShowWordsByTouch(true);
    setShowMeaningsByTouch(true);
  }, [page]);

  // 스와이프로 페이지 & 챕터 이동
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
        if (page < totalPages) {
          setPage((p) => p + 1);
        } else if (chapter < maxChapter) {
          setNextChapterDirection('next');
          setShowConfirmDialog(true);
        }
      } else {
        if (page > 1) {
          setPage((p) => p - 1);
        } else if (chapter > 1) {
          setNextChapterDirection('prev');
          setShowConfirmDialog(true);
        }
      }
    }
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

  // 실제 표시 여부 결정
  // 왼쪽 셀: displayMode에 따라 기본 표시 여부 결정 + 터치 상태
  const getWordDisplay = () => {
    // 터치로 숨긴 경우 무조건 숨김
    if (!showWordsByTouch) return false;
    
    // 터치로 숨기지 않은 경우 displayMode 확인
    return displayMode === 'both' || displayMode === 'word-only';
  };

  // 오른쪽 셀: displayMode에 따라 기본 표시 여부 결정 + 터치 상태
  const getMeaningDisplay = () => {
    // 터치로 숨긴 경우 무조건 숨김
    if (!showMeaningsByTouch) return false;
    
    // 터치로 숨기지 않은 경우 displayMode 확인
    return displayMode === 'both' || displayMode === 'meaning-only';
  };

  return (
    <>
      <div
        className="wordlist-wrap"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 상단 버튼 그룹 */}
        <div className="wordlist-header-buttons">
          <button className="wordlist-level-btn" onClick={openChapterModal}>
            Level {chapter}
            <span className="level-arrow">▼</span>
          </button>

          <button className="wordlist-mode-btn" onClick={toggleDisplayMode}>
            {getDisplayModeText()}
            <span className="level-arrow">▼</span>
          </button>
        </div>

        {/* 단어 테이블 */}
        <table className="wordlist-table">
          <tbody>
            {pageWords.map((word) => (
              <tr key={word.id}>
                <td 
                  className="word-cell-50"
                  onClick={(e) => handleCellClick(e, 'left')}
                >
                  {getWordDisplay() && word.word}
                </td>
                <td 
                  className="meaning-cell-50"
                  onClick={(e) => handleCellClick(e, 'right')}
                >
                  {getMeaningDisplay() && getTwoMeanings(word.meaning)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지 이동 버튼 */}
        <div className="wordlist-pagination">
          <button
            className="page-nav-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ◀
          </button>
          <span className="page-info">
            {page} / {totalPages}
          </span>
          <button
            className="page-nav-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            ▶
          </button>
        </div>
      </div>

      {/* 챕터 변경 확인 다이얼로그 */}
      {showConfirmDialog && (
        <div className="end-dialog-backdrop">
          <div className="end-dialog">
            <h3>챕터 이동</h3>
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
                  Level {ch}
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
    </>
  );
}

export default WordList;
