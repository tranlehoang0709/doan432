import socket
HOST = "0.0.0.0"
PORT = 9000
server = socket.socket(
    socket.AF_INET,
    socket.SOCK_STREAM
)
server.bind(
    (HOST, PORT)
)
server.listen(10)
print("Server running")
while True:
    client, address = server.accept()
    print(
        "Client:",
        address
    )
    data = client.recv(1024)
    print(
        data.decode()
    )
    client.send(
        "Hello Client".encode()
    )