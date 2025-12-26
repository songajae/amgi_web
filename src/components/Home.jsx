// src/components/Home.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import words from '../data/words.json';
import youtubeData from '../data/youtube.json';

function Home({ chapter, setChapter, maxChapter }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [videoInfo, setVideoInfo] = useState(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterPage, setChapterPage] = useState(1);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3000);
  const [showSettings, setShowSettings] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [showDetail, setShowDetail] = useState(false); // 단어만/뜻·예문 단계 토글

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

  // 챕터가 변경되면 첫 단어로 리셋
  useEffect(() => {
    setCurrentWordIndex(0);
    setShowDetail(false); // 챕터 바뀌면 항상 단어만부터
  }, [chapter]);

  // 자동 재생 기능: 단어 -> 뜻/예문 -> 다음 단어 -> ...
  useEffect(() => {
    if (!isAutoPlay || chapterWords.length === 0) return;

    const timer = setInterval(() => {
      setShowDetail((prevDetail) => {
        if (!prevDetail) {
          // 1단계: 단어만 → 뜻/예문 표시
          return true;
        } else {
          // 2단계: 뜻/예문까지 본 상태 → 다음 단어로 이동 + 단어만
          setCurrentWordIndex((prev) => {
            if (prev >= chapterWords.length - 1) {
              return 0;
            }
            return prev + 1;
          });
          return false;
        }
      });
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isAutoPlay, autoPlayInterval, chapterWords.length]);


  // YouTube oEmbed API로 비디오 정보 가져오기
  useEffect(() => {
    if (!youtubeData?.videoId) {
      return;
    }

    const fetchVideoInfo = async () => {
      try {
        const url = `https://www.youtube.com/watch?v=${youtubeData.videoId}`;
        const response = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        );
        if (response.ok) {
          const data = await response.json();
          setVideoInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch video info:', error);
        setVideoInfo(null);
      }
    };

    fetchVideoInfo();
  }, []);

  const currentWord = chapterWords[currentWordIndex] || {};

  const handlePrevWord = () => {
    setCurrentWordIndex((prev) => {
      if (prev === 0) return chapterWords.length - 1; // 처음이면 마지막으로
      return prev - 1;
    });
  };

  const handleNextWord = () => {
    setCurrentWordIndex((prev) => {
      if (prev >= chapterWords.length - 1) return 0; // 마지막이면 처음으로
      return prev + 1;
    });
  };

  // 챕터 변경
  const handleChangeChapter = (nextChapter) => {
    setChapter(nextChapter);
    setCurrentWordIndex(0);
    setShowChapterModal(false);
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

  // 스와이프 감지 (단어 넘기기 & 챕터 변경)
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
        // 왼쪽 스와이프 = 다음 단어
        handleNextWord();
      } else {
        // 오른쪽 스와이프 = 이전 단어
        handlePrevWord();
      }
    }
  };

  return (
    <div className="home-container">
      {/* 상단 컨트롤 바 (박스 밖) */}
      <div className="home-controls">
        <button
          className="review-level-btn-outside"
          onClick={openChapterModal}
        >
          Level {chapter}
          <span className="level-arrow">▼</span>
        </button>

        <button
          className="home-settings-btn-outside"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️
        </button>
      </div>

      {/* 단어 카드 */}
      <div
        className="flashcard"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >


        {/* 설정 패널 */}
        {showSettings && (
          <div className="settings-panel">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={isAutoPlay}
                  onChange={(e) => setIsAutoPlay(e.target.checked)}
                />
                자동 재생
              </label>
            </div>
            <div className="setting-item">
              <label>
                단어 전환 시간: {autoPlayInterval / 1000}초
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={autoPlayInterval}
                  onChange={(e) => setAutoPlayInterval(Number(e.target.value))}
                />
              </label>
            </div>
          </div>
        )}

        <div className="flashcard-word">{currentWord.word || 'No word'}</div>
        <div className="flashcard-meanings">
          {meanings.map((m, index) => (
            <div key={index} className="flashcard-meaning">
              {m.pos && <span className="pos-tag">{m.pos}</span>} {m.meaning}
            </div>
          ))}
        </div>
        <div className="flashcard-example">
          {currentWord.example && (
            <div className="example-en">{currentWord.example}</div>
          )}
          {currentWord.exampleMeaning && (
            <div className="example-ko">{currentWord.exampleMeaning}</div>
          )}
        </div>

        {/* 카드 네비게이션 */}
        <div className="flashcard-nav">
          <button className="nav-btn" onClick={handlePrevWord}>
            ◀
          </button>
          <span className="word-indicator">
            {currentWordIndex + 1} / {chapterWords.length}
          </span>
          <button className="nav-btn" onClick={handleNextWord}>
            ▶
          </button>
        </div>
      </div>

      {/* 유튜브 영상 */}
      {youtubeData?.videoId && (
        <div className="youtube-section">
          <a
            href={`https://www.youtube.com/watch?v=${youtubeData.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="youtube-link"
          >
            <div className="youtube-thumbnail">
              <img
                src={
                  videoInfo?.thumbnail_url ||
                  `https://img.youtube.com/vi/${youtubeData.videoId}/hqdefault.jpg`
                }
                alt="YouTube Thumbnail"
              />
            </div>
            <div className="youtube-info">
              <div className="youtube-title">
                {videoInfo?.title || 'Loading...'}
              </div>
            </div>
          </a>
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

export default Home;
