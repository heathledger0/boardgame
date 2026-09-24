import { initializeApp, getApps } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// Firebase 무료(Spark) 요금제는 Realtime Database 동시 연결이 프로젝트당 100개로
// 고정돼 있다. 한 학교 전체(예: 10개 반 x 24명)가 동시에 접속하면 이 한도를 넘기
// 쉬우므로, 학생 수가 많을 때는 서로 다른 Firebase 프로젝트 여러 개(A/B/C 그룹)에
// 나눠 접속하도록 한다. 방 코드의 첫 글자가 그 방이 어느 그룹에 속하는지를 나타낸다.
export const GROUPS = ['A', 'B', 'C']

// 100개 한도에 여유를 두기 위한 그룹별 권장 최대 동시 접속 수.
export const MAX_PER_GROUP = 90

function configFor(group) {
  const get = (key) => import.meta.env[`VITE_FIREBASE_${group}_${key}`]
  return {
    apiKey: get('API_KEY'),
    authDomain: get('AUTH_DOMAIN'),
    databaseURL: get('DATABASE_URL'),
    projectId: get('PROJECT_ID'),
    storageBucket: get('STORAGE_BUCKET'),
    messagingSenderId: get('MESSAGING_SENDER_ID'),
    appId: get('APP_ID'),
  }
}

export function isGroupConfigured(group) {
  const c = configFor(group)
  return Boolean(c.apiKey && c.databaseURL)
}

export const CONFIGURED_GROUPS = GROUPS.filter(isGroupConfigured)

// 설정된 그룹이 하나도 없으면 앱 전체가 하얀 화면이 되므로, App에서 안내 화면을
// 보여줄 수 있도록 최소 1개 그룹(A) 설정 여부를 기준으로 판단한다.
export const isFirebaseConfigured = CONFIGURED_GROUPS.length > 0

const dbCache = {}

// 그룹별 Firebase 앱/DB는 실제로 쓰일 때 한 번만 초기화해서 캐싱한다.
export function getDb(group) {
  if (dbCache[group]) return dbCache[group]
  const appName = `group-${group}`
  const existing = getApps().find((a) => a.name === appName)
  const app = existing || initializeApp(configFor(group), appName)
  const db = getDatabase(app)
  dbCache[group] = db
  return db
}
