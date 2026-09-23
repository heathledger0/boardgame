import { ref, get, set, push, update, runTransaction, onValue } from 'firebase/database'
import { db } from './firebase'
import { CARD_DEFINITIONS } from '../data/cards'

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 헷갈리는 0/O, 1/I 제외

function generateRoomCode(length = 4) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  }
  return code
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function nextTurnIndex(room, fromIndex) {
  const order = room.turnOrder || []
  const n = order.length
  for (let step = 1; step <= n; step++) {
    const idx = (fromIndex + step) % n
    const pid = order[idx]
    if (!room.players[pid]?.eliminated) return idx
  }
  return fromIndex
}

export async function createRoom(name) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const roomId = generateRoomCode()
    const roomRef = ref(db, `rooms/${roomId}`)
    const snapshot = await get(roomRef)
    if (snapshot.exists()) continue
    const deck = shuffle(CARD_DEFINITIONS.map((c) => c.id))
    await set(roomRef, {
      name: name?.trim() || roomId,
      status: 'waiting',
      createdAt: Date.now(),
      deck,
      players: {},
      turnOrder: [],
      turnIndex: 0,
      winnerId: null,
    })
    return roomId
  }
  throw new Error('방 코드 생성에 실패했습니다. 다시 시도해주세요.')
}

export async function getRoomOnce(roomId) {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  return snapshot.exists() ? snapshot.val() : null
}

export function subscribeToRoom(roomId, callback) {
  const roomRef = ref(db, `rooms/${roomId}`)
  return onValue(roomRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null)
  })
}

export function subscribeToRoomList(roomIds, callback) {
  const unsubs = roomIds.map((id) =>
    subscribeToRoom(id, (room) => callback(id, room))
  )
  return () => unsubs.forEach((u) => u())
}

export async function joinRoom(roomId, name) {
  const room = await getRoomOnce(roomId)
  if (!room) throw new Error('존재하지 않는 방 코드입니다.')
  if (room.status !== 'waiting') throw new Error('이미 시작된 게임에는 입장할 수 없습니다.')
  const players = room.players || {}
  if (Object.keys(players).length >= MAX_PLAYERS) {
    throw new Error(`정원이 가득 찼습니다 (최대 ${MAX_PLAYERS}명).`)
  }
  const playerRef = push(ref(db, `rooms/${roomId}/players`))
  await set(playerRef, {
    name: name.trim() || '이름없음',
    hand: [],
    eliminated: false,
    joinedAt: Date.now(),
  })
  return playerRef.key
}

export async function renameRoom(roomId, name) {
  const trimmed = name?.trim()
  if (!trimmed) throw new Error('모둠 이름을 입력해주세요.')
  await update(ref(db, `rooms/${roomId}`), { name: trimmed })
}

export async function startGame(roomId) {
  const roomRef = ref(db, `rooms/${roomId}`)
  const room = await getRoomOnce(roomId)
  if (!room) throw new Error('존재하지 않는 방입니다.')
  const players = room.players || {}
  const ids = Object.keys(players).sort(
    (a, b) => players[a].joinedAt - players[b].joinedAt
  )
  if (ids.length < MIN_PLAYERS) throw new Error(`최소 ${MIN_PLAYERS}명이 필요합니다.`)
  if (ids.length > MAX_PLAYERS) throw new Error(`최대 ${MAX_PLAYERS}명까지 가능합니다.`)
  await update(roomRef, { status: 'playing', turnOrder: ids, turnIndex: 0 })
}

// 방장(교사) 화면에서 방을 초기화하고 싶을 때 사용.
// 덱/순서뿐 아니라 각 참가자의 "뽑은 카드"와 "아웃 여부"도 같이 되돌려야
// 재시작한 게임에서 지난 판에 아웃됐던 사람이 계속 순서에서 제외되는
// 문제가 생기지 않는다.
export async function resetRoom(roomId) {
  const roomRef = ref(db, `rooms/${roomId}`)
  const room = await getRoomOnce(roomId)
  const deck = shuffle(CARD_DEFINITIONS.map((c) => c.id))
  const players = room?.players || {}
  const resetPlayers = Object.fromEntries(
    Object.entries(players).map(([pid, p]) => [pid, { ...p, hand: [], eliminated: false }])
  )
  const updates = {
    status: 'waiting',
    deck,
    turnOrder: [],
    turnIndex: 0,
    winnerId: null,
    lastCallOut: null,
  }
  // Realtime Database는 빈 객체({})를 값으로 저장할 수 없으므로, 참가자가
  // 있을 때만 players를 함께 갱신한다.
  if (Object.keys(resetPlayers).length > 0) {
    updates.players = resetPlayers
  }
  await update(roomRef, updates)
}

export async function drawCard(roomId, playerId) {
  const roomRef = ref(db, `rooms/${roomId}`)
  const { committed, snapshot } = await runTransaction(roomRef, (room) => {
    if (!room) return room
    if (room.status !== 'playing') return room
    const currentPlayerId = room.turnOrder[room.turnIndex]
    if (currentPlayerId !== playerId) return room // 내 차례가 아니면 무시
    if (!room.deck || room.deck.length === 0) return room

    const deck = [...room.deck]
    const cardId = deck.pop()
    const player = room.players[playerId]
    const hand = player.hand ? [...player.hand] : []
    hand.push(cardId)

    room.players[playerId] = { ...player, hand }
    room.deck = deck
    room.turnIndex = nextTurnIndex(room, room.turnIndex)

    if (deck.length === 0) {
      const remaining = room.turnOrder.filter((pid) => !room.players[pid].eliminated)
      room.status = 'finished'
      room.winnerId = remaining.length === 1 ? remaining[0] : null
    }
    return room
  })
  if (!committed) throw new Error('카드를 뽑지 못했습니다. 다시 시도해주세요.')
  return snapshot.val()
}

// 다른 참가자를 지목만 하는 단계. 아직 아무도 아웃 처리되지 않고,
// 방에 있는 모든 화면에 사이렌 연출만 띄운다. 실제 아웃 여부는 지목당한
// 본인이 confirmOut()으로 스스로 인정해야 확정된다. (장난으로 남을
// 바로 탈락시키는 것을 막기 위함)
export async function callOut(roomId, targetId) {
  const roomRef = ref(db, `rooms/${roomId}`)
  await runTransaction(roomRef, (room) => {
    if (!room || !room.players?.[targetId]) return room
    if (room.players[targetId].eliminated) return room
    room.lastCallOut = { targetId, ts: Date.now() }
    return room
  })
}

// 지목당한 본인이 "인정"을 눌렀을 때만 호출되는 실제 아웃 처리.
export async function confirmOut(roomId, playerId) {
  const roomRef = ref(db, `rooms/${roomId}`)
  await runTransaction(roomRef, (room) => {
    if (!room || !room.players?.[playerId]) return room
    if (room.players[playerId].eliminated) return room

    room.players[playerId] = { ...room.players[playerId], eliminated: true }
    const remaining = room.turnOrder.filter((pid) => !room.players[pid].eliminated)

    if (remaining.length <= 1) {
      room.status = 'finished'
      room.winnerId = remaining[0] || null
      return room
    }

    const currentPid = room.turnOrder[room.turnIndex]
    if (currentPid === playerId) {
      room.turnIndex = nextTurnIndex(room, room.turnIndex)
    }
    return room
  })
}

export { MIN_PLAYERS, MAX_PLAYERS }
