import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

export default function MessageList({ messages, currentUser, friends, onRecall, onDelete, onReply, conversationId }) {
  const containerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const isNearBottom = useRef(true)

  const findSender = (senderId) => {
    if (senderId === currentUser.id) return currentUser
    return friends.find((friend) => friend.id === senderId)
  }

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const threshold = 100 // px from bottom
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    isNearBottom.current = distanceToBottom <= threshold
  }

  // Reset scroll to bottom on room change
  useEffect(() => {
    isNearBottom.current = true
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [conversationId])

  useEffect(() => {
    if (messages.length === 0) return

    if (isNearBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div 
      className="message-list" 
      ref={containerRef} 
      onScroll={handleScroll}
      style={{ overflowY: 'auto' }}
    >
      <div className="date-separator"><span>Hôm nay</span></div>
      {messages.map((message, index) => {
        const repliedMessage = message.reply_message_id
          ? messages.find((m) => Number(m.id) === Number(message.reply_message_id))
          : null
        
        let repliedSenderName = ''
        if (repliedMessage) {
          repliedSenderName = repliedMessage.sender_id === currentUser.id 
            ? 'Bạn' 
            : (findSender(repliedMessage.sender_id)?.full_name || 'Người dùng')
        }

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isMine={message.sender_id === currentUser.id}
            sender={findSender(message.sender_id)}
            onRecall={onRecall}
            onDelete={onDelete}
            repliedMessage={repliedMessage}
            repliedSenderName={repliedSenderName}
            onReply={onReply}
            isLastMessage={index === messages.length - 1}
          />
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
