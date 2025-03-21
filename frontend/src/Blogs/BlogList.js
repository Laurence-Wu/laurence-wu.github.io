import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/BlogList.css';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        console.log("Connected to the database");
        const response = await axios.get('http://127.0.0.1:5000/api/blog_posts');
        console.log('Fetched blogs:', response.data);
        setBlogs(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Could not load blog posts. Please try again later.');
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) return <div className="content-loading">Loading blog posts...</div>;
  if (error) return <div className="content-error">{error}</div>;
  if (!blogs.length) return <div className="content-empty">No blog posts found</div>;

  return (
    <div className="content-section">
      <h1 className="section-title">Blog Posts</h1>
      <div className="article-grid">
        {blogs.map((blog, index) => (
          <Link 
            to={`/blog/${blog.id}`} 
            key={blog.id} 
            className={`article-item ${Date.now() - new Date(blog.pub_date) < 604800000 ? 'article-new' : ''}`}
            style={{"--animation-order": index}}
          >
            <h2 className="article-title">{blog.title}</h2>
            <div className="article-meta">
              <span className="article-author">By {blog.author}</span>
              <span className="article-date">{new Date(blog.pub_date).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BlogList;
