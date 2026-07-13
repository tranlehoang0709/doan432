import http from './http'

export async function searchUsersApi(keyword) {
  const response = await http.get('/search/users', {
    params: { keyword }
  })
  return response.data || []
}
