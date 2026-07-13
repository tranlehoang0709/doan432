import { useState, useEffect, useRef } from 'react'
import Avatar from '../common/Avatar'
import { formatMessageTime } from '../../utils/date'

export default function MessageBubble({ message, isMine, sender, onRecall, onDelete, repliedMessage, repliedSenderName, onReply, isLastMessage }) {
  const [hovered, setHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const isImage = message.message_type === 'image' && message.file_url;

  const handleQuoteClick = () => {
    if (!repliedMessage) return
    const targetElement = document.getElementById(`message-${repliedMessage.id}`)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      const originalBg = targetElement.style.backgroundColor
      const originalTransition = targetElement.style.transition
      
      targetElement.style.transition = 'background-color 0.1s ease'
      targetElement.style.backgroundColor = 'rgba(255, 235, 59, 0.35)'
      
      setTimeout(() => {
        targetElement.style.transition = 'background-color 0.8s ease'
        targetElement.style.backgroundColor = originalBg || 'transparent'
        setTimeout(() => {
          targetElement.style.transition = originalTransition
        }, 800)
      }, 1000)
    }
  }

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showMenu])

  const buttonStyle = {
    opacity: hovered || showMenu ? 1 : 0,
    transition: 'opacity 0.15s ease',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: 'var(--muted)',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    height: '24px',
    width: '24px',
    borderRadius: '50%'
  }

  const menuDropdownStyle = {
    position: 'absolute',
    top: '100%',
    [isMine ? 'left' : 'right']: '0',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    minWidth: '100px',
    padding: '4px 0',
    marginTop: '4px'
  }

  const menuItemStyle = {
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--text-color)',
    display: 'block',
    width: '100%'
  }

  const handleMouseOverButton = (e) => {
    e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
  }
  const handleMouseOutButton = (e) => {
    e.target.style.backgroundColor = 'transparent';
  }

  const renderMessageContent = () => {
    if (message.is_recalled) {
      return <p className="recalled-text">Tin nhắn đã được thu hồi</p>
    }

    if (isImage) {
      return (
        <div className="message-image-container" style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={message.file_url}
            alt="Uploaded media"
            style={{
              maxWidth: '300px',
              maxHeight: '300px',
              borderRadius: '8px',
              display: 'block',
              cursor: 'pointer'
            }}
            onClick={() => window.open(message.file_url, '_blank')}
          />
          <span className="bubble-time image-time" style={{
            position: 'absolute',
            bottom: '4px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            pointerEvents: 'none',
            opacity: hovered ? 1 : 0.75,
            transition: 'opacity 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center'
          }}>
            {formatMessageTime(message.created_at)}
            {isMine && isLastMessage && !message.is_recalled && (
              <span style={{ marginLeft: '4px', fontSize: '9px', color: message.status === 'seen' ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)' }}>
                · {message.status === 'seen' ? 'Đã xem' : message.status === 'delivered' ? 'Đã nhận' : 'Đã gửi'}
              </span>
            )}
          </span>
        </div>
      )
    }

    if (message.message_type === 'file' && message.file_url) {
      return (
        <div className="message-file-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>📄</span>
          <div>
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: isMine ? '#fff' : 'inherit',
                fontWeight: 'bold',
                textDecoration: 'underline'
              }}
            >
              {message.content}
            </a>
          </div>
        </div>
      )
    }

    return <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{linkify(message.content)}</p>
  }

  function linkify(text) {
    if (!text) return text
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    if (parts.length === 1) return text

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              wordBreak: 'break-all',
              fontWeight: '500'
            }}
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  return (
    <div 
      id={`message-${message.id}`}
      className={`message-row ${isMine ? 'mine' : ''} ${isImage ? 'image-row-type' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isMine && <Avatar src={sender?.avatar} name={sender?.full_name || 'User'} size="sm" />}
      
      {isMine && !message.is_recalled && (
        <div style={{ position: 'relative', display: 'flex', alignSelf: 'center', marginRight: '5px' }} ref={menuRef}>
          <button 
            className="message-more-actions" 
            title="Thao tác" 
            style={buttonStyle}
            onClick={() => setShowMenu(prev => !prev)}
            onMouseOver={handleMouseOverButton}
            onMouseOut={handleMouseOutButton}
          >
            ⋮
          </button>
          {showMenu && (
            <div style={menuDropdownStyle}>
              <button 
                style={menuItemStyle} 
                onClick={() => { onReply(message); setShowMenu(false); }}
              >
                Trả lời
              </button>
              <button 
                style={{ ...menuItemStyle, color: '#e53935' }} 
                onClick={() => { onRecall(message.id); setShowMenu(false); }}
              >
                Thu hồi
              </button>
              <button 
                style={menuItemStyle} 
                onClick={() => { onDelete(message.id); setShowMenu(false); }}
              >
                Xóa
              </button>
            </div>
          )}
        </div>
      )}

      <div className="message-content">
        {!isMine && <span className="sender-name">{sender?.full_name}</span>}
        {isImage ? (
          <div className="message-bubble-image-only" style={{ background: 'none', padding: 0, border: 'none', boxShadow: 'none' }}>
            {repliedMessage && (
              <div 
                className="replied-quote-box" 
                onClick={handleQuoteClick}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderLeft: '3px solid var(--telegram-dark)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  marginBottom: '6px',
                  fontSize: '12px',
                  opacity: 0.9,
                  cursor: 'pointer',
                  userSelect: 'none',
                  maxWidth: '300px'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                  {repliedSenderName}
                </div>
                <div style={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  color: 'var(--muted)'
                }}>
                  {repliedMessage.is_recalled 
                    ? 'Tin nhắn đã thu hồi' 
                    : repliedMessage.message_type === 'image' 
                      ? '[Hình ảnh]' 
                      : repliedMessage.message_type === 'file' 
                        ? '[Tập tin]' 
                        : repliedMessage.content}
                </div>
              </div>
            )}
            {renderMessageContent()}
          </div>
        ) : (
          <div className="message-bubble">
            {repliedMessage && (
              <div 
                className="replied-quote-box" 
                onClick={handleQuoteClick}
                style={{
                  backgroundColor: isMine ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                  borderLeft: isMine ? '3px solid #fff' : '3px solid var(--telegram-dark)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  marginBottom: '6px',
                  fontSize: '12px',
                  opacity: 0.9,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                  {repliedSenderName}
                </div>
                <div style={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  color: isMine ? 'rgba(255, 255, 255, 0.8)' : 'var(--muted)'
                }}>
                  {repliedMessage.is_recalled 
                    ? 'Tin nhắn đã thu hồi' 
                    : repliedMessage.message_type === 'image' 
                      ? '[Hình ảnh]' 
                      : repliedMessage.message_type === 'file' 
                        ? '[Tập tin]' 
                        : repliedMessage.content}
                </div>
              </div>
            )}
            {renderMessageContent()}
            <span className="bubble-time" style={{
              opacity: hovered ? 1 : 0.75,
              transition: 'opacity 0.15s ease',
              marginLeft: '8px',
              marginTop: '4px'
            }}>
              {formatMessageTime(message.created_at)}
              {isMine && isLastMessage && !message.is_recalled && (
                <span style={{ marginLeft: '6px', fontSize: '10px', color: message.status === 'seen' ? 'var(--telegram-dark)' : 'var(--muted-2)' }}>
                  · {message.status === 'seen' ? 'Đã xem' : message.status === 'delivered' ? 'Đã nhận' : 'Đã gửi'}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {!isMine && !message.is_recalled && (
        <div style={{ position: 'relative', display: 'flex', alignSelf: 'center', marginLeft: '5px' }} ref={menuRef}>
          <button 
            className="message-more-actions" 
            title="Thao tác" 
            style={buttonStyle}
            onClick={() => setShowMenu(prev => !prev)}
            onMouseOver={handleMouseOverButton}
            onMouseOut={handleMouseOutButton}
          >
            ⋮
          </button>
          {showMenu && (
            <div style={menuDropdownStyle}>
              <button 
                style={menuItemStyle} 
                onClick={() => { onReply(message); setShowMenu(false); }}
              >
                Trả lời
              </button>
              <button 
                style={menuItemStyle} 
                onClick={() => { onDelete(message.id); setShowMenu(false); }}
              >
                Xóa
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
