import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  createRoom,
  startGame,
  resetRoom,
  subscribeToRoomList,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from '../lib/gameEngine'
import { getTeacherRoomIds, addTeacherRoomId, removeTeacherRoomId } from '../lib/storage'

const MAX_ROOMS = 10

const STATUS_LABEL = {
  waiting: '대기 중',
  playing: '진행 중',
  finished: '종료',
}

export default function TeacherDashboard() {
  const [roomIds, setRoomIds] = useState(() => getTeacherRoomIds())
  const [rooms, setRooms] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (roomIds.length === 0) return
    const unsubscribe = subscribeToRoomList(roomIds, (id, room) => {
      setRooms((prev) => ({ ...prev, [id]: room }))
    })
    return unsubscribe
  }, [roomIds])

  async function handleCreateRoom() {
    setError('')
    if (roomIds.length >= MAX_ROOMS) {
      setError(`한 번에 최대 ${MAX_ROOMS}개 모둠까지 만들 수 있습니다.`)
      return
    }
    setBusy(true)
    try {
      const roomId = await createRoom()
      addTeacherRoomId(roomId)
      setRoomIds(getTeacherRoomIds())
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleStart(roomId) {
    setError('')
    try {
      await startGame(roomId)
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleReset(roomId) {
    if (!confirm('이 방을 초기화하면 진행 중인 게임 기록이 사라집니다. 계속할까요?')) return
    await resetRoom(roomId)
  }

  function handleRemove(roomId) {
    if (!confirm('목록에서 이 모둠 방을 제거할까요? (참가자 접속은 계속 유효합니다)')) return
    removeTeacherRoomId(roomId)
    setRoomIds(getTeacherRoomIds())
  }

  return (
    <div className="page">
      <h1>모둠 카드 게임 - 교사 대시보드</h1>
      <p className="muted">
        모둠마다 방을 만들고 QR코드를 보여주면, 학생들은 스캔해서 바로 입장합니다. (최대{' '}
        {MAX_ROOMS}개 모둠, 방마다 {MIN_PLAYERS}~{MAX_PLAYERS}명)
      </p>

      <button onClick={handleCreateRoom} disabled={busy || roomIds.length >= MAX_ROOMS}>
        + 새 모둠 방 만들기 ({roomIds.length}/{MAX_ROOMS})
      </button>
      {error && <p className="error">{error}</p>}

      <div className="room-grid">
        {roomIds.map((roomId) => {
          const room = rooms[roomId]
          const joinUrl = `${window.location.origin}/join/${roomId}`
          const players = room?.players ? Object.entries(room.players) : []
          const canStart = room?.status === 'waiting' && players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS

          return (
            <div className="room-card" key={roomId}>
              <div className="room-card-header">
                <h2>{roomId}</h2>
                <span className={`status status-${room?.status || 'loading'}`}>
                  {STATUS_LABEL[room?.status] || '불러오는 중'}
                </span>
              </div>

              <QRCodeSVG value={joinUrl} size={140} />
              <p className="join-url">{joinUrl}</p>

              <ul className="player-list">
                {players.length === 0 && <li className="muted">아직 참가자 없음</li>}
                {players.map(([pid, p]) => (
                  <li key={pid}>
                    {p.name} {p.eliminated ? '❌ 탈락' : ''}
                  </li>
                ))}
              </ul>

              <div className="room-actions">
                <button onClick={() => handleStart(roomId)} disabled={!canStart}>
                  게임 시작
                </button>
                <button onClick={() => handleReset(roomId)}>초기화</button>
                <button onClick={() => handleRemove(roomId)} className="danger">
                  목록에서 제거
                </button>
              </div>

              {room?.status === 'finished' && (
                <p className="winner">
                  {room.winnerId
                    ? `🏆 승자: ${room.players?.[room.winnerId]?.name || '알 수 없음'}`
                    : '무승부 (카드 소진 또는 전원 탈락)'}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
