import http from './http'

export async function uploadImageApi(file) {
  const formData = new FormData()
  formData.append('image', file)
  const response = await http.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function uploadFileApi(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await http.post('/upload/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
