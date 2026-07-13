import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Sidebar from '../components/chat/Sidebar'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList from '../components/chat/MessageList'
import MessageInput from '../components/chat/MessageInput'
import RightPanel from '../components/chat/RightPanel'

import { getAuthUser, logoutApi } from '../api/authApi'
import { getConversationsApi } from '../api/conversationApi'
import { addFriendApi, getFriendRequestsApi, getFriendsApi, rejectFriendApi } from '../api/friendApi'
import { getMessagesApi, sendMessageApi, recallMessageApi, deleteMessageApi } from '../api/messageApi'

export default function Chat() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getAuthUser())
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])
  const [conversations, setConversations] = useState([])
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [showInfo, setShowInfo] = useState(true)
  const [showMsgSearch, setShowMsgSearch] = useState(false)
  const [msgSearchQuery, setMsgSearchQuery] = useState('')
  const [replyToMessage, setReplyToMessage] = useState(null)


  const loadInitialData = async () => {
    try {
      const [
        conversationData,
        friendData,
        requestData
      ] = await Promise.all([
        getConversationsApi(),
        getFriendsApi(user.id),
        getFriendRequestsApi(user.id)
      ])
      setConversations(conversationData)
      setFriends(friendData)
      setRequests(requestData)
      if (conversationData.length > 0 && !activeConversation) {
        setActiveConversation(conversationData[0])
      }
    } catch(error){
      console.error("Load chat data error:", error)
    }
  }

  useEffect(() => {
    loadInitialData()
    const interval = setInterval(() => {
      loadInitialData()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setShowMsgSearch(false)
    setMsgSearchQuery('')
    setReplyToMessage(null)
    if (!activeConversation) return
    const fetchMessages = () => {
      getMessagesApi(activeConversation.id)
        .then((data) => {
          const deletedList = JSON.parse(localStorage.getItem('mess_deleted_messages') || '[]').map(Number)
          setMessages(data.filter((m) => !deletedList.includes(Number(m.id))))
        })
        .catch(error => {
          console.error("Load messages error:", error)
        })
    }
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [activeConversation?.id])

  const selectedConversation = useMemo(() => {
    return activeConversation || conversations[0]
  }, [
    activeConversation,
    conversations
  ])

  const filteredMessages = useMemo(() => {
    if (!msgSearchQuery.trim()) return messages
    return messages.filter(m => 
      m.content && 
      m.content.toLowerCase().includes(msgSearchQuery.toLowerCase())
    )
  }, [messages, msgSearchQuery])

  const handleSendMessage = async (content, messageType = 'text', fileUrl = null) => {
    if (!selectedConversation) return
    try {
      const newMessage = await sendMessageApi({
        conversationId: selectedConversation.id,
        senderId: user.id,
        content,
        messageType,
        fileUrl,
        replyMessageId: replyToMessage ? replyToMessage.id : null
      })

      setMessages((current) => [
        ...current,
        newMessage
      ])
      setReplyToMessage(null)

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedConversation.id
            ? {
                ...conversation,
                last_message: messageType === 'image' ? '[Hình ảnh]' : messageType === 'file' ? '[Tập tin]' : content,
                last_time: 'Vừa xong',
              }
            : conversation
        )
      )
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Lỗi khi gửi tin nhắn: " + (error.response?.data?.detail || error.message))
    }
  }

  const handleLogout = () => {
    logoutApi()
    navigate('/login')
  }

  const handleAcceptFriend = async (request) => {
    console.log("handleAcceptFriend called with request:", request)
    try {
      const res = await addFriendApi({
        friend_id: request.user_id
      })
      console.log("addFriendApi success:", res)
      setFriends((current) => [
        ...current,
        {
          id: request.user_id,
          full_name: request.full_name,
          phone: request.phone,
          avatar: request.avatar,
          status: 'online',
        },
      ])
      setRequests((current) =>
        current.filter(
          (item) => item.id !== request.id
        )
      )
      await loadInitialData()
    } catch (error) {
      console.error("Error accepting friend request:", error)
      alert("Lỗi khi chấp nhận kết bạn: " + (error.response?.data?.detail || error.message))
    }
  }

  const handleRejectFriend = async (request) => {
    console.log("handleRejectFriend called with request:", request)
    try {
      const res = await rejectFriendApi(request.id)
      console.log("rejectFriendApi success:", res)
      setRequests((current) =>
        current.filter(
          (item) => item.id !== request.id
        )
      )
      await loadInitialData()
    } catch (error) {
      console.error("Error rejecting friend request:", error)
      alert("Lỗi khi từ chối kết bạn: " + (error.response?.data?.detail || error.message))
    }
  }

  const handleRecallMessage = async (messageId) => {
    try {
      await recallMessageApi(messageId)
      setMessages((current) =>
        current.map((m) =>
          m.id === messageId ? { ...m, is_recalled: true } : m
        )
      )
    } catch (error) {
      console.error("Error recalling message:", error)
      alert("Không thể thu hồi tin nhắn: " + (error.response?.data?.detail || error.message))
    }
  }

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessageApi(messageId)
      const deletedList = JSON.parse(localStorage.getItem('mess_deleted_messages') || '[]').map(Number)
      deletedList.push(Number(messageId))
      localStorage.setItem('mess_deleted_messages', JSON.stringify(deletedList))
      setMessages((current) => current.filter((m) => Number(m.id) !== Number(messageId)))
    } catch (error) {
      console.error("Error deleting message:", error)
      alert("Không thể xóa tin nhắn: " + (error.response?.data?.detail || error.message))
    }
  }
  if (!user) {
    return null
  }

  return (
    <main className="chat-page">
      <Sidebar
        conversations={conversations}
        activeConversationId={
          selectedConversation?.id
        }
        onSelectConversation={
          setActiveConversation
        }
        search={search}
        onSearchChange={
          setSearch
        }
        user={user}
        onUserUpdate={setUser}
        onLogout={handleLogout}
        onRefresh={loadInitialData}
      />
      <section className="chat-main">
        {selectedConversation ? (
          <>
            <ChatHeader
              conversation={
                selectedConversation
              }
              onToggleInfo={() =>
                setShowInfo(
                  (value) => !value
                )
              }
              onSearchClick={() => setShowMsgSearch(prev => !prev)}
            />
            {showMsgSearch && (
              <div className="message-search-bar" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#fff',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '18px', color: 'var(--muted)' }}>⌕</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm tin nhắn..."
                  value={msgSearchQuery}
                  onChange={(e) => setMsgSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
                {msgSearchQuery && (
                  <button 
                    onClick={() => setMsgSearchQuery('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: 'var(--muted)'
                    }}
                  >
                    ✕
                  </button>
                )}
                <button 
                  onClick={() => { setShowMsgSearch(false); setMsgSearchQuery(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'var(--telegram-dark)',
                    fontWeight: '500'
                  }}
                >
                  Đóng
                </button>
              </div>
            )}
            <MessageList
              messages={filteredMessages}
              currentUser={user}
              friends={friends}
              onRecall={handleRecallMessage}
              onDelete={handleDeleteMessage}
              onReply={setReplyToMessage}
              conversationId={selectedConversation?.id}
            />
            {replyToMessage && (
              <div className="reply-preview-bar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                backgroundColor: '#f5f5f5',
                borderTop: '1px solid var(--border-color)',
                borderLeft: '4px solid var(--telegram-dark)',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  <span style={{ fontWeight: '600', color: 'var(--telegram-dark)' }}>
                    Đang trả lời {replyToMessage.sender_id === user.id ? 'chính mình' : (friends.find(f => Number(f.id) === Number(replyToMessage.sender_id))?.full_name || 'Người dùng')}
                  </span>
                  <span style={{ color: 'var(--muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {replyToMessage.is_recalled 
                      ? 'Tin nhắn đã thu hồi' 
                      : replyToMessage.message_type === 'image' 
                        ? '[Hình ảnh]' 
                        : replyToMessage.message_type === 'file' 
                          ? '[Tập tin]' 
                          : replyToMessage.content}
                  </span>
                </div>
                <button 
                  onClick={() => setReplyToMessage(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: 'var(--muted)',
                    padding: '4px 8px'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            <MessageInput
              onSend={
                handleSendMessage
              }
            />
          </>
        ) : (
          <div className="chat-main-placeholder">
            <div className="placeholder-icon">💬</div>
            <h3>Chào mừng, {user.full_name}!</h3>
            <p>Hãy chọn một cuộc hội thoại từ danh sách bên trái hoặc kết bạn để bắt đầu trò chuyện.</p>
          </div>
        )}
      </section>
      {showInfo && (
        <RightPanel
          conversation={
            selectedConversation
          }
          friends={friends}
          requests={requests}
          messages={messages}
          onAddFriend={
            handleAcceptFriend
          }
          onRejectFriend={
            handleRejectFriend
          }
        />
      )}
    </main>
  )
}