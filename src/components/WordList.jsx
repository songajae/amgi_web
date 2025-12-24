// src/components/WordList.jsx
import { useMemo, useState } from 'react';
import words from '../data/words.json';

function WordList({ chapter, setChapter, maxChapter }) {
  const WORDS_PER_CHAPTER = 40;
  const WORDS_PER_PAGE = 10;          // 단어장 한 화면 단어 수
  const CHAPTERS_PER_PAGE = 10;       // 모달 한 화면 챕터 수

  // 단어 페이징
  const [page, setPage] = useState(1);

  // 챕터 선택 모달 상태
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterPage, setChapterPage] = useState(1); // 모달 내 페이지

  // 현재 챕터 단어들
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

  // 챕터 리스트 -> 페이지 나누기
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
    // 현재 챕터가 포함된 페이지로 이동
    const currentPage =
      Math.floor((chapter - 1) / CHAPTERS_PER_PAGE) + 1;
    setChapterPage(currentPage);
    setShowChapterModal(true);
  };

  return (
    <>
      <section className="word-card">
        {/* 카드 상단: 왼쪽 제목, 오른쪽 Level 버튼 */}
        <header className="word-card-header">
          <div className="word-card-title">챕터이름</div>

          <button className="word-card-level" onClick={openChapterModal}>
            ch{chapter}. Level {chapter}(
            {chapterWords.length || WORDS_PER_CHAPTER})
          </button>
        </header>

        {/* 단어 리스트 (현재 페이지) */}
        <div className="word-list">
          {pageWords.map((w) => (
            <div key={w.id} className="word-row">
              <div className="word-left">{w.word}</div>
              <div className="word-right">
                {w.pos && <span className="word-pos">{w.pos}</span>}
                <span>{w.meaning}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 페이지 표시 */}
        <footer className="word-card-footer">
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ◀
          </button>
          <span className="page-indicator">
            {page} / {totalPages}
          </span>
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            ▶
          </button>
        </footer>
      </section>

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
            <div className="chapter-modal-list">
              {chapterPageItems.map((ch) => (
                <button
                  key={ch}
                  className={
                    'chapter-modal-item' +
                    (ch === chapter ? ' active' : '')
                  }
                  onClick={() => handleChangeChapter(ch)}
                >
                  ch{ch}. Level {ch}(40)
                </button>
              ))}
            </div>

            {/* 모달 하단 페이지 표시 (예: 1 / 3) */}
            <div className="chapter-modal-footer">
              {chapterPage} / {chapterTotalPages}
            </div>

            {/* 모달 페이지 이동 버튼 (옵션) */}
            {chapterTotalPages > 1 && (
              <div className="chapter-modal-page-buttons">
                <button
                  onClick={() =>
                    setChapterPage((p) => Math.max(1, p - 1))
                  }
                  disabled={chapterPage === 1}
                >
                  ◀
                </button>
                <button
                  onClick={() =>
                    setChapterPage((p) =>
                      Math.min(chapterTotalPages, p + 1),
                    )
                  }
                  disabled={chapterPage === chapterTotalPages}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default WordList;
