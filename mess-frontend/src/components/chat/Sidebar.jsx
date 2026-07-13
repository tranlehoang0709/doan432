import { useState, useEffect, useRef } from 'react'
import Avatar from '../common/Avatar'
import ApiStatus from '../common/ApiStatus'
import { searchUsersApi } from '../../api/searchApi'
import { addFriendApi } from '../../api/friendApi'
import { getProfileApi, updateProfileApi, saveAuthSession } from '../../api/authApi'
import { uploadImageApi } from '../../api/uploadApi'

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  search,
  onSearchChange,
  user,
  onUserUpdate,
  onLogout,
  onRefresh,
}) {
  const [globalUsers, setGlobalUsers] = useState([])
  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [searchPhone, setSearchPhone] = useState('')
  const [searchResultUser, setSearchResultUser] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [showMenu, setShowMenu] = useState(false)

  // Profile and edit modal state
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)
  const [profileStats, setProfileStats] = useState(null)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editDob, setEditDob] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef(null)

  // Fetch profile statistics when drawer is opened
  useEffect(() => {
    if (showProfileDrawer) {
      getProfileApi()
        .then((data) => {
          setProfileStats(data)
        })
        .catch((err) => {
          console.error("Error loading profile stats:", err)
        })
    }
  }, [showProfileDrawer])

  const handleAvatarChangeClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsUploading(true)
      const res = await uploadImageApi(file)
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const imageUrl = `${API_BASE}/uploads/${res.filename}`
      setEditAvatar(imageUrl)
    } catch (err) {
      console.error("Error uploading avatar:", err)
      alert("Đăng tải ảnh đại diện thất bại!")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!editFullName.trim()) {
      alert("Họ và tên không được để trống!")
      return
    }
    try {
      const updated = await updateProfileApi({
        full_name: editFullName.trim(),
        dob: editDob.trim() || null,
        avatar: editAvatar.trim() || ""
      })
      saveAuthSession({ user: updated.user })
      if (onUserUpdate) {
        onUserUpdate(updated.user)
      }
      setShowEditProfileModal(false)
      // Refresh statistics inside drawer
      const freshStats = await getProfileApi()
      setProfileStats(freshStats)
    } catch (err) {
      console.error("Error updating profile:", err)
      alert("Cập nhật thông tin thất bại!")
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  const handleSearchFriend = async () => {
    if (!searchPhone.trim()) return
    setSearchLoading(true)
    setSearchError('')
    setSearchResultUser(null)
    try {
      const results = await searchUsersApi(searchPhone.trim())
      const found = results.find(u => u.phone === searchPhone.trim())
      if (found) {
        setSearchResultUser(found)
      } else {
        setSearchError("Không tìm thấy người dùng với số điện thoại này!")
      }
    } catch (err) {
      setSearchError("Có lỗi xảy ra khi kết nối máy chủ!")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAddFriendFromModal = async () => {
    if (!searchResultUser) return
    try {
      const res = await addFriendApi({ friend_id: searchResultUser.id })
      setSearchResultUser({ ...searchResultUser, friendship_status: res.status })
      if (onRefresh) {
        onRefresh()
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!search.trim()) {
      setGlobalUsers([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await searchUsersApi(search)
        setGlobalUsers(results)
      } catch (err) {
        console.error("Global search error:", err)
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const handleAddFriendClick = async (targetUser) => {
    try {
      const res = await addFriendApi({ friend_id: targetUser.id })
      setGlobalUsers((current) =>
        current.map((u) =>
          u.id === targetUser.id
            ? { ...u, friendship_status: res.status }
            : u
        )
      )
      if (onRefresh) {
        onRefresh()
      }
    } catch (err) {
      console.error("Add friend error:", err)
    }
  }

  const renderActionButton = (gUser) => {
    switch (gUser.friendship_status) {
      case 'accepted':
        return <span className="friendship-status-pill accepted">Bạn bè</span>
      case 'sent':
        return <span className="friendship-status-pill sent">Đã gửi</span>
      case 'pending':
        return (
          <button className="friendship-action-btn accept" onClick={() => handleAddFriendClick(gUser)}>
            Chấp nhận
          </button>
        )
      case 'blocked':
        return <span className="friendship-status-pill blocked">Bị chặn</span>
      default:
        return (
          <button className="friendship-action-btn add" onClick={() => handleAddFriendClick(gUser)}>
            Kết bạn
          </button>
        )
    }
  }

  const filteredConversations = conversations.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false

    if (activeTab === 'friends') {
      return item.type === 'private'
    }
    if (activeTab === 'groups') {
      return item.type === 'group'
    }
    return true
  })

  return (
    <aside className="chat-sidebar">
      <div className="sidebar-top" style={{ position: 'relative' }}>
        <button 
          className="icon-button ghost" 
          title="Menu"
          onClick={() => setShowMenu(!showMenu)}
        >
          ☰
        </button>
        {showMenu && (
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99,
              }}
              onClick={() => setShowMenu(false)}
            />
            <div className="sidebar-menu-dropdown" style={{
              position: 'absolute',
              top: '60px',
              left: '16px',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 100,
              width: '200px',
              padding: '8px 0',
            }}>
              <button 
                onClick={() => {
                  setShowMenu(false)
                  setShowProfileDrawer(true)
                }} 
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text)',
                }}
              >
                👤 Thông tin cá nhân
              </button>
              <button 
                onClick={() => {
                  setShowMenu(false)
                  setShowAddFriendModal(true)
                }} 
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text)',
                }}
              >
                ➕ Thêm bạn bè
              </button>
              <button 
                onClick={() => {
                  setShowMenu(false)
                  onLogout()
                }} 
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'red',
                  borderTop: '1px solid var(--line)',
                }}
              >
                🚪 Đăng xuất
              </button>
            </div>
          </>
        )}
        <div className="sidebar-title">
          <h2>Mess App</h2>
          <span>Telegram white style</span>
        </div>
        <button
          className="icon-button primary"
          title="Tìm kiếm & Kết bạn"
          onClick={() => {
            setShowAddFriendModal(true)
            setSearchResultUser(null)
            setSearchPhone('')
            setSearchError('')
          }}
        >
          ＋
        </button>
      </div>

      <div className="search-box">
        <span>⌕</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm kiếm"
        />
      </div>

      <ApiStatus />

      <div className="sidebar-tabs">
        <button
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          Tất cả
        </button>
        <button
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          Bạn bè
        </button>
        <button
          className={activeTab === 'groups' ? 'active' : ''}
          onClick={() => setActiveTab('groups')}
        >
          Nhóm
        </button>
      </div>

      <div className="conversation-list">
        {filteredConversations.map((conversation) => (
          <button
            key={conversation.id}
            className={`conversation-item ${activeConversationId === conversation.id ? 'active' : ''}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <Avatar
              src={conversation.avatar}
              name={conversation.name}
              online={conversation.online}
            />
            <div className="conversation-main">
              <div className="conversation-row">
                <strong>{conversation.name}</strong>
                <span>{conversation.last_time}</span>
              </div>
              <div className="conversation-row muted">
                <p style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, overflow: 'hidden' }}>
                  {conversation.last_message_sender_id === user.id && conversation.last_message && (
                    <span style={{
                      color: conversation.last_message_status === 'seen' ? 'var(--telegram-dark)' : 'var(--muted-2)',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      marginRight: '2px',
                      flexShrink: 0
                    }} title={conversation.last_message_status === 'seen' ? 'Đã xem' : conversation.last_message_status === 'delivered' ? 'Đã nhận' : 'Đã gửi'}>
                      {conversation.last_message_status === 'sent' ? '✓' : '✓✓'}
                    </span>
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conversation.last_message}
                  </span>
                </p>
                {conversation.unread > 0 && <b>{conversation.unread}</b>}
              </div>
            </div>
          </button>
        ))}

        {search.trim() && (
          <div className="global-search-section">
            <div className="global-search-header">Tìm kiếm toàn cầu</div>
            {globalUsers.length === 0 ? (
              <p className="empty-text">Không tìm thấy người dùng khác</p>
            ) : (
              globalUsers.map((gUser) => (
                <div className="global-user-item" key={gUser.id}>
                  <Avatar src={gUser.avatar} name={gUser.full_name} size="sm" />
                  <div className="global-user-info">
                    <strong>{gUser.full_name}</strong>
                    <span>{gUser.phone}</span>
                  </div>
                  {renderActionButton(gUser)}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="sidebar-profile">
        <Avatar src={user.avatar} name={user.full_name} online />
        <div className="profile-copy">
          <strong>{user.full_name}</strong>
          <span>{user.phone}</span>
        </div>
        <button className="logout-button" onClick={onLogout}>Thoát</button>
      </div>

      {showAddFriendModal && (
        <div className="custom-modal-overlay" onClick={() => setShowAddFriendModal(false)}>
          <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tìm kiếm & Kết bạn</h3>
              <button className="close-btn" onClick={() => setShowAddFriendModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Nhập số điện thoại..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchFriend()}
                />
                <button className="btn btn-primary" onClick={handleSearchFriend} disabled={searchLoading}>
                  {searchLoading ? 'Đang tìm...' : 'Tìm'}
                </button>
              </div>

              {searchError && <p className="modal-error-text">{searchError}</p>}

              {searchResultUser && (
                <div className="modal-user-card">
                  <Avatar src={searchResultUser.avatar} name={searchResultUser.full_name} size="lg" />
                  <div className="modal-user-details">
                    <strong>{searchResultUser.full_name}</strong>
                    <span>{searchResultUser.phone}</span>
                  </div>
                  <div className="modal-user-action">
                    {searchResultUser.friendship_status === 'accepted' && (
                      <span className="friendship-status-pill accepted">Bạn bè</span>
                    )}
                    {searchResultUser.friendship_status === 'sent' && (
                      <span className="friendship-status-pill sent">Đã gửi yêu cầu</span>
                    )}
                    {searchResultUser.friendship_status === 'pending' && (
                      <button className="friendship-action-btn accept" onClick={handleAddFriendFromModal}>
                        Chấp nhận kết bạn
                      </button>
                    )}
                    {searchResultUser.friendship_status === 'blocked' && (
                      <span className="friendship-status-pill blocked">Đã chặn</span>
                    )}
                    {searchResultUser.friendship_status === 'none' && (
                      <button className="friendship-action-btn add" onClick={handleAddFriendFromModal}>
                        Gửi lời mời kết bạn
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      <div className={`profile-drawer ${showProfileDrawer ? 'open' : ''}`}>
        <div className="profile-drawer-header">
          <button className="icon-button ghost" onClick={() => setShowProfileDrawer(false)}>
            ←
          </button>
          <h3>Thông tin cá nhân</h3>
        </div>
        <div className="profile-drawer-content">
          <div className="profile-drawer-hero">
            <Avatar src={user.avatar} name={user.full_name} size="lg" online />
            <h2>{user.full_name}</h2>
            <span>Đang hoạt động</span>
          </div>

          <div className="profile-card">
            <div className="profile-field">
              <div className="profile-field-icon">👤</div>
              <div className="profile-field-info">
                <span className="profile-field-label">Họ tên</span>
                <span className="profile-field-value">{user.full_name}</span>
              </div>
            </div>
            <div className="profile-field">
              <div className="profile-field-icon">📞</div>
              <div className="profile-field-info">
                <span className="profile-field-label">Số điện thoại</span>
                <span className="profile-field-value">{user.phone}</span>
              </div>
            </div>
            <div className="profile-field">
              <div className="profile-field-icon">📅</div>
              <div className="profile-field-info">
                <span className="profile-field-label">Ngày sinh</span>
                <span className="profile-field-value">{formatDate(user.dob) || 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <span className="top-friends-title">👥 Tổng số bạn bè</span>
            <div className="stats-number">{profileStats?.friends_count || 0}</div>
            <div className="stats-label">người bạn</div>
          </div>

          <div className="profile-card">
            <span className="top-friends-title">⭐ Top 3 bạn bè nhắn tin nhiều nhất</span>
            <div className="top-friends-list">
              {profileStats?.top_friends && profileStats.top_friends.length > 0 ? (
                profileStats.top_friends.map((friend, index) => {
                  const barColors = ['#2aabee', '#d81b60', '#fb8c00'];
                  const barColor = barColors[index % barColors.length];
                  
                  const maxMsgs = profileStats.top_friends[0]?.message_count || 1;
                  const percent = maxMsgs > 0 ? Math.min(100, Math.round((friend.message_count / maxMsgs) * 100)) : 0;
                  
                  return (
                    <div className="top-friend-item" key={friend.id}>
                      <span style={{ fontWeight: '800', color: 'var(--muted)', width: '20px' }}>#{index + 1}</span>
                      <Avatar src={friend.avatar} name={friend.full_name} size="sm" />
                      <div className="top-friend-info">
                        <div className="top-friend-meta" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                          <span className="top-friend-name">{friend.full_name}</span>
                          <span className="top-friend-messages">{friend.message_count} tin nhắn</span>
                        </div>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${percent}%`, 
                              backgroundColor: barColor 
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="empty-text" style={{ margin: 0 }}>Chưa có tin nhắn nào với bạn bè</p>
              )}
            </div>
          </div>
        </div>
        <div className="drawer-footer">
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditFullName(user.full_name || '')
              setEditDob(user.dob || '')
              setEditAvatar(user.avatar || '')
              setShowEditProfileModal(true)
            }}
          >
            Chỉnh sửa thông tin cá nhân
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="custom-modal-overlay backdrop-blur" onClick={() => setShowEditProfileModal(false)}>
          <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa thông tin</h3>
              <button className="close-btn" onClick={() => setShowEditProfileModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="edit-profile-avatar-container">
                  <Avatar src={editAvatar} name={editFullName || user.full_name} size="lg" />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                  />
                  <button 
                    type="button" 
                    className="edit-profile-avatar-link" 
                    onClick={handleAvatarChangeClick}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
                  </button>
                </div>

                <div className="field">
                  <span>HỌ VÀ TÊN</span>
                  <input
                    type="text"
                    placeholder="Nhập họ và tên..."
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <span>NGÀY THÁNG NĂM SINH</span>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                  />
                </div>

                <div className="modal-footer-buttons">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditProfileModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isUploading}>
                    Lưu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}
