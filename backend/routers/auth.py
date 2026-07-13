from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
import bcrypt
from database import get_db
from models.user import User
from models.friendship import Friendship
from models.conversation import Conversation, ConversationMember
from models.message import Message
from utils.jwt_helper import create_token, get_current_user

router = APIRouter()

# Request Models
class RegisterRequest(BaseModel):
    phone: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    phone: str
    password: str

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

# Register
@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.phone == data.phone).first()

    if user:
        raise HTTPException(status_code=400, detail="Số điện thoại đã tồn tại")

    new_user = User(
        phone=data.phone,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        avatar=""
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_token(new_user.id)

    return {
        "message": "Đăng ký thành công",
        "token": token,
        "user": {
            "id": new_user.id,
            "phone": new_user.phone,
            "full_name": new_user.full_name,
            "avatar": new_user.avatar,
            "dob": new_user.dob
        }
    }
# Login
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.phone == data.phone).first()

    if not user:
        raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu")

    token = create_token(user.id)

    return {
        "message": "Đăng nhập thành công",
        "token": token,
        "user": {
            "id": user.id,
            "phone": user.phone,
            "full_name": user.full_name,
            "avatar": user.avatar,
            "dob": user.dob
        }
    }


@router.get("/")
def auth_home():
    return {"module": "auth"}


class UpdateProfileRequest(BaseModel):
    full_name: str
    dob: str | None = None
    avatar: str | None = None


@router.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    # Friends count
    friends_count = db.query(Friendship).filter(
        ((Friendship.user_id == current_user_id) | (Friendship.friend_id == current_user_id)) &
        (Friendship.status == "accepted")
    ).count()

    # Find accepted friendships to get friend IDs
    friendships = db.query(Friendship).filter(
        ((Friendship.user_id == current_user_id) | (Friendship.friend_id == current_user_id)) &
        (Friendship.status == "accepted")
    ).all()

    top_friends = []
    for f in friendships:
        friend_id = f.friend_id if f.user_id == current_user_id else f.user_id
        friend_user = db.query(User).filter(User.id == friend_id).first()
        if not friend_user:
            continue
        
        # Get private conversation
        conv = db.query(Conversation.id).join(
            ConversationMember, Conversation.id == ConversationMember.conversation_id
        ).filter(
            Conversation.type == "private"
        ).filter(
            ConversationMember.user_id.in_([current_user_id, friend_id])
        ).group_by(Conversation.id).having(
            func.count(Conversation.id) == 2
        ).first()

        msg_cnt = 0
        if conv:
            msg_cnt = db.query(Message).filter(Message.conversation_id == conv[0]).count()

        top_friends.append({
            "id": friend_user.id,
            "full_name": friend_user.full_name,
            "avatar": friend_user.avatar,
            "phone": friend_user.phone,
            "message_count": msg_cnt
        })

    # Sort and take top 3
    top_friends.sort(key=lambda x: x["message_count"], reverse=True)
    top_3 = top_friends[:3]

    return {
        "id": user.id,
        "phone": user.phone,
        "full_name": user.full_name,
        "avatar": user.avatar,
        "dob": user.dob,
        "friends_count": friends_count,
        "top_friends": top_3
    }


@router.put("/profile")
def update_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    user.full_name = data.full_name
    if data.dob is not None:
        user.dob = data.dob
    if data.avatar is not None:
        user.avatar = data.avatar

    db.commit()
    db.refresh(user)

    return {
        "message": "Cập nhật hồ sơ thành công",
        "user": {
            "id": user.id,
            "phone": user.phone,
            "full_name": user.full_name,
            "avatar": user.avatar,
            "dob": user.dob
        }
    }