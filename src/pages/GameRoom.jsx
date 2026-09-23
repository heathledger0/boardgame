import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { subscribeToRoom, drawCard, callOut, confirmOut } from '../lib/gameEngine'
import { getStoredPlayerId } from '../lib/storage'
import { getCardById, COLOR_STYLES } from '../data/cards'
import ConfirmModal from '../components/ConfirmModal'

const CALLOUT_DURATION_MS = 1800

export default function GameRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const playerId = getStoredPlayerId(roomId)
  const [room, setRoom] = useState(null)
  const [error, setError] = useState('')
  const [calloutName, setCalloutName] = useState(null)
  const [pendingCallOut, setPendingCallOut] = useState(null) // { targetId, targetName }
  const [showOutConfirm, setShowOutConfirm] = useState(false)
  const lastCalloutTs = useRef(null)

  useEffect(() => {
    if (!playerId) {
      navigate(`/join/${roomId}`)
      return
    }
    return subscribeToRoom(roomId, setRoom)
  }, [roomId, playerId, navigate])

  useEffect(() => {
    const event = room?.lastCallOut
    if (!event || event.ts === lastCalloutTs.current) return
    lastCalloutTs.current = event.ts
    const targetName = room.players?.[event.targetId]?.name || '누군가'
    setCalloutName(targetName)
    const hideTimer = setTimeout(() => setCalloutName(null), CALLOUT_DURATION_MS)

    // 사이렌 연출이 끝난 뒤, 지목당한 본인 화면에만 인정 여부를 묻는다.
    let confirmTimer
    if (event.targetId === playerId) {
      confirmTimer = setTimeout(() => setShowOutConfirm(true), CALLOUT_DURATION_MS)
    }

    return () => {
      clearTimeout(hideTimer)
      if (confirmTimer) clearTimeout(confirmTimer)
    }
  }, [room, playerId])

  const myHandByColor = useMemo(() => {
    const hand = room?.players?.[playerId]?.hand || []
    const grouped = {}
    for (const cardId of hand) {
      const card = getCardById(cardId)
      if (!card) continue
      grouped[card.color] = grouped[card.color] || []
      grouped[card.color].push(card)
    }
    return grouped
  }, [room, playerId])

  if (!room) {
    return (
      <div className="page centered">
        <p>방 정보를 불러오는 중...</p>
      </div>
    )
  }

  const me = room.players?.[playerId]
  if (!me) {
    return (
      <div className="page centered">
        <p className="error">이 방에서 참가자 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  // Firebase Realtime Database는 빈 배열/객체를 저장하지 않고 지워버리므로
  // (예: 아직 순서가 정해지지 않은 대기 중인 방) 항상 기본값으로 보정해서 사용한다.
  const turnOrder = room.turnOrder || []
  const players = room.players || {}

  const isMyTurn = room.status === 'playing' && turnOrder[room.turnIndex] === playerId
  const currentPlayerName = room.status === 'playing'
    ? players[turnOrder[room.turnIndex]]?.name
    : null

  async function handleDraw() {
    setError('')
    try {
      await drawCard(roomId, playerId)
    } catch (e) {
      setError(e.message)
    }
  }

  function handleCallOutClick(targetId, targetName) {
    setPendingCallOut({ targetId, targetName })
  }

  async function confirmPendingCallOut() {
    if (!pendingCallOut) return
    await callOut(roomId, pendingCallOut.targetId)
    setPendingCallOut(null)
  }

  async function handleConfirmOut() {
    setShowOutConfirm(false)
    await confirmOut(roomId, playerId)
  }

  return (
    <div className="page">
      <ConfirmModal
        open={!!pendingCallOut}
        message={`${pendingCallOut?.targetName}님을 지목할까요? (지시사항을 수행하지 못한 것 같을 때)`}
        confirmLabel="지목하기"
        cancelLabel="취소"
        onConfirm={confirmPendingCallOut}
        onCancel={() => setPendingCallOut(null)}
      />
      <ConfirmModal
        open={showOutConfirm}
        message="딱 걸렸어요! 정말 아웃을 인정하시겠어요?"
        confirmLabel="인정할게요"
        cancelLabel="아니요, 계속할게요"
        onConfirm={handleConfirmOut}
        onCancel={() => setShowOutConfirm(false)}
      />
      {calloutName && (
        <div className="callout-overlay">
          <div className="callout-badge">
            <span className="callout-name">{calloutName}</span>
            <span>딱 걸렸어! 🚨</span>
          </div>
        </div>
      )}
      <div className="room-header">
        <h1>방 {roomId}</h1>
        <span className={`status status-${room.status}`}>
          {room.status === 'waiting' && '대기 중'}
          {room.status === 'playing' && '진행 중'}
          {room.status === 'finished' && '종료'}
        </span>
      </div>

      {room.status === 'waiting' && (
        <p className="muted">다른 참가자와 교사의 게임 시작을 기다리는 중입니다...</p>
      )}

      {room.status === 'playing' && (
        <>
          <p className="turn-indicator">
            {isMyTurn ? '🎯 내 차례입니다!' : `⏳ ${currentPlayerName}님의 차례`}
          </p>
          {isMyTurn && (
            <button className="draw-button" onClick={handleDraw}>
              카드 뽑기
            </button>
          )}
        </>
      )}

      {room.status === 'finished' && (
        <p className="winner">
          {room.winnerId
            ? room.winnerId === playerId
              ? '🏆 당신이 우승했습니다!'
              : `🏆 우승자: ${players[room.winnerId]?.name}`
            : '무승부로 게임이 종료되었습니다.'}
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <h2>내가 뽑은 카드</h2>
      <div className="hand">
        {Object.keys(myHandByColor).length === 0 && <p className="muted">아직 뽑은 카드가 없습니다.</p>}
        {Object.entries(myHandByColor).map(([color, cards]) => {
          const style = COLOR_STYLES[color] || COLOR_STYLES.default
          return (
            <div className="hand-row" key={color}>
              {cards.map((card) => (
                <div
                  className="card"
                  key={card.id}
                  style={{ background: style.bg, borderColor: style.border, color: style.text }}
                >
                  {card.image ? (
                    <img src={`/cards/${card.image}`} alt={card.label} />
                  ) : (
                    <span>{card.label}</span>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <h2>참가자</h2>
      <ul className="player-list">
        {turnOrder.length > 0
          ? turnOrder.map((pid) => {
              const p = players[pid]
              if (!p) return null
              return (
                <li key={pid} className={p.eliminated ? 'eliminated' : ''}>
                  <span>
                    {p.name} {pid === playerId ? '(나)' : ''} - 카드 {p.hand?.length || 0}장
                    {p.eliminated ? ' - 아웃' : ''}
                  </span>
                  {room.status === 'playing' && !p.eliminated && (
                    <button className="small danger" onClick={() => handleCallOutClick(pid, p.name)}>
                      딱 걸렸어!
                    </button>
                  )}
                </li>
              )
            })
          : Object.entries(players).map(([pid, p]) => (
              <li key={pid}>{p.name} {pid === playerId ? '(나)' : ''}</li>
            ))}
      </ul>
    </div>
  )
}
