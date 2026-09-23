// 브라우저 기본 confirm()은 연속으로 뜨면 "대화상자 추가로 띄우지 않음" 체크박스가
// 생겨서, 한 번 눌리면 새로고침 전까지 이후 확인창이 전부 사라져버린다.
// 게임 핵심 흐름(지목/아웃 인정)이 확인창에 의존하므로, 브라우저 기본 창 대신
// 앱 안에서 직접 그리는 팝업을 사용한다.
export default function ConfirmModal({ open, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <p>{message}</p>
        <div className="modal-actions">
          {cancelLabel && (
            <button onClick={onCancel}>{cancelLabel}</button>
          )}
          <button className="danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
