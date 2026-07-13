from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from database import get_db
from models.friendship import Friendship
from models.user import User
from utils.jwt_helper import get_current_user

router = APIRouter(
    tags=["Friend"]
)


# Test router
@router.get("/")
def friend_home():
    return {
        "module": "friend"
    }


# Gửi lời mời kết bạn
@router.post("/request")
def send_friend_request(
    user_id: int,
    friend_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == friend_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User không tồn tại"
        )

    exists = db.query(Friendship).filter(
        Friendship.user_id == user_id,
        Friendship.friend_id == friend_id
    ).first()

    if exists:
        raise HTTPException(
            status_code=400,
            detail="Đã gửi lời mời hoặc đã kết bạn"
        )

    request = Friendship(
        user_id=user_id,
        friend_id=friend_id,
        status="pending"
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return {
        "message": "Đã gửi lời mời kết bạn"
    }


# Xem lời mời kết bạn
@router.get("/requests/{user_id}")
def get_friend_requests(
    user_id: int,
    db: Session = Depends(get_db)
):
    requests = db.query(Friendship, User).join(
        User, Friendship.user_id == User.id
    ).filter(
        Friendship.friend_id == user_id,
        Friendship.status == "pending"
    ).all()

    results = []
    for friendship, user in requests:
        results.append({
            "id": friendship.id,
            "user_id": friendship.user_id,
            "friend_id": friendship.friend_id,
            "status": friendship.status,
            "full_name": user.full_name,
            "phone": user.phone,
            "avatar": user.avatar
        })

    return results


# Chấp nhận lời mời
@router.put("/accept/{friend_request_id}")
def accept_friend(
    friend_request_id: int,
    db: Session = Depends(get_db)
):

    request = db.query(Friendship).filter(
        Friendship.id == friend_request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lời mời"
        )

    request.status = "accepted"

    # Create private conversation if not exists
    from models.conversation import Conversation, ConversationMember
    existing_conv = db.query(Conversation).join(
        ConversationMember, Conversation.id == ConversationMember.conversation_id
    ).filter(
        Conversation.type == "private"
    ).filter(
        ConversationMember.user_id.in_([request.user_id, request.friend_id])
    ).group_by(Conversation.id).having(
        func.count(Conversation.id) == 2
    ).first()

    if not existing_conv:
        new_conv = Conversation(
            type="private",
            name=None,
            avatar=None,
            created_by=request.friend_id
        )
        db.add(new_conv)
        db.commit()
        db.refresh(new_conv)

        member1 = ConversationMember(
            conversation_id=new_conv.id,
            user_id=request.user_id
        )
        member2 = ConversationMember(
            conversation_id=new_conv.id,
            user_id=request.friend_id
        )
        db.add(member1)
        db.add(member2)

    db.commit()

    return {
        "message": "Đã chấp nhận lời mời"
    }


# Từ chối lời mời
@router.put("/reject/{friend_request_id}")
def reject_friend(
    friend_request_id: int,
    db: Session = Depends(get_db)
):

    request = db.query(Friendship).filter(
        Friendship.id == friend_request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lời mời"
        )

    db.delete(request)
    db.commit()

    return {
        "message": "Đã từ chối lời mời"
    }


# Danh sách bạn bè
@router.get("/list/{user_id}")
def get_friend_list(
    user_id: int,
    db: Session = Depends(get_db)
):
    friendships = db.query(Friendship).filter(
        or_(
            (Friendship.user_id == user_id) & (Friendship.status == "accepted"),
            (Friendship.friend_id == user_id) & (Friendship.status == "accepted")
        )
    ).all()

    results = []
    for f in friendships:
        friend_id = f.friend_id if f.user_id == user_id else f.user_id
        friend_user = db.query(User).filter(User.id == friend_id).first()
        if friend_user:
            results.append({
                "id": friend_user.id,
                "full_name": friend_user.full_name,
                "phone": friend_user.phone,
                "avatar": friend_user.avatar,
                "status": "online"
            })

    return results


# Xóa bạn
@router.delete("/{friend_id}")
def remove_friend(
    friend_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):

    friend = db.query(Friendship).filter(
        Friendship.user_id == user_id,
        Friendship.friend_id == friend_id,
        Friendship.status == "accepted"
    ).first()

    if not friend:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy bạn bè"
        )

    db.delete(friend)
    db.commit()

    return {
        "message": "Đã xóa bạn"
    }


# Chặn người dùng
@router.put("/block/{friend_id}")
def block_user(
    friend_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):

    friend = db.query(Friendship).filter(
        Friendship.user_id == user_id,
        Friendship.friend_id == friend_id
    ).first()

    if not friend:
        friend = Friendship(
            user_id=user_id,
            friend_id=friend_id,
            status="blocked"
        )

        db.add(friend)

    else:
        friend.status = "blocked"

    db.commit()

    return {
        "message": "Đã chặn người dùng"
    }


class AddFriendRequest(BaseModel):
    friend_id: int


@router.post("/add")
def add_friend(
    data: AddFriendRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    if current_user_id == data.friend_id:
        raise HTTPException(
            status_code=400,
            detail="Không thể kết bạn với chính mình"
        )

    target_user = db.query(User).filter(User.id == data.friend_id).first()
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người dùng này"
        )

    friendship = db.query(Friendship).filter(
        or_(
            (Friendship.user_id == current_user_id) & (Friendship.friend_id == data.friend_id),
            (Friendship.user_id == data.friend_id) & (Friendship.friend_id == current_user_id)
        )
    ).first()

    if friendship:
        if friendship.status == "accepted":
            return {"message": "Hai người đã là bạn bè", "status": "accepted"}
        elif friendship.status == "blocked":
            raise HTTPException(
                status_code=400,
                detail="Đã chặn người dùng này hoặc bạn đang bị chặn"
            )
        elif friendship.status == "pending":
            if friendship.friend_id == current_user_id:
                friendship.status = "accepted"
                
                # Create private conversation if not exists
                from models.conversation import Conversation, ConversationMember
                existing_conv = db.query(Conversation).join(
                    ConversationMember, Conversation.id == ConversationMember.conversation_id
                ).filter(
                    Conversation.type == "private"
                ).filter(
                    ConversationMember.user_id.in_([current_user_id, data.friend_id])
                ).group_by(Conversation.id).having(
                    func.count(Conversation.id) == 2
                ).first()

                if not existing_conv:
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
                return {"message": "Đã chấp nhận kết bạn", "status": "accepted"}
            else:
                return {"message": "Đã gửi lời mời kết bạn trước đó", "status": "sent"}

    new_friendship = Friendship(
        user_id=current_user_id,
        friend_id=data.friend_id,
        status="pending"
    )
    db.add(new_friendship)
    db.commit()
    return {"message": "Đã gửi lời mời kết bạn", "status": "sent"}