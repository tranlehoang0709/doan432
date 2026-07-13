from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey

from database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True)

    message_id = Column(
        Integer,
        ForeignKey("messages.id")
    )

    file_name = Column(String(255))

    file_url = Column(String(500))

    file_type = Column(
        String(20)
    )