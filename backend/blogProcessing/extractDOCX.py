from docx import Document
import os
import uuid
from PIL import Image
import io

def extract_docx_with_image_positions(docx_path, img_output_folder='images/'):
    """Extract text and images from DOCX without namespace issues"""
    
    # Ensure output directory exists
    if not os.path.exists(img_output_folder):
        os.makedirs(img_output_folder)
    
    document = Document(docx_path)
    content_parts = []
    image_map = {}
    image_counter = 0
    
    # Process each paragraph
    for para in document.paragraphs:
        # Check if paragraph is empty and has no images
        if not para.text.strip() and not para._element.xpath('.//*[local-name()="drawing"]'):
            continue
        
        # Check if paragraph contains images - using local-name() to avoid namespace issues
        has_images = len(para._element.xpath('.//*[local-name()="drawing"]')) > 0
        
        if has_images:
            # Handle paragraphs with both text and images
            if para.text.strip():
                content_parts.append({"type": "paragraph", "content": para.text})
                print(f"Added paragraph: {para.text}")
            
            # Extract and save images
            for inline in para._element.xpath('.//*[local-name()="drawing"]'):
                image_counter += 1
                image_id = f"img_{uuid.uuid4().hex[:8]}"
                image_map[image_id] = {"index": image_counter}
                
                # Insert image marker in content
                content_parts.append({"type": "image", "id": image_id})
                print(f"Added image marker: {image_id}")
                
                # Try to extract image
                try:
                    for blip in inline.xpath('.//*[local-name()="blip"]'):
                        # Get the relationship ID
                        rId = blip.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
                        if not rId:
                            # Try alternative attribute if the first one isn't found
                            rId = blip.get("embed")
                            
                        image_part = document.part.related_parts[rId]
                        image_filename = f"{image_id}.{image_part.content_type.split('/')[-1]}"
                        image_path = os.path.join(img_output_folder, image_filename)
                        
                        # Save image
                        with open(image_path, 'wb') as f:
                            f.write(image_part.blob)
                        print(f"Saved image: {image_filename}")
                        
                        # Record image details
                        image_map[image_id]["filename"] = image_filename
                        image_map[image_id]["path"] = image_path
                        image_map[image_id]["content_type"] = image_part.content_type
                        
                        # Get image dimensions
                        with Image.open(io.BytesIO(image_part.blob)) as img:
                            image_map[image_id]["width"] = img.width
                            image_map[image_id]["height"] = img.height
                        print(f"Image dimensions - Width: {img.width}, Height: {img.height}")
                except Exception as e:
                    print(f"Error extracting image: {e}")
        else:
            # Simple text paragraph
            content_parts.append({"type": "paragraph", "content": para.text})
            print(f"Added paragraph: {para.text}")
    
    return content_parts, image_map

# Test the function
if __name__ == "__main__":
    docx_path = "path/to/your/document.docx"
    content_parts, image_map = extract_docx_with_image_positions(docx_path)
    print("Content Parts:", content_parts)
    print("Image Map:", image_map)
