const TEACHER_ROOMS_KEY = 'bg_teacher_rooms'
const TEACHER_GROUP_KEY = 'bg_teacher_group'
const playerKey = (roomId) => `bg_player_${roomId}`

export function getTeacherGroup() {
  return localStorage.getItem(TEACHER_GROUP_KEY)
}

export function setTeacherGroup(group) {
  localStorage.setItem(TEACHER_GROUP_KEY, group)
}

export function getTeacherRoomIds() {
  try {
    return JSON.parse(localStorage.getItem(TEACHER_ROOMS_KEY) || '[]')
  } catch {
    return []
  }
}

export function addTeacherRoomId(roomId) {
  const ids = getTeacherRoomIds()
  if (!ids.includes(roomId)) {
    ids.push(roomId)
    localStorage.setItem(TEACHER_ROOMS_KEY, JSON.stringify(ids))
  }
}

export function removeTeacherRoomId(roomId) {
  const ids = getTeacherRoomIds().filter((id) => id !== roomId)
  localStorage.setItem(TEACHER_ROOMS_KEY, JSON.stringify(ids))
}

export function getStoredPlayerId(roomId) {
  return localStorage.getItem(playerKey(roomId))
}

export function setStoredPlayerId(roomId, playerId) {
  localStorage.setItem(playerKey(roomId), playerId)
}
