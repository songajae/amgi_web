// src/components/EnglishStudy.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import videoData from '../data/video-subtitles.json';

function EnglishStudy({ chapter, setChapter }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterPage, setChapterPage] = useState(1);
  const [modalTouchStart, setModalTouchStart] = useState(0);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const subtitleListRef = useRef(null);
  const activeSubtitleRef = useRef(null);

  const SUBTITLES_PER_PAGE = 10;
  const CHAPTERS_PER_PAGE = 20; // 2열 x 10행

  // 현재 챕터의 영상 데이터 가져오기
  const currentVideo = useMemo(
    () => videoData.find(v => v.chapter === chapter) || videoData[0],
    [chapter]
  );

  // 현재 챕터의 자막 리스트
  const subtitles = useMemo(() => {
    if (!currentVideo) return [];
    return currentVideo.subtitles.map(([id, time, text]) => ({
      id,
      startTime: time,
      text
    }));
  }, [currentVideo]);

  const totalPages = Math.ceil(subtitles.length / SUBTITLES_PER_PAGE);
  const startIndex = (currentPage - 1) * SUBTITLES_PER_PAGE;
  const pageSubtitles = subtitles.slice(startIndex, startIndex + SUBTITLES_PER_PAGE);

  // 챕터 리스트 계산 (실제 존재하는 챕터만)
  const chapterList = useMemo(() => {
    return videoData.map(v => v.chapter).sort((a, b) => a - b);
  }, []);
  
  const chapterTotalPages = Math.max(1, Math.ceil(chapterList.length / CHAPTERS_PER_PAGE));
  const startChapterIndex = (chapterPage - 1) * CHAPTERS_PER_PAGE;
  const chapterPageItems = chapterList.slice(startChapterIndex, startChapterIndex + CHAPTERS_PER_PAGE);

  // 챕터 변경 시 페이지 초기화 및 스크롤 초기화
  useEffect(() => {
    setCurrentPage(1);
    setCurrentTime(0);
    // 자막 리스트 맨 위로 스크롤
    if (subtitleListRef.current) {
      subtitleListRef.current.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    }
  }, [chapter]);

  // YouTube Player 초기화
  useEffect(() => {
    if (!currentVideo) return;

    // YouTube API 로드
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
        return;
      }

      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: currentVideo.videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = Math.floor(playerRef.current.getCurrentTime());
        setCurrentTime(time);
      }
    }, 500);
  };

  const onPlayerStateChange = (event) => {
    // 재생 상태 변경 처리 (필요시)
  };

  // active 자막 자동 스크롤
  useEffect(() => {
    if (subtitleListRef.current) {
      const container = subtitleListRef.current;
      
      // active 자막이 있으면 스크롤
      if (activeSubtitleRef.current) {
        const activeElement = activeSubtitleRef.current;
        const containerHeight = container.clientHeight;
        const activeTop = activeElement.offsetTop;
        const activeHeight = activeElement.clientHeight;
        
        // active 항목이 컨테이너 상단 1/3 위치에 오도록 스크롤
        const scrollPosition = activeTop - (containerHeight / 3);
        
        container.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      } else if (currentTime === 0) {
        // 영상이 처음이면 맨 위로 스크롤
        container.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }
    }
  }, [currentTime, currentPage]);

  // 자막 클릭 → 해당 시간으로 이동
  const handleSubtitleClick = (startTime) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(startTime, true);
      playerRef.current.playVideo();
    }
  };

  // 시간을 mm:ss 또는 h:mm:ss 형식으로 변환
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
  };

  // 챕터 모달 열기
  const openChapterModal = () => {
    const currentPageNum = Math.floor((chapter - 1) / CHAPTERS_PER_PAGE) + 1;
    setChapterPage(currentPageNum);
    setShowChapterModal(true);
  };

  if (!currentVideo) {
    return <div className="no-content">영상 데이터가 없습니다.</div>;
  }

  return (
    <>
      {/* 챕터 선택 버튼 (우측 상단) */}
      <button 
        className="study-level-btn"
        onClick={openChapterModal}
      >
        Level {chapter}
        <span className="level-arrow">▼</span>
      </button>

      <div className="english-study-container">
        {/* 영상 플레이어 */}
        <div className="video-player-wrapper">
          <div id="youtube-player"></div>
        </div>

        {/* 영상 정보 */}
        <div className="video-info">
          <h2 className="video-title">{currentVideo.videoTitle}</h2>
          <span className="video-time">{formatTime(currentTime)}</span>
        </div>

        {/* 자막 리스트 */}
        <div className="subtitle-list-container" ref={subtitleListRef}>
          <div className="subtitle-list">
            {pageSubtitles.map((subtitle) => {
              const isActive = Math.abs(currentTime - subtitle.startTime) <= 3;
              return (
                <div
                  key={subtitle.id}
                  ref={isActive ? activeSubtitleRef : null}
                  className={`subtitle-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSubtitleClick(subtitle.startTime)}
                >
                  <span className="subtitle-time">{formatTime(subtitle.startTime)}</span>
                  <span className="subtitle-text">{subtitle.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 페이지네이션 */}
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
              setModalTouchStart(e.touches[0].clientX);
            }}
            onTouchEnd={(e) => {
              const touchEnd = e.changedTouches[0].clientX;
              const swipeDistance = modalTouchStart - touchEnd;
              const minSwipeDistance = 50;

              if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0) {
                  // 왼쪽 스와이프 -> 다음 페이지
                  setChapterPage((p) => Math.min(chapterTotalPages, p + 1));
                } else {
                  // 오른쪽 스와이프 -> 이전 페이지
                  setChapterPage((p) => Math.max(1, p - 1));
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
                onClick={() => setChapterPage((p) => Math.max(1, p - 1))}
                disabled={chapterPage === 1}
              >
                ◀
              </button>
              <button
                onClick={() => setChapterPage((p) => Math.min(chapterTotalPages, p + 1))}
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
