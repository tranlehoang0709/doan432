from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.message import Message
from utils.jwt_helper import get_current_user

router = APIRouter()


@router.get("/")
def message_home():
    return {
        "module": "message"
    }


@router.get("/list")
def list_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    # Mark incoming messages from other users in this conversation as seen
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user_id,
        Message.status != "seen"
    ).update({Message.status: "seen"}, synchronize_session=False)
    db.commit()

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(
        Message.created_at.asc()
    ).all()

    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "message_type": msg.message_type or "text",
            "file_url": msg.file_url,
            "reply_message_id": msg.reply_message_id,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
            "is_recalled": msg.is_recalled,
            "status": msg.status or "sent",
            "attachments": []
        })

    return result


class SendMessageSchema(BaseModel):
    conversation_id: int
    sender_id: int
    content: str
    message_type: str = "text"
    file_url: Optional[str] = None
    reply_message_id: Optional[int] = None


# Gửi tin nhắn
@router.post("/send")
def send_message(
    data: SendMessageSchema,
    db: Session = Depends(get_db)
):

    message = Message(
        conversation_id=data.conversation_id,
        sender_id=data.sender_id,
        content=data.content,
        message_type=data.message_type,
        file_url=data.file_url,
        reply_message_id=data.reply_message_id,
        status="sent"
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "content": message.content,
        "message_type": message.message_type,
        "file_url": message.file_url,
        "reply_message_id": message.reply_message_id,
        "created_at": message.created_at.isoformat() if message.created_at else None,
        "is_recalled": message.is_recalled,
        "status": message.status or "sent",
        "attachments": []
    }


# Lấy lịch sử chat
@router.get("/history/{user_id}/{friend_id}")
def get_history(
    user_id: int,
    friend_id: int,
    db: Session = Depends(get_db)
):

    messages = db.query(Message).filter(
        (
            (Message.sender_id == user_id) &
            (Message.receiver_id == friend_id)
        ) |
        (
            (Message.sender_id == friend_id) &
            (Message.receiver_id == user_id)
        )
    ).order_by(
        Message.created_at
    ).all()

    return messages


# Sửa tin nhắn
@router.put("/{message_id}")
def edit_message(
    message_id: int,
    content: str,
    db: Session = Depends(get_db)
):

    message = db.query(Message).filter(
        Message.id == message_id
    ).first()

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin nhắn"
        )

    message.content = content
    message.edited = True

    db.commit()

    return {
        "message": "Đã sửa tin nhắn"
    }


# Thu hồi tin nhắn
@router.put("/recall/{message_id}")
def recall_message(
    message_id: int,
    db: Session = Depends(get_db)
):
    message = db.query(Message).filter(
        Message.id == message_id
    ).first()

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin nhắn"
        )

    message.is_recalled = True
    db.commit()

    return {
        "message": "Đã thu hồi tin nhắn",
        "id": message.id,
        "is_recalled": True
    }


# Xóa tin nhắn
@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db)
):

    message = db.query(Message).filter(
        Message.id == message_id
    ).first()

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin nhắn"
        )

    message.deleted_by_sender = True

    db.commit()

    return {
        "message": "Đã xóa tin nhắn"
    }


# Reply tin nhắn
@router.post("/reply")
def reply_message(
    sender_id: int,
    receiver_id: int,
    reply_id: int,
    content: str,
    db: Session = Depends(get_db)
):

    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        reply_id=reply_id,
        content=content
    )

    db.add(message)
    db.commit()

    return {
        "message": "Đã reply"
    }


# Forward tin nhắn
@router.post("/forward")
def forward_message(
    message_id: int,
    receiver_id: int,
    db: Session = Depends(get_db)
):

    old_message = db.query(Message).filter(
        Message.id == message_id
    ).first()

    if not old_message:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin nhắn"
        )

    new_message = Message(
        sender_id=old_message.sender_id,
        receiver_id=receiver_id,
        content=old_message.content
    )

    db.add(new_message)
    db.commit()

    return {
        "message": "Đã chuyển tiếp"
    }


# Ghim tin nhắn
@router.put("/pin/{message_id}")
def pin_message(
    message_id: int,
    db: Session = Depends(get_db)
):

    message = db.query(Message).filter(
        Message.id == message_id
    ).first()

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin nhắn"
        )

    message.pinned = True

    db.commit()

    return {
        "message": "Đã ghim tin nhắn"
    }


# Đánh dấu đã xem
@router.put("/seen/{message_id}")
def seen_message(
    message_id: int,
    db: Session = Depends(get_db)
):

    message = db.query(Message).filter(
        Message.id == message_id
    ).first()

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tin nhắn"
        )

    message.status = "seen"

    db.commit()

    return {
        "message": "Đã xem"
    }