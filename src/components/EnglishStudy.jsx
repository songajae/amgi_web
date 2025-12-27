// src/components/EnglishStudy.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import videoData from '../data/video-subtitles.json';

function EnglishStudy({ chapter, setChapter, maxChapter }) {
  // EnglishStudy 전용 로컬 챕터
  const [localChapter, setLocalChapter] = useState(chapter);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterPage, setChapterPage] = useState(1);
  const [modalTouchStart, setModalTouchStart] = useState(0);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const subtitleListRef = useRef(null);
  const activeSubtitleRef = useRef(null);

  const CHAPTERS_PER_PAGE = 20;
  const SUBTITLE_OFFSET = 0; // 자막 시간 보정용

  // EnglishStudy에 들어올 때, 전역 chapter가 videoData 최대보다 크면 local만 max로 맞추기
  useEffect(() => {
    if (!maxChapter) return;

    // video-subtitles.json이 가진 실제 최대 chapter
    const videoMaxChapter = videoData.reduce(
      (max, v) => Math.max(max, v.chapter),
      1
    );

    const limit = Math.min(maxChapter, videoMaxChapter);

    if (chapter > limit) {
      setLocalChapter(limit);
    } else {
      setLocalChapter(chapter);
    }
  }, [chapter, maxChapter]);

  // 현재 챕터의 영상 데이터 (localChapter 기준)
  const currentVideo = useMemo(
    () => videoData.find((v) => v.chapter === localChapter) || videoData[0],
    [localChapter]
  );

  // 현재 챕터 자막 리스트 (전체)
  const subtitles = useMemo(() => {
    if (!currentVideo) return [];
    return currentVideo.subtitles.map(([id, time, text]) => ({
      id,
      startTime: time,
      text,
    }));
  }, [currentVideo]);

  // video-subtitles.json 기준 챕터 리스트
  const chapterList = useMemo(
    () => videoData.map((v) => v.chapter).sort((a, b) => a - b),
    []
  );
  const chapterTotalPages = Math.max(
    1,
    Math.ceil(chapterList.length / CHAPTERS_PER_PAGE)
  );
  const startChapterIndex = (chapterPage - 1) * CHAPTERS_PER_PAGE;
  const chapterPageItems = chapterList.slice(
    startChapterIndex,
    startChapterIndex + CHAPTERS_PER_PAGE
  );

  // localChapter 변경 시 초기화
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);

    if (subtitleListRef.current) {
      subtitleListRef.current.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    }
  }, [localChapter]);

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
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else if (
      event.data === window.YT.PlayerState.PAUSED ||
      event.data === window.YT.PlayerState.ENDED
    ) {
      setIsPlaying(false);
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const time = Math.floor(playerRef.current.getCurrentTime());
          setCurrentTime(time);
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // 재생 중일 때만 시간 추적
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPlaying) return;

    if (playerRef.current && playerRef.current.getCurrentTime) {
      intervalRef.current = setInterval(() => {
        try {
          const time = Math.floor(playerRef.current.getCurrentTime());
          setCurrentTime(time);
        } catch (error) {
          // ignore
        }
      }, 300);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  // active 자막 기준 자동 스크롤 
  useEffect(() => {
    const container = subtitleListRef.current;
    const activeEl = activeSubtitleRef.current;

    if (!container || !activeEl) return;

    const containerHeight = container.clientHeight;
    const activeTop = activeEl.offsetTop;
    const activeHeight = activeEl.clientHeight;

    // 현재 사용 중인 위치 계산
    const targetOffset = containerHeight * 1.4;
    const targetScrollTop =
      activeTop - targetOffset + activeHeight / 2;

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });
  }, [currentTime]);

  // 자막 클릭 → 해당 시간으로 이동
  const handleSubtitleClick = (startTime) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(startTime, true);
      playerRef.current.playVideo();
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

  // EnglishStudy에서 챕터 변경 시: local + 전역 chapter 둘 다 반영
  const handleChangeChapter = (newChapter) => {
    setLocalChapter(newChapter);  // EnglishStudy용
    setChapter(newChapter);      // App 전역 상태
    setShowChapterModal(false);
  };

  // 챕터 모달 열기
  const openChapterModal = () => {
    const currentPageNum =
      Math.floor((localChapter - 1) / CHAPTERS_PER_PAGE) + 1;
    setChapterPage(currentPageNum);
    setShowChapterModal(true);
  };

  if (!currentVideo) {
    return <div className="no-content">영상 데이터가 없습니다.</div>;
  }

  return (
    <>
      <button className="study-level-btn" onClick={openChapterModal}>
        Level {localChapter}
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
            {subtitles.map((subtitle) => {
              const adjustedSubtitleTime =
                subtitle.startTime + SUBTITLE_OFFSET;

              const isActive =
                Math.abs(currentTime - adjustedSubtitleTime) <= 3;

              return (
                <div
                  key={subtitle.id}
                  ref={isActive ? activeSubtitleRef : null}
                  className={`subtitle-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSubtitleClick(subtitle.startTime)}
                >
                  {/* 타임스탬프는 화면에서 숨김 */}
                  {/* <span className="subtitle-time">
                    {formatTime(subtitle.startTime)}
                  </span> */}
                  <span className="subtitle-text">{subtitle.text}</span>
                </div>
              );
            })}
          </div>
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
                      ch === localChapter
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
