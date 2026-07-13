from sqlalchemy import Column, Integer, BigInteger, String, Text, Boolean, DateTime, Enum, ForeignKey
from datetime import datetime

from database import Base


class Message(Base):

    __tablename__ = "messages"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    conversation_id = Column(
        Integer,
        nullable=False
    )

    sender_id = Column(
        Integer,
        nullable=False
    )

    message_type = Column(
        String,
        default="text"
    )

    content = Column(
        Text
    )

    file_url = Column(
        String,
        nullable=True
    )

    is_recalled = Column(
        Boolean,
        default=False
    )

    status = Column(
        Enum("sent", "delivered", "seen"),
        default="sent"
    )

    reply_message_id = Column(
        BigInteger,
        ForeignKey("messages.id"),
        nullable=True
    )

    is_edited = Column(
        Boolean,
        default=False
    )

    is_pinned = Column(
        Boolean,
        default=False
    )

    deleted_by_sender = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )