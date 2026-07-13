import http from './http'


function createLocalMessage({ conversationId, senderId, content }) {
  return {
    id: Date.now(),
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    created_at: new Date().toISOString(),
    is_recalled: false,
    attachments: [],
  }
}

// Backend cần bổ sung: GET /message/list?conversation_id=1
export async function getMessagesApi(conversationId) {

  const response = await http.get('/message/list', {
    params: { conversation_id: conversationId },
  })
  if (Array.isArray(response.data)) {
    return response.data
  }
  if (Array.isArray(response.data.messages)) {
    return response.data.messages
  }
  return []
}

// Backend cần bổ sung: POST /message/send
export async function sendMessageApi({
  conversationId,
  senderId,
  content,
  messageType = 'text',
  fileUrl = null,
  replyMessageId = null
}) {
  const payload = {
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    message_type: messageType,
    file_url: fileUrl,
    reply_message_id: replyMessageId
  }
  const response = await http.post(
    '/message/send',
    payload
  )
  return response.data.message || response.data
}

export async function recallMessageApi(messageId) {
  const response = await http.put(`/message/recall/${messageId}`)
  return response.data
}

export async function deleteMessageApi(messageId) {
  const response = await http.delete(`/message/${messageId}`)
  return response.data
}