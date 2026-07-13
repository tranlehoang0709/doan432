from datetime import datetime
from datetime import timedelta

from jose import jwt

from fastapi import Depends
from fastapi import HTTPException

from fastapi.security import OAuth2PasswordBearer


SECRET_KEY = "mess_secret_key"

ALGORITHM = "HS256"


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def create_token(user_id):

    data = {
        "user_id": user_id,
        "exp":
        datetime.utcnow()
        +
        timedelta(days=7)
    }


    token = jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token



def verify_token(token):

    try:

        data = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[
                ALGORITHM
            ]
        )

        return data

    except:

        return None



# Lấy user hiện tại từ JWT
def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    data = verify_token(token)


    if not data:

        raise HTTPException(
            status_code=401,
            detail="Token không hợp lệ"
        )


    return data["user_id"]