# API contract để Backend làm theo Frontend

Frontend hiện đã bám theo các module Backend đang có: `auth`, `friend`, `conversation`, `message`, `upload`.

## Base URL

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Auth

### POST `/auth/register`
Request:

```json
{
  "full_name": "Nguyễn Anh Minh",
  "phone": "0901234567",
  "password": "123456"
}
```

Response:

```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "full_name": "Nguyễn Anh Minh",
    "phone": "0901234567",
    "avatar": null
  }
}
```

### POST `/auth/login`
Request:

```json
{
  "phone": "0901234567",
  "password": "123456"
}
```

Response giống `/auth/register`.

## Friend

### GET `/friend/list`
Response:

```json
{
  "friends": [
    {
      "id": 2,
      "full_name": "Nguyễn Văn An",
      "phone": "0901111111",
      "avatar": null,
      "status": "online"
    }
  ]
}
```

### POST `/friend/add`
Request:

```json
{
  "friend_id": 2
}
```

Response:

```json
{
  "message": "friend request sent"
}
```

## Conversation

### GET `/conversation/list`
Response:

```json
{
  "conversations": [
    {
      "id": 1,
      "type": "private",
      "name": "Nguyễn Văn An",
      "avatar": null,
      "last_message": "Hello",
      "last_time": "10:30",
      "unread": 0,
      "online": true
    }
  ]
}
```

### POST `/conversation/private`
Request:

```json
{
  "friend_id": 2
}
```

### POST `/conversation/group`
Request:

```json
{
  "name": "Nhóm đồ án",
  "member_ids": [2, 3, 4]
}
```

## Message

Backend hiện chưa có API list/send message, FE đã chuẩn bị sẵn 2 endpoint sau.

### GET `/message/list?conversation_id=1`
Response:

```json
{
  "messages": [
    {
      "id": 1,
      "conversation_id": 1,
      "sender_id": 1,
      "content": "Hello",
      "created_at": "2026-06-28T15:30:00",
      "is_recalled": false,
      "attachments": []
    }
  ]
}
```

### POST `/message/send`
Request:

```json
{
  "conversation_id": 1,
  "sender_id": 1,
  "content": "Hello"
}
```

Response trả về message vừa tạo.

## Upload

### POST `/upload/image`
FormData field: `image`

### POST `/upload/file`
FormData field: `file`

Response hiện tại Backend đang trả về:

```json
{
  "filename": "avatar.png"
}
```

## Ghi chú quan trọng

Backend cần bật CORS để FE gọi API từ `http://localhost:5173`.
