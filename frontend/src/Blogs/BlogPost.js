import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/BlogPost.css';

const BlogPost = () => {
  const { postId } = useParams();
  const [blogData, setBlogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://127.0.0.1:5000/api/blog/${postId}`);
        setBlogData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Could not load blog post. Please try again later.');
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [postId]);

  if (loading) return <div className="blog-loading">Loading blog post...</div>;
  if (error) return <div className="blog-error">{error}</div>;
  if (!blogData) return <div className="blog-not-found">Blog post not found</div>;

  return (
    <div className="blog-post-container">
      <header className="blog-header">
        <h1 className="blog-title">{blogData.title}</h1>
        <div className="blog-meta">
          <span className="blog-author">By {blogData.author}</span>
          <span className="blog-date">Published: {new Date(blogData.pub_date).toLocaleDateString()}</span>
          {blogData.last_modified && (
            <span className="blog-modified">
              Last updated: {new Date(blogData.last_modified).toLocaleDateString()}
            </span>
          )}
        </div>
      </header>

      <div className="blog-content">
        {blogData.content_blocks.map((block, index) => (
          <BlogContentBlock key={index} block={block} />
        ))}
      </div>
    </div>
  );
};

// Component to render different types of content blocks
const BlogContentBlock = ({ block }) => {
  switch (block.type) {
    case 'paragraph':
      return <p className="blog-paragraph">{block.content}</p>;
      
    case 'heading':
      return <h2 className="blog-heading">{block.content}</h2>;
      
    case 'image':
      if (block.image_data) {
        return (
          <figure className="blog-image-container">
            <img
              src={block.image_data}
              alt={block.image_name || 'Blog image'}
              style={{
                maxWidth: '100%',
                width: block.width ? `${block.width}px` : 'auto',
                height: block.height ? `${block.height}px` : 'auto'
              }}
              className="blog-image"
            />
            {block.image_name && (
              <figcaption className="blog-image-caption">
                {block.image_name.replace(/^img_[a-f0-9]+\.(jpg|png|jpeg|gif)$/i, '')}
              </figcaption>
            )}
          </figure>
        );
      }
      return <div className="blog-image-placeholder">Image not available</div>;
      
    default:
      return <div className="blog-unknown-block">Unknown content type: {block.type}</div>;
  }
};

export default BlogPost;
