// src/components/EnglishStudy.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import videoData from '../data/video-subtitles.json';

function EnglishStudy({ chapter, setChapter }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const SUBTITLES_PER_PAGE = 10;

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

  // 챕터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
    setCurrentTime(0);
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
  };

  if (!currentVideo) {
    return <div className="no-content">영상 데이터가 없습니다.</div>;
  }

  return (
    <>
      {/* 챕터 선택 버튼 (우측 상단) */}
      <button 
        className="study-level-btn"
        onClick={() => setShowChapterModal(true)}
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
        <div className="subtitle-list-container">
          <div className="subtitle-list">
            {pageSubtitles.map((subtitle) => (
              <div
  key={subtitle.id}
  className={`subtitle-item ${
    Math.abs(currentTime - subtitle.startTime) <= 3 ? 'active' : ''
  }`}
  onClick={() => handleSubtitleClick(subtitle.startTime)}
>

                <span className="subtitle-time">{formatTime(subtitle.startTime)}</span>
                <span className="subtitle-text">{subtitle.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 페이지네이션 */}
        <div className="pagination-container">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ◀
          </button>
          <span className="page-indicator">
            {currentPage} / {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            ▶
          </button>
        </div>
      </div>

      {/* 챕터 선택 모달 */}
      {showChapterModal && (
        <div className="modal-overlay" onClick={() => setShowChapterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">챕터 선택</h3>
            <div className="chapter-grid">
              {videoData.map((video) => (
                <button
                  key={video.id}
                  className={`chapter-btn ${chapter === video.chapter ? 'active' : ''}`}
                  onClick={() => handleChangeChapter(video.chapter)}
                >
                  Level {video.chapter}
                </button>
              ))}
            </div>
            <button className="modal-close-btn" onClick={() => setShowChapterModal(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default EnglishStudy;
