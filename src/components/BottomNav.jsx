// ==============================
// 파일명 : src/components/BottomNav.jsx
// 역할 : 앱 하단 고정 메뉴 UI를 렌더링하고 탭 클릭 시 상위 컴포넌트의 활성 탭 상태를 변경해 화면 전환을 담당한다.
// 수정일 : 2026-05-19
// 수정사항: 홈 탭과 4번째 탭의 위치/라벨 요구사항에 맞춰 홈=암기송, 4번째=단어공부로 메뉴 순서를 조정
// ==============================

import { TAB_LABELS } from './navigationLabels.js';

function BottomNav({ activeTab, onTabChange }) {
  return (
    <div className="bottom-nav">
      <button
        className={`bottom-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
      >
        {TAB_LABELS.home}
      </button>
      <button
        className={`bottom-nav-btn ${activeTab === 'wordlist' ? 'active' : ''}`}
        onClick={() => onTabChange('wordlist')}
      >
        {TAB_LABELS.wordlist}
      </button>
      <button
        className={`bottom-nav-btn ${activeTab === 'review' ? 'active' : ''}`}
        onClick={() => onTabChange('review')}
      >
        {TAB_LABELS.review}
      </button>
      <button
        className={`bottom-nav-btn ${activeTab === 'study' ? 'active' : ''}`}
        onClick={() => onTabChange('study')}
      >
        {TAB_LABELS.study}
      </button>
      <button
        className={`bottom-nav-btn ${activeTab === 'about' ? 'active' : ''}`}
        onClick={() => onTabChange('about')}
      >
        {TAB_LABELS.about}
      </button>
    </div>
  );
}

export default BottomNav;