// ==============================
// 파일명 : src/components/EnglishStudy.jsx
// 역할 : 암기송(English Study) 화면에서 유튜브 영상 재생, 현재 재생 시간 동기화, 자막 리스트 하이라이트/자동 스크롤, 챕터 선택 모달을 통합 관리하는 메인 컴포넌트
// 수정일 : 2026-05-04
// 수정사항: 재생 시간 표기를 항상 00:00:00(시:분:초 두 자리) 형식으로 고정해 초 소수점 노출 문제를 수정
// ==============================
// src/components/EnglishStudy.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import videoData from '../data/video-subtitles.json';

function EnglishStudy({ chapter, setChapter }) {
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
  // 필요하면 여기만 -2, -3 등으로 조정해서 시작 타이밍 미세 보정
  const SUBTITLE_OFFSET = 0;

  // 🔹 EnglishStudy에서 사용할 수 있는 최대 챕터 계산
  const maxStudyChapter = useMemo(() => {
    const chapters = videoData
      .map((v) => v.chapter)
      .filter((c) => typeof c === 'number');
    if (chapters.length === 0) return 1;
    return Math.max(...chapters);
  }, []);

  // 🔹 실제 EnglishStudy에서 사용할 챕터 (words.json에서 5를 선택해도 여기선 최대값까지만)
  const clampedChapter = useMemo(
    () => Math.min(chapter, maxStudyChapter),
    [chapter, maxStudyChapter]
  );

  // 현재 챕터의 영상 데이터
  const currentVideo = useMemo(
    () => videoData.find((v) => v.chapter === clampedChapter) || videoData[0],
    [clampedChapter]
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

  const activeSubtitleId = useMemo(() => {
    if (subtitles.length === 0) return null; // 재생 중인 자막 id

    for (let i = 0; i < subtitles.length; i += 1) {
      const currentSubtitle = subtitles[i]; // 현재 순회 자막
      const nextSubtitle = subtitles[i + 1]; // 다음 자막
      const currentStart = currentSubtitle.startTime + SUBTITLE_OFFSET; // 현재 자막 시작 시간
      const nextStart = nextSubtitle
        ? nextSubtitle.startTime + SUBTITLE_OFFSET
        : Number.POSITIVE_INFINITY; // 마지막 자막 보호

      if (currentTime >= currentStart && currentTime < nextStart) {
        return currentSubtitle.id;
      }
    }

    return null;
  }, [subtitles, currentTime]);

  // 챕터 리스트 (자막이 있는 챕터만)
  const chapterList = useMemo(
    () =>
      videoData
        .map((v) => v.chapter)
        .filter((c) => typeof c === 'number')
        .sort((a, b) => a - b),
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

  // 챕터 변경 시 초기화 (clampedChapter 기준으로 동작)
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);

    if (subtitleListRef.current) {
      subtitleListRef.current.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    }
  }, [clampedChapter]);

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

  const normalizeVideoTime = (timeValue) => Number(timeValue.toFixed(2)); // 영상 시간을 소수점 2자리로 정규화

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
          const currentVideoTime = normalizeVideoTime(playerRef.current.getCurrentTime());
          setCurrentTime(currentVideoTime);
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
          const currentVideoTime = normalizeVideoTime(playerRef.current.getCurrentTime());
          setCurrentTime(currentVideoTime);
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
    const safeSeconds = Math.max(0, Math.floor(seconds)); // 초 단위를 정수로 보정
    const h = Math.floor(safeSeconds / 3600); // 시간 계산
    const m = Math.floor((safeSeconds % 3600) / 60); // 분 계산
    const s = safeSeconds % 60; // 초 계산

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 🔹 챕터 변경 (최대 챕터까지)
  const handleChangeChapter = (newChapter) => {
    const safeChapter = Math.min(newChapter, maxStudyChapter);
    setChapter(safeChapter);     // 상위 상태는 그대로 유지
    setShowChapterModal(false);
  };

  // 챕터 모달 열기
  const openChapterModal = () => {
    const currentPageNum =
      Math.floor((clampedChapter - 1) / CHAPTERS_PER_PAGE) + 1;
    setChapterPage(currentPageNum);
    setShowChapterModal(true);
  };

  if (!currentVideo) {
    return <div className="no-content">영상 데이터가 없습니다.</div>;
  }

  return (
    <>
      {/* 🔹 상단 주황 박스: "챕터" 글씨 제거, 숫자만 표시 */}
      <button className="study-level-btn" onClick={openChapterModal}>
        Level {clampedChapter}
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
              const isActive = subtitle.id === activeSubtitleId; // 현재 재생 자막 여부

              return (
                <div
                  key={subtitle.id}
                  ref={isActive ? activeSubtitleRef : null}
                  className={`subtitle-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSubtitleClick(subtitle.startTime)}
                >
                  {/* 타임스탬프는 화면에 안 보여도 되므로 주석 처리 */}
                  {/*
                  <span className="subtitle-time">
                    {formatTime(subtitle.startTime)}
                  </span>
                  */}
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
                      ch === clampedChapter
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