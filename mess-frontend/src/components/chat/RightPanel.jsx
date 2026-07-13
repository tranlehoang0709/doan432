import { useState } from 'react'
import Avatar from '../common/Avatar'

export default function RightPanel({ conversation, friends, requests, messages = [], onAddFriend, onRejectFriend }) {
  const [activeMediaTab, setActiveMediaTab] = useState('image')

  // Filter images (newest first)
  const images = messages
    .filter(m => !m.is_recalled && m.message_type === 'image' && m.file_url)
    .map(m => ({ id: m.id, url: m.file_url, name: m.content, time: m.created_at }))
    .reverse()

  // Filter files (newest first)
  const files = messages
    .filter(m => !m.is_recalled && m.message_type === 'file' && m.file_url)
    .map(m => ({ id: m.id, url: m.file_url, name: m.content, time: m.created_at }))
    .reverse()

  // Filter links (newest first)
  const links = []
  const urlRegex = /(https?:\/\/[^\s]+)/g
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (!m.is_recalled && m.message_type === 'text' && m.content) {
      const matches = m.content.match(urlRegex)
      if (matches) {
        matches.forEach(url => {
          links.push({ id: `${m.id}-${url}`, url, name: url, time: m.created_at })
        })
      }
    }
  }

  return (
    <aside className="right-panel">
      {conversation ? (
        <>
          <div className="panel-profile">
            <Avatar src={conversation.avatar} name={conversation.name} size="lg" online={conversation.online} />
            <h3>{conversation.name}</h3>
            <p>{conversation.type === 'group' ? 'Group Chat' : 'Private Chat'}</p>
          </div>

          <section className="panel-section compact">
            <h4>Thông tin cuộc trò chuyện</h4>
            <div className="info-grid">
              <span>ID</span>
              <strong>#{conversation.id}</strong>
              <span>Loại</span>
              <strong>{conversation.type}</strong>
              <span>Thành viên</span>
              <strong>{conversation.members?.length || 0}</strong>
            </div>
          </section>
        </>
      ) : (
        <div className="panel-profile">
          <h3>Thông tin</h3>
          <p>Chọn cuộc hội thoại để xem chi tiết</p>
        </div>
      )}

      <section className="panel-section">
        <div className="section-title-row">
          <h4>Bạn bè</h4>
          <button>Xem tất cả</button>
        </div>
        {friends.slice(0, 3).map((friend) => (
          <div className="mini-user" key={friend.id}>
            <Avatar src={friend.avatar} name={friend.full_name} size="sm" online={friend.status === 'online'} />
            <div>
              <strong>{friend.full_name}</strong>
              <span>{friend.status === 'online' ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="panel-section">
        <div className="section-title-row">
          <h4>Lời mời kết bạn</h4>
          <span>{requests.length}</span>
        </div>
        {requests.length === 0 && <p className="empty-text">Chưa có lời mời mới.</p>}
        {requests.map((request) => (
          <div className="request-card" key={request.id}>
            <div className="mini-user">
              <Avatar src={request.avatar} name={request.full_name} size="sm" />
              <div>
                <strong>{request.full_name}</strong>
                <span>{request.phone}</span>
              </div>
            </div>
            <div className="request-actions">
              <button className="accept-btn" onClick={() => onAddFriend(request)} title="Chấp nhận">✓</button>
              <button className="reject-btn" onClick={() => onRejectFriend(request)} title="Từ chối">×</button>
            </div>
          </div>
        ))}
      </section>

      {conversation && (
        <section className="panel-section media-files-section">
          <h4 style={{ marginBottom: '12px' }}>Media & File</h4>
          
          {/* Tab Headers */}
          <div className="media-tabs" style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '12px'
          }}>
            {['image', 'file', 'link'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveMediaTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeMediaTab === tab ? '2px solid var(--telegram-dark)' : '2px solid transparent',
                  color: activeMediaTab === tab ? 'var(--telegram-dark)' : 'var(--muted)',
                  fontWeight: activeMediaTab === tab ? '600' : 'normal',
                  cursor: 'pointer',
                  textAlign: 'center',
                  textTransform: 'capitalize',
                  fontSize: '13px'
                }}
              >
                {tab === 'image' ? 'Ảnh' : tab === 'file' ? 'File' : 'Link'}
              </button>
            ))}
          </div>
          
          {/* Tab Contents */}
          <div className="media-tab-content" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {activeMediaTab === 'image' && (
              images.length === 0 ? (
                <p className="empty-text" style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>Chưa có ảnh chia sẻ</p>
              ) : (
                <div className="images-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '4px'
                }}>
                  {images.map(img => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.name}
                      title={img.name}
                      style={{
                        width: '100%',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(img.url, '_blank')}
                    />
                  ))}
                </div>
              )
            )}
            
            {activeMediaTab === 'file' && (
              files.length === 0 ? (
                <p className="empty-text" style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>Chưa có file chia sẻ</p>
              ) : (
                <div className="files-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {files.map(file => (
                    <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <span style={{ fontSize: '18px' }}>📄</span>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={file.name}
                        style={{
                          color: 'var(--telegram-dark)',
                          textDecoration: 'none',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}
                      >
                        {file.name}
                      </a>
                    </div>
                  ))}
                </div>
              )
            )}
            
            {activeMediaTab === 'link' && (
              links.length === 0 ? (
                <p className="empty-text" style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>Chưa có link chia sẻ</p>
              ) : (
                <div className="links-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {links.map(link => (
                    <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <span style={{ fontSize: '18px' }}>🔗</span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link.url}
                        style={{
                          color: 'var(--telegram-dark)',
                          textDecoration: 'underline',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}
                      >
                        {link.url}
                      </a>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </section>
      )}
    </aside>
  )
}
