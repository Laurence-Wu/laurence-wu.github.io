import pymysql
from flask import Flask, request
import os
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import datetime

def store_blog_with_images(title, author, content_parts, image_map):
    """Store blog post with precise image positioning using PyMySQL"""
    load_dotenv()
    try:
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
        cursor = conn.cursor()

        # Create new blog post
        pub_day = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("INSERT INTO blog_posts (title, author, pub_date) VALUES (%s, %s, %s)", (title, author, pub_day))
        new_post_id = cursor.lastrowid
        print(f"New blog post created with ID: {new_post_id}")
        
        # Insert content blocks in sequence
        for i, block in enumerate(content_parts):
            if block["type"] == "paragraph":
                # Store paragraph block
                cursor.execute(
                    "INSERT INTO blog_content_blocks (post_id, block_type, content, sequence_order) VALUES (%s, %s, %s, %s)",
                    (new_post_id, 'paragraph', block["content"], i)
                )
                print(f"Paragraph block inserted at sequence {i}")
                
            elif block["type"] == "image":
                # Store image block
                image_id = block["id"]
                if image_id in image_map and "path" in image_map[image_id]:
                    img_info = image_map[image_id]
                    
                    # Create content block for image
                    cursor.execute(
                        "INSERT INTO blog_content_blocks (post_id, block_type, content, sequence_order) VALUES (%s, %s, %s, %s)",
                        (new_post_id, 'image', image_id, i)
                    )
                    content_block_id = cursor.lastrowid
                    print(f"Image block inserted at sequence {i} with content block ID: {content_block_id}")
                    
                    # Store image data
                    with open(img_info["path"], 'rb') as img_file:
                        img_data = img_file.read()
                    
                    cursor.execute(
                        "INSERT INTO blog_images (post_id, block_id, image_name, image_data, content_type, width, height) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                        (new_post_id, content_block_id, img_info["filename"], img_data, img_info["content_type"], img_info.get("width", 0), img_info.get("height", 0))
                    )
                    print(f"Image data stored for image ID: {image_id}")
        
        conn.commit()
        print("Blog post and content blocks committed successfully")
        return new_post_id
    except Exception as e:
        conn.rollback()
        print(f"Error storing blog post: {e}")
        return None
    finally:
        conn.close()
        print("Database connection closed")