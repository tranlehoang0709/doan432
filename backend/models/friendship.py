from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import ForeignKey
from sqlalchemy import Enum

from database import Base

class Friendship(Base):
    __tablename__ = "friendships"
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    friend_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    status = Column(
        Enum(
            "pending",
            "accepted",
            "blocked"
        ),
        default="pending"
    )