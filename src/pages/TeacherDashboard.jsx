import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  createRoom,
  renameRoom,
  startGame,
  resetRoom,
  subscribeToRoomList,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from '../lib/gameEngine'
import { CONFIGURED_GROUPS, MAX_PER_GROUP } from '../lib/firebase'
import { registerPresence, subscribeGroupCount } from '../lib/presence'
import {
  getTeacherRoomIds,
  addTeacherRoomId,
  removeTeacherRoomId,
  getTeacherGroup,
  setTeacherGroup,
} from '../lib/storage'
import ConfirmModal from '../components/ConfirmModal'

const MAX_ROOMS = 20

const STATUS_LABEL = {
  waiting: '대기 중',
  playing: '진행 중',
  finished: '종료',
}

function GroupPicker({ counts, currentGroup, onSelect, onCancel }) {
  const [studentCount, setStudentCount] = useState('')
  const needed = Number(studentCount) > 0 ? Number(studentCount) + 1 : null

  const recommended = useMemo(() => {
    if (!needed) return null
    const withRoom = CONFIGURED_GROUPS.filter((g) => MAX_PER_GROUP - (counts[g] || 0) >= needed)
    const pool = withRoom.length > 0 ? withRoom : CONFIGURED_GROUPS
    return pool.reduce((best, g) => {
      if (!best) return g
      return (counts[g] || 0) < (counts[best] || 0) ? g : best
    }, null)
  }, [needed, counts])

  return (
    <div className="page centered">
      <h1>사용할 그룹 선택</h1>
      <p className="muted">
        학교 전체 인원이 많으면 Firebase 접속 한도를 나눠 쓰기 위해 그룹(A/B/C)을
        구분합니다. 담임 선생님마다 다른 그룹을 선택해주세요.
      </p>

      <label className="student-count-label">
        오늘 이 반의 총 학생 수
        <input
          type="number"
          min="1"
          value={studentCount}
          onChange={(e) => setStudentCount(e.target.value)}
          placeholder="예: 24"
        />
      </label>

      <div className="group-list">
        {CONFIGURED_GROUPS.map((g) => {
          const count = counts[g] || 0
          const pct = Math.min(100, Math.round((count / MAX_PER_GROUP) * 100))
          const isFull = MAX_PER_GROUP - count < 1
          return (
            <div className={`group-option ${recommended === g ? 'recommended' : ''}`} key={g}>
              <div className="group-option-header">
                <strong>그룹 {g}</strong>
                {recommended === g && <span className="badge">추천</span>}
                <span className="muted">
                  {count}/{MAX_PER_GROUP}명
                </span>
              </div>
              <div className="group-bar">
                <div className="group-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <button onClick={() => onSelect(g)} disabled={isFull}>
                {isFull ? '가득 참' : '이 그룹으로 시작'}
              </button>
            </div>
          )
        })}
      </div>

      {currentGroup && (
        <button className="small" onClick={onCancel}>
          취소하고 그룹 {currentGroup}(으)로 돌아가기
        </button>
      )}
    </div>
  )
}

export default function TeacherDashboard() {
  const [group, setGroup] = useState(() => getTeacherGroup())
  const [showGroupPicker, setShowGroupPicker] = useState(() => !getTeacherGroup())
  const [groupCounts, setGroupCounts] = useState({})
  const [roomIds, setRoomIds] = useState(() => getTeacherRoomIds())
  const [rooms, setRooms] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // { type: 'reset' | 'remove', roomId }
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    const unsubs = CONFIGURED_GROUPS.map((g) =>
      subscribeGroupCount(g, (count) => {
        setGroupCounts((prev) => ({ ...prev, [g]: count }))
      })
    )
    return () => unsubs.forEach((u) => u())
  }, [])

  useEffect(() => {
    if (!group) return
    return registerPresence(group)
  }, [group])

  useEffect(() => {
    if (roomIds.length === 0) return
    const unsubscribe = subscribeToRoomList(roomIds, (id, room) => {
      setRooms((prev) => ({ ...prev, [id]: room }))
    })
    return unsubscribe
  }, [roomIds])

  function handleSelectGroup(g) {
    setTeacherGroup(g)
    setGroup(g)
    setShowGroupPicker(false)
  }

  async function handleCreateRoom() {
    setError('')
    if (roomIds.length >= MAX_ROOMS) {
      setError(`한 번에 최대 ${MAX_ROOMS}개 모둠까지 만들 수 있습니다.`)
      return
    }
    setBusy(true)
    try {
      const defaultName = `${roomIds.length + 1}모둠`
      const roomId = await createRoom(defaultName, group)
      addTeacherRoomId(roomId)
      setRoomIds(getTeacherRoomIds())
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  function startEditingName(roomId, currentName) {
    setEditingRoomId(roomId)
    setEditName(currentName)
  }

  async function saveEditingName(roomId) {
    try {
      await renameRoom(roomId, editName)
      setEditingRoomId(null)
    } catch (e) {
      setError(e.message)
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

  async function confirmPendingAction() {
    if (!pendingAction) return
    const { type, roomId } = pendingAction
    setPendingAction(null)
    if (type === 'reset') {
      await resetRoom(roomId)
    } else if (type === 'remove') {
      removeTeacherRoomId(roomId)
      setRoomIds(getTeacherRoomIds())
    }
  }

  if (showGroupPicker || !group) {
    return (
      <GroupPicker
        counts={groupCounts}
        currentGroup={group}
        onSelect={handleSelectGroup}
        onCancel={() => setShowGroupPicker(false)}
      />
    )
  }

  return (
    <div className="page">
      <ConfirmModal
        open={!!pendingAction}
        message={
          pendingAction?.type === 'reset'
            ? '이 방을 초기화하면 진행 중인 게임 기록이 사라집니다. 계속할까요?'
            : '목록에서 이 모둠 방을 제거할까요? (참가자 접속은 계속 유효합니다)'
        }
        confirmLabel="확인"
        cancelLabel="취소"
        onConfirm={confirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />
      <div className="room-card-header">
        <h1>모둠 카드 게임 - 교사 대시보드</h1>
        <span className="group-indicator">
          그룹 {group} ({groupCounts[group] || 0}/{MAX_PER_GROUP})
          {CONFIGURED_GROUPS.length > 1 && (
            <button className="small" onClick={() => setShowGroupPicker(true)}>
              그룹 변경
            </button>
          )}
        </span>
      </div>
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
                {editingRoomId === roomId ? (
                  <div className="room-name-edit">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={20}
                      autoFocus
                    />
                    <button className="small" onClick={() => saveEditingName(roomId)}>
                      저장
                    </button>
                    <button className="small" onClick={() => setEditingRoomId(null)}>
                      취소
                    </button>
                  </div>
                ) : (
                  <h2>
                    {room?.name || roomId}{' '}
                    <button
                      className="small rename-btn"
                      onClick={() => startEditingName(roomId, room?.name || roomId)}
                      title="모둠 이름 수정"
                    >
                      ✏️
                    </button>
                  </h2>
                )}
                <span className={`status status-${room?.status || 'loading'}`}>
                  {STATUS_LABEL[room?.status] || '불러오는 중'}
                </span>
              </div>
              <p className="muted room-code">코드: {roomId}</p>

              <QRCodeSVG value={joinUrl} size={140} />
              <p className="join-url">{joinUrl}</p>

              <ul className="player-list">
                {players.length === 0 && <li className="muted">아직 참가자 없음</li>}
                {players.map(([pid, p]) => (
                  <li key={pid}>
                    {p.name} {p.eliminated ? '🛑 아웃' : ''}
                  </li>
                ))}
              </ul>

              <div className="room-actions">
                <button onClick={() => handleStart(roomId)} disabled={!canStart}>
                  게임 시작
                </button>
                <button onClick={() => setPendingAction({ type: 'reset', roomId })}>초기화</button>
                <button onClick={() => setPendingAction({ type: 'remove', roomId })} className="danger">
                  목록에서 제거
                </button>
              </div>

              {room?.status === 'finished' && (
                <p className="winner">
                  {room.winnerId
                    ? `🏆 승자: ${room.players?.[room.winnerId]?.name || '알 수 없음'}`
                    : '무승부 (카드 소진 또는 전원 아웃)'}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
