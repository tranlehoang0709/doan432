import axios from 'axios'


export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('mess_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url
    console.warn(
      `[API ERROR] ${status || 'NETWORK'} ${url || ''}`,
      error?.message
    )
    if (status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('mess_token')
      localStorage.removeItem('mess_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
export async function checkApiHealth() {
  try {
    const response = await http.get('/')
    return {
      ok: true,
      data: response.data
    }
  } catch (error) {
    return {
      ok: false,
      error
    }
  }
}
export default http