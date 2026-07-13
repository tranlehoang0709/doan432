import Avatar from '../common/Avatar'

export default function ChatHeader({ conversation, onToggleInfo, onSearchClick }) {
  const statusText = conversation.type === 'group'
    ? `${conversation.members?.length || 0} thành viên`
    : conversation.online
      ? 'đang hoạt động'
      : 'không hoạt động'

  return (
    <header className="chat-header">
      <div className="chat-person">
        <Avatar src={conversation.avatar} name={conversation.name} online={conversation.online} />
        <div>
          <h2>{conversation.name}</h2>
          <span>{statusText}</span>
        </div>
      </div>

      <div className="chat-header-meta">
        <span className="mock-pill">Mock data</span>
        <div className="chat-actions">
          <button title="Tìm trong chat" onClick={onSearchClick}>⌕</button>
          <button title="Gọi thoại">☎</button>
          <button title="Thông tin" onClick={onToggleInfo}>ⓘ</button>
        </div>
      </div>
    </header>
  )
}
