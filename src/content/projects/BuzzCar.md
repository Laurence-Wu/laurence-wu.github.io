---
title: "BuzzRacer V2 Autonomous Car Project"
description: "A custom-designed autonomous vehicle with advanced power management, LiDAR sensing, and compact PCB integration for algorithm development."
pubDate: 2025-07-31
githubLink: https://github.com/Laurence-Wu/BuzzRacer-V2.git
tags: ["Autonomous Vehicles", "Arduino", "LiDAR", "PCB Design", "Power Management", "Embedded Systems"]
---

## My feelings about this project

This is a project that I have always wanted to do, which is to self-design a small car. Thanks to Nick and the lab he's affiliated with, I got the chance to really design such a thing.

## Technical Implementation: How It Works

- **Central Controller**: An **Arduino Nano 33 IoT** serves as the brain of the vehicle, processing sensor data and controlling the actuators.
- **Power Management**: This is a critical feature of the design.
  - The system is powered by a **2s LiPo battery** (6.5V - 8.4V).
  - It includes a crucial **hot-plug management** feature, allowing a wired DC power supply to be connected or disconnected for debugging without interrupting power to the Arduino.
  - Onboard converters step the battery voltage down to a stable 5V to power the various components.
  - The board also integrates **voltage sensing** to monitor battery levels for the control algorithm.
- **Sensors and Actuators**:
  - **Sensing**: Four **Benewake TF-Mini S Lidar** modules are used for environment detection, all communicating over a shared I2C bus.
  - **Driving**: A brushed DC motor is controlled by a **TB67H451FNG motor driver IC**, with traces designed to handle up to 3A of current.
  - **Steering**: A standard hobby servo handles steering, controlled directly by the Arduino.
- **PCB Design**:
  - The board is a **two-layer PCB** with dimensions under 100x100mm to fit the car chassis and manage manufacturing costs.
  - It's designed using primarily **0805 SMT components**, which are small enough for a compact design but large enough to be hand-soldered with a heat gun.

------

## Conclusion

In summary, the BuzzRacer V2 project is a comprehensive engineering task to create a custom, all-in-one solution for a small-scale autonomous car. It combines mechanical design, by conforming to a specific chassis, with complex electronics design. The key technical challenges are the sophisticated **power management system** with hot-plug capability and the efficient **spatial integration** of all necessary components onto a compact, dual-layer PCB. The final result will be a durable and streamlined platform, ideal for developing and testing autonomous driving algorithms.

