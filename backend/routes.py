from flask import Flask, request, jsonify, send_file
import pymysql
import os
from flask_cors import CORS, cross_origin
import base64
from io import BytesIO

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

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

@app.route('/api/blog_posts', methods=['GET'])
@cross_origin()
def get_blog_posts(conn=conn):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, author, pub_date, last_modified 
            FROM blog_posts 
        """)
        
        posts = cursor.fetchall()

        for post in posts:
            post['pub_date'] = post['pub_date'].strftime('%Y-%m-%d %H:%M:%S')
            post['last_modified'] = post['last_modified'].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        
        print(posts)
        return jsonify(posts)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/blog/<int:post_id>', methods=['GET'])
def get_blog_post(post_id, conn=conn):
    try:
        cursor = conn.cursor()
        
        # Get blog post details
        cursor.execute("""
            SELECT id, title, author, pub_date, last_modified 
            FROM blog_posts 
            WHERE id = %s
        """, (post_id,))
        
        post = cursor.fetchone()
        if not post:
            return jsonify({"error": "Blog post not found"}), 404
        
        # Convert datetime objects to strings for JSON serialization
        post['pub_date'] = post['pub_date'].strftime('%Y-%m-%d %H:%M:%S')
        post['last_modified'] = post['last_modified'].strftime('%Y-%m-%d %H:%M:%S')
        
        # Get content blocks in sequence order
        cursor.execute("""
            SELECT id, block_type, content, sequence_order 
            FROM blog_content_blocks 
            WHERE post_id = %s 
            ORDER BY sequence_order
        """, (post_id,))
        
        content_blocks = []
        for block in cursor.fetchall():
            block_data = {
                "type": block['block_type'],
                "content": block['content'],
                "sequence": block['sequence_order']
            }
            
            # If it's an image block, fetch the image data
            if block['block_type'] == 'image':
                cursor.execute("""
                    SELECT image_name, content_type, width, height, image_data 
                    FROM blog_images 
                    WHERE post_id = %s AND block_id = %s
                """, (post_id, block['id']))
                
                image = cursor.fetchone()
                if image:
                    # Convert binary image to base64 string for embedding in JSON
                    image_b64 = base64.b64encode(image['image_data']).decode('utf-8')
                    block_data.update({
                        "image_name": image['image_name'],
                        "content_type": image['content_type'],
                        "width": image['width'],
                        "height": image['height'],
                        "image_data": f"data:{image['content_type']};base64,{image_b64}"
                    })
            
            content_blocks.append(block_data)
        
        # Add content blocks to post data
        post['content_blocks'] = content_blocks
        
        cursor.close()
        
        return jsonify(post)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Optional endpoint to serve images directly if you prefer not to use base64
@app.route('/api/blog/image/<int:image_id>', methods=['GET'])
def get_blog_image(image_id,conn=conn):
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT image_data, content_type 
            FROM blog_images 
            WHERE id = %s
        """, (image_id,))
        
        image = cursor.fetchone()
        if not image:
            return "Image not found", 404
        
        cursor.close()
        conn.close()
        
        return send_file(
            BytesIO(image['image_data']),
            mimetype=image['content_type']
        )
    
    except Exception as e:
        return str(e), 500

@app.route('/home/<name>')
def homeFunction(name):
    return f"<h1>Hello {name} </br> </h1>" 

@app.route('/test')
def handleRequest():
    return str(request.args)
