from extractDOCX import extract_docx_with_image_positions
from StoreDOCX import store_blog_with_images


if __name__ == "__main__":
    author = "Xiaoyou Wu"
    name = "测试coding"
    try:
        content_parts, image_map = extract_docx_with_image_positions(f"backend/Assets/{name}.docx")
    except Exception as e:
        print(f"Error extracting DOCX: {e}")
        exit(1)
    
    try:
        new_post_id = store_blog_with_images(name, author, content_parts, image_map)
    except Exception as e:
        print(f"Error storing blog with images: {e}")
        exit(1)
    
    print(f"New post created with ID: {new_post_id}")
