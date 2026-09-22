import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TeacherDashboard from './pages/TeacherDashboard'
import JoinRoom from './pages/JoinRoom'
import GameRoom from './pages/GameRoom'
import { isFirebaseConfigured } from './lib/firebase'
import './App.css'

function FirebaseSetupNotice() {
  return (
    <div className="page centered">
      <h1>Firebase 설정이 필요합니다</h1>
      <p className="muted">
        이 앱은 여러 화면을 실시간으로 동기화하기 위해 Firebase Realtime Database를
        사용합니다. 프로젝트 루트의 <code>.env</code> 파일에 Firebase 설정값을
        입력한 뒤 다시 시작해주세요. 자세한 방법은 README.md의 &quot;1. Firebase
        프로젝트 준비&quot; 항목을 참고하세요.
      </p>
    </div>
  )
}

export default function App() {
  if (!isFirebaseConfigured) {
    return <FirebaseSetupNotice />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/join/:roomId" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<GameRoom />} />
      </Routes>
    </BrowserRouter>
  )
}
