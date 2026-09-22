import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { joinRoom, getRoomOnce } from '../lib/gameEngine'
import { setStoredPlayerId, getStoredPlayerId } from '../lib/storage'

export default function JoinRoom() {
  const params = useParams()
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState((params.roomId || '').toUpperCase())
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    const code = roomId.trim().toUpperCase()
    if (!code) {
      setError('방 코드를 입력해주세요.')
      return
    }
    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    setBusy(true)
    try {
      const existing = getStoredPlayerId(code)
      const room = await getRoomOnce(code)
      if (!room) throw new Error('존재하지 않는 방 코드입니다.')

      if (existing && room.players?.[existing]) {
        // 이미 이 방에 참가한 적 있으면 그대로 재입장
        navigate(`/room/${code}`)
        return
      }

      const playerId = await joinRoom(code, name)
      setStoredPlayerId(code, playerId)
      navigate(`/room/${code}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page centered">
      <h1>모둠 카드 게임 입장</h1>
      <form onSubmit={handleJoin} className="join-form">
        <label>
          방 코드
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            placeholder="예: A3F9"
            maxLength={6}
          />
        </label>
        <label>
          이름
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            maxLength={12}
          />
        </label>
        <button type="submit" disabled={busy}>
          입장하기
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}
