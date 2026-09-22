// 카드 한 장 = { id, color, label, image }
// - id: 덱 안에서 유일해야 함 (한 세트에 카드 1장씩)
// - color: 학생 화면에서 카드를 묶어서 보여줄 색상 그룹 (원하는 이름으로 자유롭게 변경 가능)
// - label: 이미지가 없을 때 대신 보여줄 텍스트
// - image: public/cards/ 안에 넣은 실제 카드 이미지 파일명 (없으면 null, 이 경우 label만 표시)
//
// 실제 카드 이미지가 준비되면 public/cards/ 폴더에 이미지를 넣고
// 아래 image 값을 해당 파일명으로 바꿔주면 됩니다.
export const CARD_DEFINITIONS = [
  { id: 'red-1', color: 'red', label: '빨강 1', image: null },
  { id: 'red-2', color: 'red', label: '빨강 2', image: null },
  { id: 'red-3', color: 'red', label: '빨강 3', image: null },
  { id: 'red-4', color: 'red', label: '빨강 4', image: null },
  { id: 'red-5', color: 'red', label: '빨강 5', image: null },
  { id: 'blue-1', color: 'blue', label: '파랑 1', image: null },
  { id: 'blue-2', color: 'blue', label: '파랑 2', image: null },
  { id: 'blue-3', color: 'blue', label: '파랑 3', image: null },
  { id: 'blue-4', color: 'blue', label: '파랑 4', image: null },
  { id: 'blue-5', color: 'blue', label: '파랑 5', image: null },
  { id: 'green-1', color: 'green', label: '초록 1', image: null },
  { id: 'green-2', color: 'green', label: '초록 2', image: null },
  { id: 'green-3', color: 'green', label: '초록 3', image: null },
  { id: 'green-4', color: 'green', label: '초록 4', image: null },
  { id: 'green-5', color: 'green', label: '초록 5', image: null },
  { id: 'yellow-1', color: 'yellow', label: '노랑 1', image: null },
  { id: 'yellow-2', color: 'yellow', label: '노랑 2', image: null },
  { id: 'yellow-3', color: 'yellow', label: '노랑 3', image: null },
  { id: 'yellow-4', color: 'yellow', label: '노랑 4', image: null },
  { id: 'yellow-5', color: 'yellow', label: '노랑 5', image: null },
]

export const COLOR_STYLES = {
  red: { bg: '#fde8e8', border: '#e03131', text: '#8f1d1d' },
  blue: { bg: '#e7f0fd', border: '#1c64d1', text: '#123a75' },
  green: { bg: '#e6f7ec', border: '#2f9e44', text: '#1c5c2b' },
  yellow: { bg: '#fff8e1', border: '#f0a800', text: '#7a5b00' },
  purple: { bg: '#f2e8fd', border: '#8a3ff0', text: '#4a1d80' },
  default: { bg: '#eef0f2', border: '#868e96', text: '#333' },
}

export function getCardById(id) {
  return CARD_DEFINITIONS.find((c) => c.id === id)
}
