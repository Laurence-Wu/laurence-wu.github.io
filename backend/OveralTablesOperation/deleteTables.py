from flask import Flask, request
import pymysql
import os
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import datetime

def deleteAllTables():
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
    print("Connected to MySQL database.")
    try:
        with conn.cursor() as cursor:
            cursor.execute("ALTER TABLE blog_content_blocks DROP FOREIGN KEY blog_content_blocks_ibfk_1")
            cursor.execute("ALTER TABLE blog_images DROP FOREIGN KEY blog_images_ibfk_1")
            cursor.execute("ALTER TABLE blog_images DROP FOREIGN KEY blog_images_ibfk_2")
            cursor.execute("DROP TABLE IF EXISTS blog_images")
            cursor.execute("DROP TABLE IF EXISTS blog_content_blocks")
            cursor.execute("DROP TABLE IF EXISTS blog_posts")
        print("Tables dropped successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()

def dropBlog(name):
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
    print(f"Connected to MySQL database to drop blog post with title {name}.")
    try:
        with conn.cursor() as cursor:
            # Find the post_id from blog_posts
            cursor.execute("SELECT id FROM blog_posts WHERE title = %s", (name,))
            post = cursor.fetchone()
            if post:
                post_id = post['id']
                
                # Find block_ids from blog_content_blocks
                cursor.execute("SELECT id FROM blog_content_blocks WHERE post_id = %s", (post_id,))
                blocks = cursor.fetchall()
                block_ids = [block['id'] for block in blocks]
                
                # Delete from blog_images using block_ids
                if block_ids:
                    cursor.execute("DELETE FROM blog_images WHERE block_id IN (%s)" % ','.join(['%s'] * len(block_ids)), block_ids)
                
                # Delete from blog_content_blocks using post_id
                cursor.execute("DELETE FROM blog_content_blocks WHERE post_id = %s", (post_id,))
                
                # Delete from blog_posts using post_id
                cursor.execute("DELETE FROM blog_posts WHERE id = %s", (post_id,))
                
                print(f"Blog post with title {name} and related content deleted successfully.")
            else:
                print(f"No blog post found with title {name}.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    deleteAllTables()
    print("Tables deleted successfully")
