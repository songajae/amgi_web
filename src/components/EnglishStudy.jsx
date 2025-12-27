// src/components/EnglishStudy.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import videoData from '../data/video-subtitles.json';

function EnglishStudy({ chapter, setChapter }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterPage, setChapterPage] = useState(1);
  const [modalTouchStart, setModalTouchStart] = useState(0);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const subtitleListRef = useRef(null);
  const activeSubtitleRef = useRef(null);
  const pausedTimeRef = useRef(0);

  const SUBTITLES_PER_PAGE = 10;
  const CHAPTERS_PER_PAGE = 20;
  const SUBTITLE_OFFSET = 0; // 자막 오프셋 (초 단위) - 필요시 조정

  // 현재 챕터의 영상 데이터 가져오기
  const currentVideo = useMemo(
    () => videoData.find((v) => v.chapter === chapter) || videoData[0],
    [chapter]
  );

  // 현재 챕터의 자막 리스트
  const subtitles = useMemo(() => {
    if (!currentVideo) return [];
    return currentVideo.subtitles.map(([id, time, text]) => ({
      id,
      startTime: time,
      text,
    }));
  }, [currentVideo]);

  const totalPages = Math.ceil(subtitles.length / SUBTITLES_PER_PAGE);
  const startIndex = (currentPage - 1) * SUBTITLES_PER_PAGE;
  const pageSubtitles = subtitles.slice(
    startIndex,
    startIndex + SUBTITLES_PER_PAGE
  );

  // 챕터 리스트 계산
  const chapterList = useMemo(() => {
    return videoData.map((v) => v.chapter).sort((a, b) => a - b);
  }, []);

  const chapterTotalPages = Math.max(
    1,
    Math.ceil(chapterList.length / CHAPTERS_PER_PAGE)
  );
  const startChapterIndex = (chapterPage - 1) * CHAPTERS_PER_PAGE;
  const chapterPageItems = chapterList.slice(
    startChapterIndex,
    startChapterIndex + CHAPTERS_PER_PAGE
  );

  // 챕터 변경 시 초기화
  useEffect(() => {
    setCurrentPage(1);
    setCurrentTime(0);
    setIsPlaying(false);
    pausedTimeRef.current = 0;

    if (subtitleListRef.current) {
      subtitleListRef.current.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    }
  }, [chapter]);

  // YouTube Player 초기화
  useEffect(() => {
    if (!currentVideo) return;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        createPlayer();
        return;
      }

      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    };

    const createPlayer = () => {
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(currentVideo.videoId);
        playerRef.current.seekTo(0);
        return;
      }

      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: currentVideo.videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    };

    loadYouTubeAPI();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentVideo]);

  const onPlayerReady = () => {
    setIsPlaying(false);
    if (playerRef.current && playerRef.current.getCurrentTime) {
      try {
        const time = Math.floor(playerRef.current.getCurrentTime());
        setCurrentTime(time);
      } catch (e) {
        // ignore
      }
    }
  };

  const onPlayerStateChange = (event) => {
    if (event.data === 1) {
      setIsPlaying(true);
    } else if (event.data === 2 || event.data === 0) {
      setIsPlaying(false);
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const time = Math.floor(playerRef.current.getCurrentTime());
          setCurrentTime(time);
          pausedTimeRef.current = time;
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // 재생 시간 추적 - API 사용
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (playerRef.current && playerRef.current.getCurrentTime) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          try {
            const time = Math.floor(playerRef.current.getCurrentTime());
            setCurrentTime(time);
            pausedTimeRef.current = time;
          } catch (error) {
            // ignore
          }
        }
      }, 300);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentVideo]);

  // active 자막 자동 스크롤
  useEffect(() => {
  const container = subtitleListRef.current;
  const activeEl = activeSubtitleRef.current;

  if (!container || !activeEl) return;

  const containerTop = container.scrollTop;
  const containerHeight = container.clientHeight;
  const activeTop = activeEl.offsetTop;
  const activeHeight = activeEl.clientHeight;

  const targetScrollTop = activeTop - 80;

  const isVisible =
    activeTop >= containerTop + 50 &&
    activeTop + activeHeight <= containerTop + containerHeight - 50;

  if (!isVisible) {
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });
  }
}, [currentTime, currentPage]);

  // 자막 클릭 핸들러
  const handleSubtitleClick = (startTime) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(startTime, true);
      playerRef.current.playVideo();
      setCurrentTime(startTime);
      pausedTimeRef.current = startTime;
      setIsPlaying(true);
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // 챕터 변경 핸들러
  const handleChangeChapter = (newChapter) => {
    setChapter(newChapter);
    setShowChapterModal(false);
    setCurrentPage(1);
    setCurrentTime(0);
    setIsPlaying(false);
    pausedTimeRef.current = 0;
  };

  // 챕터 모달 열기
  const openChapterModal = () => {
    const currentPageNum =
      Math.floor((chapter - 1) / CHAPTERS_PER_PAGE) + 1;
    setChapterPage(currentPageNum);
    setShowChapterModal(true);
  };

  if (!currentVideo) {
    return <div className="no-content">영상 데이터가 없습니다.</div>;
  }

  return (
    <>
      <button className="study-level-btn" onClick={openChapterModal}>
        Level {chapter}
        <span className="level-arrow">▼</span>
      </button>

      <div className="english-study-container">
        <div className="video-player-wrapper">
          <div id="youtube-player"></div>
        </div>

        <div className="video-info">
          <h2 className="video-title">{currentVideo.videoTitle}</h2>
          <span className="video-time">{formatTime(currentTime)}</span>
        </div>

        <div className="subtitle-list-container" ref={subtitleListRef}>
          <div className="subtitle-list">
            {pageSubtitles.map((subtitle) => {
              const adjustedSubtitleTime =
                subtitle.startTime + SUBTITLE_OFFSET;

              // 0초라도 근처면 바로 잡히게, 범위는 3초로 완화
              const isActive =
                Math.abs(currentTime - adjustedSubtitleTime) <= 3;

              return (
                <div
                  key={subtitle.id}
                  ref={isActive ? activeSubtitleRef : null}
                  className={`subtitle-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSubtitleClick(subtitle.startTime)}
                >
                  <span className="subtitle-time">
                    {formatTime(subtitle.startTime)}
                  </span>
                  <span className="subtitle-text">{subtitle.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pagination-container">
          <button
            className="nav-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ◀
          </button>
          <span className="word-indicator">
            {currentPage} / {totalPages}
          </span>
          <button
            className="nav-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            ▶
          </button>
        </div>
      </div>

      {showChapterModal && (
        <div
          className="chapter-modal-backdrop"
          onClick={() => setShowChapterModal(false)}
        >
          <div
            className="chapter-modal"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              setModalTouchStart(e.touches[0].clientX);
            }}
            onTouchEnd={(e) => {
              const touchEnd = e.changedTouches[0].clientX;
              const swipeDistance = modalTouchStart - touchEnd;
              const minSwipeDistance = 50;

              if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0) {
                  setChapterPage((p) =>
                    Math.min(chapterTotalPages, p + 1)
                  );
                } else {
                  setChapterPage((p) =>
                    Math.max(1, p - 1)
                  );
                }
              }
            }}
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
                    Math.min(chapterTotalPages, p + 1)
                  )
                }
                disabled={chapterPage >= chapterTotalPages}
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

export default EnglishStudy;
