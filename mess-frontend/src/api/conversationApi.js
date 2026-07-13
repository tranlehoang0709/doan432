import http from './http'


export async function getConversationsApi() {
  const response = await http.get('/conversation/list')
  if (Array.isArray(response.data)) {
    return response.data
  }
  if (response.data.conversations) {
    return response.data.conversations
  }
  return []
}

export async function createPrivateConversationApi(payload) {

  const response = await http.post(
    '/conversation/private',
    payload
  )
  return response.data
}

export async function createGroupConversationApi(payload) {
  const response = await http.post(
    '/conversation/group',
    payload
  )
  return response.data
}