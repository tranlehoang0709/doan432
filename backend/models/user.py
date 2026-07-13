from sqlalchemy import Column, Integer, String, Enum

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)

    phone = Column(String(20), unique=True)

    password_hash = Column(String(255))

    full_name = Column(String(100))

    avatar = Column(String(255))

    status = Column(Enum("online", "offline"), default="offline")

    dob = Column(String(50), nullable=True)