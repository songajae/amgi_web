// 전체 소스 코드 (단어/뜻 TTS 딜레이 분리 + 정확한 타이밍)
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  const [showDetail, setShowDetail] = useState(false); // 단어만 / 단어+뜻·예문 토글

  // 🔊 홈 TTS on/off
  const [isSoundOn, setIsSoundOn] = useState(true);

  // 설정 모달 열렸을 때 자동재생 일시정지용
  const [savedAutoPlay, setSavedAutoPlay] = useState(true);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // TTS 제어용 refs
  const isTtsActiveRef = useRef(false);
  const autoPlayTimerRef = useRef(null);

  const CHAPTERS_PER_PAGE = 20;

  // 현재 챕터의 단어들
  const chapterWords = useMemo(
    () => words.filter((w) => (w.chapter || 1) === chapter),
    [chapter]
  );

  const currentWord = chapterWords[currentWordIndex] || {};

  // 챕터가 변경되면 첫 단어로 리셋
  useEffect(() => {
    setCurrentWordIndex(0);
    setShowDetail(false); // 항상 단어만부터 시작
  }, [chapter]);

  // pos와 meaning 파싱
  const parseMeanings = useCallback((pos, meaning) => {
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
  }, []);

  // TTS 재생 함수 (Promise 반환 - 중복 방지)
  const speakText = useCallback((text, lang = 'en-US', rate = 0.95, volume = 1) => {
    return new Promise((resolve) => {
      if (!isSoundOn || typeof window === 'undefined' || !window.speechSynthesis || isTtsActiveRef.current) {
        resolve();
        return;
      }

      isTtsActiveRef.current = true;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = rate;
      utter.volume = volume;

      utter.onend = () => {
        isTtsActiveRef.current = false;
        resolve();
      };
      utter.onerror = () => {
        isTtsActiveRef.current = false;
        resolve();
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    });
  }, [isSoundOn]);

  // 단어만 TTS
  const speakWordOnly = useCallback(async () => {
    if (!currentWord.word || !isSoundOn) return;
    await speakText(currentWord.word, 'en-US', 0.95, 1);
  }, [currentWord.word, speakText, isSoundOn]);

  // 뜻만 TTS (모든 뜻 순차 재생)
  const speakMeaningsOnly = useCallback(async () => {
    if (!currentWord.meaning || !isSoundOn) return;
    const meanings = parseMeanings(currentWord.pos, currentWord.meaning);
    for (const m of meanings) {
      await speakText(m.meaning, 'ko-KR', 0.9, 0.8);
      await new Promise(r => setTimeout(r, 300)); // 뜻들 사이 300ms
    }
  }, [currentWord.pos, currentWord.meaning, parseMeanings, speakText, isSoundOn]);

  // ✅ 1. 단어→뜻: 단어 TTS바로 → autoPlayInterval 딜레이 → 뜻 TTS → 완료 후 다음단어
  // ✅ 2. 뜻→단어: 뜻 TTS바로 → autoPlayInterval 딜레이 → 단어 TTS → 완료 후 다음단어
  useEffect(() => {
    if (!isAutoPlay || chapterWords.length === 0) {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
      return;
    }

    // 기존 타이머 정리
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
    }

    autoPlayTimerRef.current = setTimeout(async () => {
      // 현재 상태에 맞는 TTS 즉시 실행
      if (!showDetail) {
        // 1. 단어만 상태: 단어 TTS 바로 → 딜레이 → showDetail=true (뜻 표시)
        await speakWordOnly();
      } else {
        // 2. 뜻 상태: 뜻 TTS 바로 → 딜레이 → 다음단어 + showDetail=false
        await speakMeaningsOnly();
        const nextIndex = currentWordIndex >= chapterWords.length - 1 ? 0 : currentWordIndex + 1;
        setCurrentWordIndex(nextIndex);
        setShowDetail(false);
        return; // 다음단어로 넘어갔으므로 여기서 종료
      }

      // 500ms 여유 + 설정된 딜레이 적용
      await new Promise(r => setTimeout(r, 500));
      await new Promise(r => setTimeout(r, autoPlayInterval));

      // 상태 전환
      if (showDetail === false) {
        setShowDetail(true); // 단어 → 뜻 표시
      }
    }, 0); // 즉시 시작 (딜레이는 내부에서 처리)

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [isAutoPlay, autoPlayInterval, chapterWords.length, currentWordIndex, showDetail, speakWordOnly, speakMeaningsOnly]);

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

  // 설정 모달 열기/닫기 시 자동재생 일시정지/복원
  const handleToggleSettings = () => {
    setShowSettings((prev) => {
      const next = !prev;
      if (next) {
        // 모달이 열릴 때 현재 자동재생 상태 저장 후 정지
        setSavedAutoPlay(isAutoPlay);
        setIsAutoPlay(false);
      } else {
        // 모달이 닫힐 때 저장된 상태 복원
        setIsAutoPlay(savedAutoPlay);
      }
      return next;
    });
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

  const speakerIcon = isSoundOn ? '🔊' : '🔇';

  // ▶ / ■ 아이콘 사용 (멈춤=■, 재생=▶)
  const playIcon = isAutoPlay ? '▶' : '■';

  return (
    <div className="home-container">
      {/* 상단 컨트롤 바 (박스 밖) */}
      <div className="home-controls">
        {/* 왼쪽 Level 버튼 */}
        <button
          className="review-level-btn-outside"
          onClick={openChapterModal}
        >
          Level {chapter}
          <span className="level-arrow">▼</span>
        </button>

        {/* 오른쪽: 스피커 / 플레이 / 설정 */}
        <div className="home-right-buttons">
          {/* 자동 발음 스피커 */}
          <button
            className="home-icon-btn home-sound-btn"
            onClick={() => setIsSoundOn((prev) => !prev)}
          >
            {speakerIcon}
          </button>

          {/* 자동재생 ▶ / ■ (버튼 크기는 CSS로 고정) */}
          <button
            className="home-icon-btn home-autoplay-btn"
            onClick={() => setIsAutoPlay((prev) => !prev)}
          >
            {playIcon}
          </button>

          {/* ⚙ 설정 (모달 열고 닫을 때 자동재생 일시정지/복원) */}
          <button
            className="review-settings-btn-outside"
            onClick={handleToggleSettings}
          >
            ⚙️
          </button>
        </div>
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
            <button
              className="settings-close-btn"
              onClick={handleToggleSettings}
            >
              ✕
            </button>
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

        {/* 단어: 항상 표시 */}
        <div className="flashcard-word">{currentWord.word || 'No word'}</div>

        {/* showDetail 이 true 일 때만 뜻/예문 표시 */}
        {showDetail && (
          <>
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
          </>
        )}

        {/* 카드 네비게이션 - 박스 하단 고정 */}
        <div className="flashcard-nav flashcard-nav-fixed-home">
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
          <div
            className="chapter-modal"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              touchStartY.current = e.touches[0].clientY;
            }}
            onTouchMove={(e) => {
              touchEndX.current = e.touches[0].clientX;
              touchEndY.current = e.touches[0].clientY;
            }}
            onTouchEnd={() => {
              const swipeDistanceX = touchStartX.current - touchEndX.current;
              const swipeDistanceY = Math.abs(
                touchStartY.current - touchEndY.current
              );
              const minSwipeDistance = 50;

              // 세로 스와이프는 무시
              if (swipeDistanceY > 50) return;

              if (Math.abs(swipeDistanceX) > minSwipeDistance) {
                if (swipeDistanceX > 0) {
                  setChapterPage((prev) =>
                    prev >= chapterTotalPages ? 1 : prev + 1
                  );
                } else {
                  setChapterPage((prev) =>
                    prev <= 1 ? chapterTotalPages : prev - 1
                  );
                }
              }
            }}
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
                onClick={() => setChapterPage((p) => Math.max(1, p - 1))}
                disabled={chapterPage === 1}
              >
                ◀
              </button>
              <button
                onClick={() =>
                  setChapterPage((p) => Math.min(chapterTotalPages, p + 1))
                }
                disabled={chapterPage >= chapterTotalPages}
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
