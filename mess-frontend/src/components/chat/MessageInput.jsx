import { useRef, useState } from 'react'
import { uploadFileApi, uploadImageApi } from '../../api/uploadApi'

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('')
  const fileInputRef = useRef(null)

  const submitMessage = (event) => {
    event.preventDefault()
    const content = text.trim()
    if (!content) return
    onSend(content)
    setText('')
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      if (file.type.startsWith('image/')) {
        const data = await uploadImageApi(file)
        const fileUrl = `${API_BASE}/uploads/${data.filename}`
        onSend(file.name, 'image', fileUrl)
      } else {
        const data = await uploadFileApi(file)
        const fileUrl = `${API_BASE}/uploads/${data.filename}`
        onSend(file.name, 'file', fileUrl)
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Lỗi khi tải file lên: " + error.message)
    }

    event.target.value = ''
  }

  return (
    <form className="message-input" onSubmit={submitMessage}>
      <button type="button" onClick={() => fileInputRef.current?.click()} title="Đính kèm file">📎</button>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileChange}
      />
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Viết tin nhắn..."
      />
      <button type="button" title="Emoji">☺</button>
      <button type="submit" className="send-btn" aria-label="Gửi tin nhắn">➤</button>
    </form>
  )
}
