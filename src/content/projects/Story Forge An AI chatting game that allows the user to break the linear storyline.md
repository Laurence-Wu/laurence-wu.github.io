---
title: "Story Forge: AI-Powered Nonlinear Narrative Game"
description: "A full-stack AI-driven text adventure game engine that lets players break the linear storyline and co-create unique stories."
pubDate: 2025-07-31
githubLink: http://115.29.205.103/
tags: ["AI", "Game Engine", "React", "TypeScript", "WebSockets", "Prompt Engineering", "Full Stack"]
---


*(sorry this is not an open source project)*

## My feelings to this project

This is a project that, when I first heard its idea,  a thought just hits me: Fuck everything and I'm gonna make this project happen. It felt like the project I was always meant to work on—one that connected a deep fascination with philosophy to the art of creating for the web. During that hackathon, our team built it within 3 days and got the first price in software development track.

## Project Overview

> A revolutionary text adventure game engine that breaks the boundaries between player agency and narrative coherence

At its heart, Story Forge was born from a simple but powerful idea: what if a story wasn't just something you followed, but something you helped create meaning for? We looked at traditional games and saw beautiful, handcrafted tales, but they were almost **always on rails**. You follow the path, maybe choose a branch here or there, but the destination and its meaning are already set for you. **We wanted to break free from that. We imagined a game where the player's journey could give a story its soul.**

> Think of it like a single word. On its own, a word is just a word. But when you place it in a sentence, surrounded by a story you've built yourself, its meaning transforms. That’s what we want you to feel. By interacting with the world and its AI-driven characters, you build your own unique path, your own personal context. So when you finally reach that shared ending, it feels different for you than it would for anyone else, because the journey that brought you there was yours and yours alone. It’s an incredibly personal experience, and for now, we're excited to be sharing it with our players in Chinese.

Play the game : StoryForge http://115.29.205.103/

## Technical Details

The project is a full-stack application with a sophisticated architecture designed to handle real-time, AI-driven narrative generation.

- **Architecture & Tech Stack:**
  - **Frontend:** Built with **React** using **TypeScript**, which was chosen for its strong typing and structural benefits. It includes a separate visual component for rendering the story's dependency tree.
  - **Backend:** The core of the backend is a **dependency tree** that manages narrative logic and prerequisites for events. It uses **JSON** and **YML** files for configuration and data exchange.
  - **Communication Protocol:** The project uses **WebSockets** for real-time, bidirectional communication between the client and server. This was chosen over a standard HTTP API because its streaming nature perfectly matches the dynamic, continuous flow of the storytelling engine.
  - **AI Integration:** The system uses **OpenRouter** to access large language models like **Gemini**. A critical backend component is a custom **prompt engine** designed to force the AI to generate responses in a structured **JSON** format that the dependency tree can parse.
  - **Deployment:** The application is containerized using **Docker** and deployed on **Chinese hosting services** to cater to the target market and avoid issues with the Great Firewall of China.
- **Key Technical Challenges and Learnings:**
  - **Session Management:** Managing **session IDs** in a WebSocket environment was a major challenge. It is crucial for separating the data of different users (and even different game instances from the same user) to prevent narrative overlap. Improper handling could lead to bugs and security vulnerabilities.
  - **AI as a Bottleneck:** The speed of the third-party AI API was the primary performance bottleneck. This was mitigated by implementing **lazy loading** and **streaming** responses to the frontend.
  - **Prompt Engineering:** The team learned that effective **prompt engineering** is a vital and often underestimated skill. Crafting precise prompts was necessary to ensure the AI returned reliable, correctly formatted JSON data for the dependency tree.
  - **Development Strategy:** The team adopted a **decoupling** strategy, building and testing complex features (like the tree renderer) in an isolated environment before integrating them into the main project. They also learned the value of setting up a simple frontend-backend connection test before starting full development.
  - **State and Code Management:** Proper frontend architecture was essential. This included carefully indexing components, separating CSS and TSX files, implementing robust **error handlers** for key functions, and managing distinct application states (e.g., `game_start`, `narrative_output`, `special_choice`).

## Architecture

### Backend Components
```
StoryForge/
├── engine.py              # Core game engine
├── socket_server.py       # WebSocket server
├── agents/                # AI agent implementations
│   ├── arbiter.py         # Decision validation
│   ├── narrator.py        # Story generation
│   └── reality_agent.py   # Reality reconstruction
├── models/                # Data models
│   ├── story.py           # Story structures
│   ├── context.py         # Game context
│   └── agents.py          # Agent interfaces
├── utils/                 # Utilities
│   ├── llm_service.py     # LLM integration
│   ├── save_manager.py    # Save system
│   └── command_handler.py # Command processing
└── data/story/            # Story definitions
    └── [story-name]/
        ├── world_definition.yaml
        ├── condition_tree.yaml
        └── images/
```

### Frontend Components
```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── Stage.tsx      # Main game display
│   │   ├── Console.tsx    # Command interface
│   │   ├── EventTree.tsx  # Decision history
│   │   └── UserActions.tsx # Action buttons
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   └── types/             # TypeScript definitions
├── public/                # Static assets
└── dist/                  # Built application
```

### Data Flow
```
Player Input → Socket.IO → Engine → AI Agents → Story Generation → Frontend Update
     ↑                                    ↓
Save System ← Delta Storage ← Game State ← Reality Validation
```

## Configuration

### Story Creation
Create new stories by adding directories to `data/story/`:

**world_definition.yaml**
```yaml
world_definition:
  story_name: "Your Story Title"
  core_concept: "Central theme or question"
  ontological_layers:
    surface_narrative:
      official_story: "What appears to happen"
      rules: ["Surface world rules"]
    underlying_structure:
      hidden_truth: "Deeper reality"
      rules: ["Hidden mechanics"]
  protagonist_intent: "Player's initial goal"
  endings:
    good_ending: "Positive resolution"
    bad_ending: "Negative outcome"
```

**condition_tree.yaml**

```yaml
tree_id: "your_story"
root_conditions: ["start"]
terminal_conditions: ["ending"]
nodes:
  - node_id: "start"
    symbolic_goal: "Begin the adventure"
    default_interpretation: "You find yourself..."
    dependencies: []
```
