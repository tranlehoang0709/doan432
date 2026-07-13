import socket
import threading

from .protocol import encode,decode
from .connection import ConnectionManager

from database import get_db
from models.message import Message

HOST = "0.0.0.0"
PORT = 9000
manager = ConnectionManager()
def handle_client(conn):
    user_id = None
    while True:
        try:
            data = conn.recv(4096)
            if not data:
                break
            message = decode(data)
            if message["type"] == "connect":
                user_id = message["user_id"]
                manager.add(
                    user_id,
                    conn
                )
                print(
                    "online:",
                    user_id
                )
            elif message["type"] == "message":
                db = get_db()
                new_message = Message(
                    conversation_id =
                    message["conversation_id"],
                    sender_id =
                    message["sender"],
                    content =
                    message["content"]
                )
                db.add(new_message)
                db.commit()
                db.close()
                receiver = message["receiver"]
                manager.send(
                    receiver,
                    encode(message)
                )
        except Exception as e:
            print(e)
            break
    if user_id:
        manager.remove(user_id)
    conn.close()

def start_server():
    server = socket.socket(
        socket.AF_INET,
        socket.SOCK_STREAM
    )
    server.bind(
        (
            HOST,
            PORT
        )
    )
    server.listen(100)
    print(
        "Realtime server running..."
    )
    while True:
        conn,addr = server.accept()
        print(
            "Connect:",
            addr
        )
        threading.Thread(
            target=handle_client,
            args=(conn,)
        ).start()
if __name__ == "__main__":
    start_server()