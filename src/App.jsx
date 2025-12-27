// src/App.jsx
// ... import 부분 동일

function App() {
  const [chapter, setChapter] = useState(1);
  const [activeTab, setActiveTab] = useState('home');

  const maxChapter = useMemo(
    () => Math.max(...words.map((w) => w.chapter || 1)),
    []
  );

  // 🔸 왼쪽: 현재 페이지 이름, 오른쪽: 항상 "챕터 1 / 30" 형식
  const getPageTitle = () => {
    switch (activeTab) {
      case 'home':
        return '홈';
      case 'wordlist':
        return '단어장';
      case 'review':
        return '복습';
      case 'study':
        return '암기송';
      case 'about':
        return '정보';
      default:
        return '';
    }
  };

  return (
    <div className="app-root">
      <header className="top-header">
        {/* 왼쪽: 현재 페이지 이름 */}
        <div className="top-title">{getPageTitle()}</div>

        {/* 오른쪽: 챕터 n / maxChapter */}
        <div className="top-header-right">
          <span className="page-main">
            챕터 : {chapter} / {maxChapter}
          </span>
        </div>
      </header>

      <main className="main-content with-header">
        {activeTab === 'home' && (
          <Home
            chapter={chapter}
            setChapter={setChapter}
            maxChapter={maxChapter}
          />
        )}

        {activeTab === 'wordlist' && (
          <WordList
            chapter={chapter}
            setChapter={setChapter}
          />
        )}

        {activeTab === 'review' && (
          <Review
            chapter={chapter}
            setChapter={setChapter}
          />
        )}

        {activeTab === 'study' && (
          <EnglishStudy
            chapter={chapter}
            setChapter={setChapter}
            maxChapter={maxChapter}
          />
        )}

        {activeTab === 'about' && <About />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
