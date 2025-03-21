from flask import Flask, request
import pymysql
import os
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import datetime

def creatAllTables():
    load_dotenv()
    timeout = 10000
    conn = pymysql.connect(
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        host="localhost",
        user="root",
        password=os.getenv("LocalPassword"),
        database="PersonalWebsite",
        read_timeout=timeout,
        write_timeout=timeout,
        port=3306
    )
    conn.autocommit(True)

    # Create tables using pymysql
    with conn.cursor() as cursor:
        # Create Blog Post Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS blog_posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE NOT NULL,
author VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
            pub_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """)

        # Create Content Block Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS blog_content_blocks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            block_type ENUM('paragraph', 'image', 'heading') NOT NULL,
            content TEXT,
            sequence_order INT NOT NULL,
            FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
        )
        """)

        # Create Blog Image Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS blog_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            block_id INT,
            image_name VARCHAR(255) NOT NULL,
            image_data MEDIUMBLOB,
            content_type VARCHAR(100),
            width INT,
            height INT,
            FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
            FOREIGN KEY (block_id) REFERENCES blog_content_blocks(id) ON DELETE SET NULL
        )
        """)

    conn.close()

if __name__ == "__main__":
    creatAllTables()
    print("Tables created successfully")
