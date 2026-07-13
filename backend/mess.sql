CREATE DATABASE mess;
USE mess;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    status ENUM('online','offline') DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE friendships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    status ENUM('pending','accepted','blocked') DEFAULT 'pending',

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);
CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('private','group') NOT NULL,
    name VARCHAR(100),
    avatar VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE conversation_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,

    FOREIGN KEY (conversation_id)
        REFERENCES conversations(id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
);
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,

    message_type ENUM(
        'text',
        'image',
        'file'
    ) DEFAULT 'text',

    content TEXT,

    file_url VARCHAR(255),

    is_recalled BOOLEAN DEFAULT FALSE,

    status ENUM('sent', 'delivered', 'seen') DEFAULT 'sent',
    reply_message_id BIGINT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    deleted_by_sender BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id)
        REFERENCES conversations(id),

    FOREIGN KEY (sender_id)
        REFERENCES users(id),

    FOREIGN KEY (reply_message_id)
        REFERENCES messages(id)
);
CREATE TABLE login_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    token VARCHAR(500),

    expired_at DATETIME,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
);
CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    message_id BIGINT NOT NULL,

    file_name VARCHAR(255),

    file_url VARCHAR(500),

    file_type VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (message_id)
        REFERENCES messages(id)
);