from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from models.message import Message
from models.conversation import Conversation
from models.user import User

from utils.jwt_helper import get_current_user


router = APIRouter()


@router.get("/messages")
def search_messages(
    keyword: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    messages = (
        db.query(Message)
        .join(
            Conversation,
            Message.conversation_id == Conversation.id
        )
        .filter(
            Message.content.like(f"%{keyword}%"),
            Message.sender_id == current_user.id
        )
        .order_by(
            Message.created_at.desc()
        )
        .all()
    )


    result = []

    for msg in messages:
        result.append({
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "created_at": msg.created_at
        })


    return {
        "keyword": keyword,
        "total": len(result),
        "messages": result
    }


from models.friendship import Friendship

@router.get("/users")
def search_users(
    keyword: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    users = (
        db.query(User)
        .filter(
            User.id != current_user_id,
            or_(
                User.full_name.like(f"%{keyword}%"),
                User.phone.like(f"%{keyword}%")
            )
        )
        .limit(20)
        .all()
    )

    results = []
    for u in users:
        friendship = db.query(Friendship).filter(
            or_(
                (Friendship.user_id == current_user_id) & (Friendship.friend_id == u.id),
                (Friendship.user_id == u.id) & (Friendship.friend_id == current_user_id)
            )
        ).first()

        friendship_status = "none"
        if friendship:
            if friendship.status == "accepted":
                friendship_status = "accepted"
            elif friendship.status == "blocked":
                friendship_status = "blocked"
            elif friendship.status == "pending":
                if friendship.user_id == current_user_id:
                    friendship_status = "sent"
                else:
                    friendship_status = "pending"

        results.append({
            "id": u.id,
            "phone": u.phone,
            "full_name": u.full_name,
            "avatar": u.avatar,
            "friendship_status": friendship_status
        })

    return results