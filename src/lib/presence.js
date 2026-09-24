import { ref, push, set, onValue, onDisconnect } from 'firebase/database'
import { getDb } from './firebase'

// 이 그룹(Firebase 프로젝트)에 내가 접속해 있는 동안 presence 노드에 한 자리를
// 등록해두고, 연결이 끊기면(탭 닫기, 네트워크 끊김 등) Firebase가 자동으로 지운다.
// 이렇게 하면 "지금 이 그룹에 몇 명이 붙어있는지"를 다른 사람 화면에서도 실시간으로
// 셀 수 있다.
export function registerPresence(group) {
  const db = getDb(group)
  const myRef = push(ref(db, 'presence'))
  const connectedRef = ref(db, '.info/connected')

  const unsubscribe = onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      onDisconnect(myRef).remove()
      set(myRef, true)
    }
  })

  return () => {
    unsubscribe()
    set(myRef, null)
  }
}

export function subscribeGroupCount(group, callback) {
  const db = getDb(group)
  return onValue(ref(db, 'presence'), (snapshot) => {
    const val = snapshot.val()
    callback(val ? Object.keys(val).length : 0)
  })
}
