// src/components/WordList.jsx
import { useMemo, useState, useRef } from 'react';
import words from '../data/words.json';

function WordList({ chapter, setChapter, maxChapter }) {
  const WORDS_PER_PAGE = 10;
  const CHAPTERS_PER_PAGE = 10;

  const [page, setPage] = useState(1);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterPage, setChapterPage] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [nextChapterDirection, setNextChapterDirection] = useState(null);
  const [displayMode, setDisplayMode] = useState('both');
  const [showSettings, setShowSettings] = useState(false);
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

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
  };

  const openChapterModal = () => {
    const currentPage = Math.floor((chapter - 1) / CHAPTERS_PER_PAGE) + 1;
    setChapterPage(currentPage);
    setShowChapterModal(true);
  };

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

  return (
    <>
      {/* 설정 버튼 */}
      <button
        className="wordlist-settings-btn"
        onClick={() => setShowSettings(!showSettings)}
      >
        ⚙️
      </button>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="wordlist-settings-panel">
          <div className="setting-item">
            <label>표시 모드:</label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value)}
            >
              <option value="both">둘다 보기</option>
              <option value="word-only">단어만</option>
              <option value="meaning-only">뜻만</option>
            </select>
          </div>
        </div>
      )}

      <div
        className="wordlist-wrap"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 챕터 선택 버튼 */}
        <button className="wordlist-level-btn" onClick={openChapterModal}>
          Level {chapter}
          <span className="level-arrow">▼</span>
        </button>

        {/* 챕터이름과 페이지 정보 */}
        <div className="wordlist-header">
          <span className="header-label">챕터이름</span>
          <span className="header-value">
            {page} / {totalPages}
          </span>
        </div>

        <table className="wordlist-table">
          <tbody>
            {pageWords.map((word) => (
              <tr key={word.id}>
                {(displayMode === 'both' || displayMode === 'word-only') && (
                  <td className="word-cell">{word.word}</td>
                )}
                {(displayMode === 'both' || displayMode === 'meaning-only') && (
                  <td className="meaning-cell">{word.meaning}</td>
                )}
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
    </>
  );
}

export default WordList;
