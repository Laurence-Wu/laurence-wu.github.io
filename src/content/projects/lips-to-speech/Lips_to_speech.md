---
title: "Lip-to-Speech Communication Device"
description: "An assistive technology device that converts lip movements to speech using computer vision, AI models, and vibration feedback."
pubDate: 2025-07-31
githubLink: https://github.com/Laurence-Wu/LipToSpeech.git
tags: ["Assistive Technology", "Computer Vision", "AI/ML", "ESP32", "Speech Synthesis", "Accessibility", "research"]
thumbnail: "https://picsum.photos/seed/lips-to-speech/400/300"
---

## Technical Implementation: 

The project uses a distributed system where the PCB handles data capture and a laptop performs the heavy computational tasks.

- **Hardware and Power Design**:
  - **Power Source**: The device is powered by two LiPo batteries in series, providing **7.4V**.
  - **Voltage Regulation**: A clever two-stage power system is used. First, an efficient **buck converter** steps the voltage down to 5V. Then, a **Low-Dropout (LDO) regulator** provides a very stable 3.3V output to power the sensitive main processor (ESP32-S3) and the camera. This design combines the high efficiency of a buck converter with the clean, stable power of an LDO, which is critical for the processor's performance.
  - **Core Components**: The PCB is built around an **ESP32-S3 microcontroller** and an **OV5640 camera module**.
- **Data Processing and Workflow**:
  1. The **OV5640 camera** captures images of the user's lips.
  2. The **ESP32-S3** processor takes these images and uses its built-in Wi-Fi to stream the data to a connected laptop.
  3. All the intensive AI processing happens on the **laptop**:
     - An open-source **lip-to-text model** analyzes the video stream and generates text.
     - An open-source **text-to-speech model** converts that text into an audio signal.
  4. The final audio signal is sent back to the ESP32-S3.
  5. The ESP32-S3 outputs this as a **vibration signal** through a connected sound module.