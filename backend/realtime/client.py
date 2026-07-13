import socket
import threading
from .protocol import encode,decode
class RealtimeClient:
    def __init__(
        self,
        ip,
        port,
        user_id
    ):
        self.socket = socket.socket(
            socket.AF_INET,
            socket.SOCK_STREAM
        )
        self.socket.connect(
            (
                ip,
                port
            )
        )
        self.user_id = user_id
    def connect(self):
        self.socket.send(
            encode(
                {
                    "type":"connect",
                    "user_id":self.user_id
                }
            )
        )
        threading.Thread(
            target=self.listen
        ).start()
    def listen(self):
        while True:
            data = self.socket.recv(4096)
            message = decode(data)
            print(
                "MESSAGE:",
                message
            )
    def send_message(
        self,
        receiver,
        conversation_id,
        text
    ):
        data = {
            "type":"message",
            "sender":self.user_id,
            "receiver":receiver,
            "conversation_id":conversation_id,
            "content":text
        }
        self.socket.send(
            encode(data)
        )