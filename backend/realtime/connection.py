class ConnectionManager:

    def __init__(self):
        self.clients = {}

    def add(self,user_id,conn):
        self.clients[user_id] = conn

    def remove(self,user_id):
        if user_id in self.clients:
            del self.clients[user_id]

    def send(self,user_id,data):
        if user_id in self.clients:
            self.clients[user_id].send(data)