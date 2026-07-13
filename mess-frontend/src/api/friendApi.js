import http from './http'


export async function getFriendsApi(user_id) {
  const response = await http.get(`/friend/list/${user_id}`)
  if (Array.isArray(response.data)) {
    return response.data
  }
  if (response.data.friends) {
    return response.data.friends
  }
  return []
}

export async function addFriendApi(payload) {
  const response = await http.post(
    '/friend/add',
    payload
  )
  return response.data
}

export async function getFriendRequestsApi(user_id) {
  const response = await http.get(`/friend/requests/${user_id}`)
  if (Array.isArray(response.data)) {
    return response.data
  }
  if (response.data.requests) {
    return response.data.requests
  }
  return []
}

export async function rejectFriendApi(request_id) {
  const response = await http.put(`/friend/reject/${request_id}`)
  return response.data
}