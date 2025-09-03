---
title: "Personal Website: Custom Astro Blog & Interactive Art Canvas"
description: "A fully custom, open-source personal website and blog built with Astro, featuring an interactive Impressionist art canvas and a real-time Markdown-to-MDX engine."
pubDate: 2024-07-31
githubLink: https://github.com/Laurence-Wu/laurence-wu.github.io.git
tags: ["Astro", "TypeScript", "React", "Canvas", "Open Source", "Frontend"]
---

This is my custom-built personal website. I created it because I was really frustrated with the limitations of my old site, which used a Hexo theme. I wanted more creative freedom and an easier way to customize things, so I decided to build a new site from scratch using the Astro framework. This site is now my personal blog, but it's also a showcase for some of my technical and artistic ideas, especially the interactive homepage and a custom content-processing engine I built.

#### Why I Built This and What It Does

The main reason I built this was that I just couldn't stand the tech on my old site anymore. It was built with a Hexo theme that used **Stylus**, a CSS preprocessor, and JS without a clean architecture. The whole structure was confusing, and the deployment process basically locked me in, killing any real freedom to change things.

To fix this, I built a new site that does two main things:

1. **It's My Personal Blog:** I wanted a place to host articles where I could easily show complex technical info, like mathematical formulas using LATEX and diagrams using Mermaid.js, without any hassle.
2. **It's an Interactive Art Canvas:** This is the part I'm really excited about. I'm a huge fan of **Impressionism and Neo-Impressionism** (like Van Gogh), so I made the homepage a huge canvas where you can draw. As you draw, your input is transformed in real-time into an artistic, Impressionist-style rendering. My goal was to build an algorithm that could let anyone create this style of art easily, while still running smoothly.

#### The Technical Details

Let's get into the technical side of things. I kept it simple by making it a frontend-only application hosted on **GitHub Pages**. This meant I didn't have to worry about a backend and could just focus on the user interface.

- **Framework:** I built the site with **Astro**. I chose it because it's really popular for blogs and has great integrations for all the tools I wanted to use, like TypeScript, React, and those Mermaid graphs and math formulas.
- **Interactive Canvas:** The drawing feature was a fun challenge. To get that smooth, fluid animation, I realized I had to focus on calculating particle **velocities** instead of just their positions. I used derivatives and randomly split angles to create the final artwork, and spent a good amount of time optimizing it for performance.
- **My Custom Markdown to MDX Engine:** One of the biggest pieces of this project was a custom engine I built to automatically convert my standard Markdown (`.md`) files into MDX (`.mdx`). Honestly, manually adding all the JavaScript imports and tags just to show a graph or a formula in MDX is a huge pain. So, I built this engine to handle it for me. It uses **regular expressions** to parse the content—which took a lot of time and tuning to get right. It works in **real-time**, so whenever I save a file, it automatically regenerates the MDX, just like the hot-reloading you see in modern frameworks.
- **Animations and Search:** You'll probably notice I added a lot of **CSS animations**—I just really like how they make a site feel alive. I know it might be a bit heavy on older computers since all the rendering happens on your machine, not a server. For the search feature, I just used a pre-existing `npm` package that works really well.



#### Project Summary

So, to sum it all up, this website is my personal platform, built from the ground up with Astro because my old site was just too limiting. The parts I'm most proud of are the Impressionist drawing canvas on the homepage and the custom Markdown-to-MDX engine that makes writing posts so much easier. The whole project is entirely frontend-based, heavily animated, and **open-source**. Feel free to check out the code—if you have ideas or want to contribute, I'd be more than happy to hear from you! It represents a huge personal effort to blend the artistic things I love with some really challenging technical work.
