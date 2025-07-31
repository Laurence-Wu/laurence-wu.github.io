---
title: "Spoiler Alert: Fridge Website to Alert People About Their Spoiled Food"
description: "A comprehensive web application for smart fridge management with AI-powered recipe generation and food expiration tracking."
pubDate: 2024-01-15
githubLink: https://github.com/Laurence-Wu/spoiler_alert.git
tags: ["React", "Flask", "MySQL","HTTPS", "Web Development", "Full Stack"]
---
# Spoiler Alert: fridge website to alert people about their spoiled food

## My feelings about this project

As a first-year student, I was excited to build my first professional website. This was at a time before AI was as powerful as it is today. I remember contemplating the entire backend architecture with Flask, weighing it against tools like SQLAlchemy, and handling all the manual work involved.

That experience makes me wonder: Is AI truly advancing the journey of a programmer? Will we still feel that same sense of, "I built this from the ground up," after finishing a project? I don't have all the answers, but I feel lucky that I had the chance to experience building a website manually.

## Features

#### 1.1 Smart Fridge Management

- **Visual Fridge Interface**: An Interactive fridge that opens/closes to show contents
- **Food Item Tracking**: Add, view, and manage food items with quantities and expiration dates
- **Expiration Alerts**: Visual warnings for items nearing expiration (within 3-7 days)
- **Freezer Support**: Toggle items between fridge and freezer storage
- **AI-Powered Suggestions**: Automatic category and expiration date suggestions using Google Gemini AI
- **Search & Sort**: Find and organize food items by various attributes

#### 1.2 Recipe Generation

- **AI Recipe Generation**: Generate recipes based on available fridge ingredients using Google Gemini AI
- **Multiple Recipe Options**: Generate up to 3 different recipe suggestions per request
- **Detailed Recipe View**: View complete recipe instructions and ingredient lists

#### 1.3 Shopping List & Wishlist

- **Recipe-Based Shopping**: Create shopping lists from saved recipes
- **Ingredient Comparison**: Compare recipe requirements with current fridge contents
- **Smart Shopping Lists**: Automatically calculate missing ingredients

#### 1.4 User Management

- **User Authentication**: Secure login/signup with password hashing (bcrypt)
- **Multi-User Support**: Each user can have their own fridges and recipes
- **Fridge Sharing**: Support for multiple users accessing shared fridges

### Technology Stack

#### 2.1 Frontend

- **React 18.3.1** - Modern React with hooks and functional components
- **Axios 1.7.7** - HTTP client for API calls
- **Google Generative AI 0.21.0** - Integration with Gemini AI for recipe generation
- **CSS Modules** - Scoped styling

#### 2.2 Backend

- **Flask** - Python web framework
- **PyMySQL** - MySQL database connector
- **bcrypt** - Password hashing
- **Flask-CORS** - Cross-origin resource sharing

### Project Structure

```
spoiler_alert/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── Home/            # Landing page components
│   │   ├── Login/           # Authentication pages
│   │   ├── Signup/          
│   │   ├── Fridge/          # Main fridge management interface
│   │   ├── Recipes/         # Recipe generation and display
│   │   ├── Wishlist/        # Shopping list management
│   │   ├── Navbar/          # Navigation component
│   │   └── Util.js          # Utility functions and mock data
│   └── public/              # Static assets
├── backend/                 # Flask backend API
│   ├── app.py              # Main Flask application
│   ├── get_data.py         # Database read operations
│   ├── add_to_table.py     # Database insert operations
│   ├── remove_from_table.py # Database delete operations
│   ├── update_table.py     # Database update operations
│   └── templates/          # Flask templates (if needed)
└── README.md
```