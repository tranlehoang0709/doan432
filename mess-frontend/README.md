# Mess Frontend

Frontend React/Vite cho project Mess App, giao diện trắng giống Telegram và đã chuẩn bị sẵn lớp gọi API theo Backend FastAPI.

## Chạy project

```powershell
npm install
npm run dev
```

Mở:

```txt
http://localhost:5173/
```

## Kết nối Backend

Tạo file `.env` trong thư mục `mess-frontend`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_FALLBACK=true
```

`VITE_USE_MOCK_FALLBACK=true` giúp FE vẫn chạy được khi Backend chưa hoàn thiện API thật. Khi Backend đã đủ API, đổi thành:

```env
VITE_USE_MOCK_FALLBACK=false
```

## API đã chuẩn bị

Frontend đang gọi các route:

```txt
GET  /
POST /auth/login
POST /auth/register
GET  /friend/list
POST /friend/add
GET  /conversation/list
POST /conversation/private
POST /conversation/group
GET  /message/list?conversation_id=1
POST /message/send
POST /upload/image
POST /upload/file
```

Backend hiện tại mới có một số route dạng skeleton, nên xem file `API_CONTRACT_FOR_BACKEND.md` để thành viên Backend làm đúng response FE cần.

## CORS Backend

Backend FastAPI cần bật CORS cho `http://localhost:5173`.
