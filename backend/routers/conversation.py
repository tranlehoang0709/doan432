from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.conversation import Conversation, ConversationMember
from models.user import User
from models.message import Message
from utils.jwt_helper import get_current_user

router = APIRouter()


@router.get("/")
def conversation_home():
    return {
        "module": "conversation"
    }


class CreatePrivateChatSchema(BaseModel):
    friend_id: int


@router.post("/private")
def create_private_chat(
    data: CreatePrivateChatSchema,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    # Check if a private conversation already exists between current_user_id and friend_id
    existing_conv = db.query(Conversation).join(
        ConversationMember, Conversation.id == ConversationMember.conversation_id
    ).filter(
        Conversation.type == "private"
    ).filter(
        ConversationMember.user_id.in_([current_user_id, data.friend_id])
    ).group_by(Conversation.id).having(
        func.count(Conversation.id) == 2
    ).first()

    if existing_conv:
        return {
            "message": "private chat already exists",
            "id": existing_conv.id
        }

    new_conv = Conversation(
        type="private",
        name=None,
        avatar=None,
        created_by=current_user_id
    )
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    member1 = ConversationMember(
        conversation_id=new_conv.id,
        user_id=current_user_id
    )
    member2 = ConversationMember(
        conversation_id=new_conv.id,
        user_id=data.friend_id
    )
    db.add(member1)
    db.add(member2)
    db.commit()

    return {
        "message": "private chat created",
        "id": new_conv.id
    }


class CreateGroupSchema(BaseModel):
    name: str
    member_ids: list[int]


@router.post("/group")
def create_group(
    data: CreateGroupSchema,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    new_conv = Conversation(
        type="group",
        name=data.name,
        avatar=None,
        created_by=current_user_id
    )
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    # Add creator
    creator_member = ConversationMember(
        conversation_id=new_conv.id,
        user_id=current_user_id
    )
    db.add(creator_member)

    # Add other members
    for uid in data.member_ids:
        if uid != current_user_id:
            member = ConversationMember(
                conversation_id=new_conv.id,
                user_id=uid
            )
            db.add(member)

    db.commit()
    return {
        "message": "group created",
        "id": new_conv.id
    }


@router.get("/list")
def get_conversations(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    # Get all conversations where current_user_id is a member
    member_subquery = db.query(ConversationMember.conversation_id).filter(
        ConversationMember.user_id == current_user_id
    ).subquery()

    conversations = db.query(Conversation).filter(
        Conversation.id.in_(member_subquery)
    ).all()

    # Mark messages sent by others in these conversations as "delivered"
    conv_ids = [c.id for c in conversations]
    if conv_ids:
        db.query(Message).filter(
            Message.conversation_id.in_(conv_ids),
            Message.sender_id != current_user_id,
            Message.status == "sent"
        ).update({Message.status: "delivered"}, synchronize_session=False)
        db.commit()

    results = []
    for conv in conversations:
        conv_name = conv.name
        conv_avatar = conv.avatar
        online = False

        if conv.type == "private":
            # Find the other member
            other_member = db.query(ConversationMember).filter(
                ConversationMember.conversation_id == conv.id,
                ConversationMember.user_id != current_user_id
            ).first()
            if other_member:
                other_user = db.query(User).filter(User.id == other_member.user_id).first()
                if other_user:
                    conv_name = other_user.full_name
                    conv_avatar = other_user.avatar
                    online = (other_user.status == "online")

        # Get last message
        last_msg = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(
            Message.created_at.desc()
        ).first()

        last_message_content = ""
        last_time_str = ""
        last_message_sender_id = None
        last_message_status = None
        if last_msg:
            last_message_content = last_msg.content or ""
            last_message_sender_id = last_msg.sender_id
            last_message_status = last_msg.status or "sent"
            if last_msg.created_at:
                last_time_str = last_msg.created_at.strftime("%H:%M")

        results.append({
            "id": conv.id,
            "type": conv.type,
            "name": conv_name,
            "avatar": conv_avatar,
            "last_message": last_message_content,
            "last_message_sender_id": last_message_sender_id,
            "last_message_status": last_message_status,
            "last_time": last_time_str,
            "unread": 0,
            "online": online
        })

    return results