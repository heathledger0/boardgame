// 카드 한 장 = { id, color, label, image }
// - id: 덱 안에서 유일해야 함 (한 세트에 카드 1장씩)
// - color: 학생 화면에서 카드를 묶어서 보여줄 색상 그룹 (터치/액션/자세 3종)
// - label: 이미지가 없을 때 대신 보여줄 텍스트
// - image: public/cards/ 안에 넣은 실제 카드 이미지 파일명 (없으면 null, 이 경우 label만 표시)
//
// 이미지가 준비된 카드부터 순서대로 image 값을 채워나가면 됩니다.
export const CARD_DEFINITIONS = [
  // touch: "이 카드는 내 OO에 닿아야 해요"
  { id: 'touch-head', color: 'touch', label: '이 카드는 내 머리 위에 닿아야 해요', image: null },
  { id: 'touch-forehead', color: 'touch', label: '이 카드는 내 이마에 닿아야 해요', image: null },
  { id: 'touch-eyebrow', color: 'touch', label: '이 카드는 내 눈썹에 닿아야 해요', image: null },
  { id: 'touch-nose', color: 'touch', label: '이 카드는 내 코에 닿아야 해요', image: null },
  { id: 'touch-ear', color: 'touch', label: '이 카드는 내 귀에 닿아야 해요', image: null },
  { id: 'touch-chin', color: 'touch', label: '이 카드는 내 턱에 닿아야 해요', image: null },
  { id: 'touch-neck', color: 'touch', label: '이 카드는 내 목에 닿아야 해요', image: 'touch-neck.png' },
  { id: 'touch-shoulder', color: 'touch', label: '이 카드는 내 어깨 위에 얹어야 해요', image: 'touch-shoulder.png' },
  { id: 'touch-elbow', color: 'touch', label: '이 카드는 내 팔꿈치에 닿아야 해요', image: 'touch-elbow.png' },
  { id: 'touch-wrist', color: 'touch', label: '이 카드는 내 손목에 닿아야 해요', image: 'touch-wrist.png' },
  { id: 'touch-handback', color: 'touch', label: '이 카드는 내 손등에 닿아야 해요', image: 'touch-handback.png' },
  { id: 'touch-thumb', color: 'touch', label: '이 카드는 내 엄지손가락에 닿아야 해요', image: 'touch-thumb.png' },

  // action: "카드를 뽑기 전에 OO 해요" / 카드를 OO하게 읽어요
  { id: 'action-liftcard', color: 'action', label: '카드를 뽑기 전에, 그 카드를 집었다가 내려놓아요', image: 'action-liftcard.png' },
  { id: 'action-pathead', color: 'action', label: '카드를 뽑기 전에, 내 머리를 토닥여요', image: 'action-pathead.png' },
  { id: 'action-belly', color: 'action', label: '카드를 뽑기 전에, 내 배를 문질러요', image: 'action-belly.png' },
  { id: 'action-wave', color: 'action', label: '카드를 뽑기 전에, 모두에게 손을 흔들어요', image: 'action-wave.png' },
  { id: 'action-meow', color: 'action', label: '카드를 뽑기 전에, 고양이처럼 야옹거려요', image: 'action-meow.png' },
  { id: 'action-woof', color: 'action', label: '카드를 뽑기 전에, 개처럼 멍멍거려요', image: 'action-woof.png' },
  { id: 'action-quack', color: 'action', label: '카드를 뽑기 전에, 오리처럼 꽥꽥거려요', image: null },
  { id: 'action-tapfloor', color: 'action', label: '카드를 뽑기 전에, 손가락으로 바닥을 건드려요', image: null },
  { id: 'action-praise', color: 'action', label: '카드를 뽑기 전에, 누군가를 칭찬해요', image: null },
  { id: 'action-liftfeet', color: 'action', label: '카드를 뽑기 전에, 양쪽 발을 들어올려요', image: null },
  { id: 'action-sing', color: 'action', label: '카드를 노래하듯 읽어요', image: null },
  { id: 'action-shout', color: 'action', label: '카드를 소리지르면서 읽어요', image: null },

  // pose: 손가락/몸 자세를 유지
  { id: 'pose-fingertable', color: 'pose', label: '손가락 하나가 탁자와 닿아요', image: null },
  { id: 'pose-elbowhigh', color: 'pose', label: '팔꿈치를 내 어깨보다 높이 들어요', image: null },
  { id: 'pose-handshigh', color: 'pose', label: '오른손을 내 왼손보다 높이 둬요', image: null },
  { id: 'pose-wristbend', color: 'pose', label: '왼쪽 손목을 구부려요', image: null },
  { id: 'pose-thumbtouch', color: 'pose', label: '엄지손가락이 다른 손가락과 닿아요', image: null },
  { id: 'pose-indexup', color: 'pose', label: '집게손가락이 위를 향해요', image: null },
  { id: 'pose-fingerear', color: 'pose', label: '손가락 하나가 내 귀와 닿아요', image: null },
  { id: 'pose-fingernose', color: 'pose', label: '손가락 하나가 내 코와 닿아요', image: null },
  { id: 'pose-fingerabovehead', color: 'pose', label: '손가락을 내 머리보다 높이 들어요', image: null },
  { id: 'pose-pinkydown', color: 'pose', label: '새끼손가락이 아래로 향해요', image: null },
  { id: 'pose-indexisolate', color: 'pose', label: '집게손가락이 어디에도 닿지 않아요', image: null },
  { id: 'pose-hideteeth', color: 'pose', label: '내 치아를 숨겨요', image: null },
]

export const COLOR_STYLES = {
  touch: { bg: '#e3f6f0', border: '#1f9d7c', text: '#0f5c47' },
  action: { bg: '#efe9ff', border: '#7c4dff', text: '#4a2fb3' },
  pose: { bg: '#fff0e2', border: '#ff8a3d', text: '#a4520f' },
  default: { bg: '#eef0f2', border: '#868e96', text: '#333' },
}

export function getCardById(id) {
  return CARD_DEFINITIONS.find((c) => c.id === id)
}
