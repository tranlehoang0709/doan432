import http from './http'


export async function loginApi(payload) {
  const response = await http.post('/auth/login', payload)

  const data = response.data

  if (data.user) {
    saveAuthSession({
      token: data.token || '',
      user: data.user
    })
  }

  return data
}


export async function registerApi(payload) {
  const response = await http.post('/auth/register', payload)

  return response.data
}


export function saveAuthSession({ token, user }) {
  if (token) {
    localStorage.setItem('mess_token', token)
  }

  if (user) {
    localStorage.setItem(
      'mess_user',
      JSON.stringify(user)
    )
  }
}


export function getAuthUser() {
  const rawUser = localStorage.getItem('mess_user')

  if (!rawUser || rawUser === "undefined") {
    return null
  }

  return JSON.parse(rawUser)
}


export function logoutApi() {
  localStorage.removeItem('mess_token')
  localStorage.removeItem('mess_user')
}

export async function getProfileApi() {
  const response = await http.get('/auth/profile')
  return response.data
}

export async function updateProfileApi(payload) {
  const response = await http.put('/auth/profile', payload)
  return response.data
}