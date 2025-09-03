---
title: "Rocket Flight Computer System"
description: "A sophisticated flight computer for rockets featuring STM32MP1 processor, multi-level memory hierarchy, and comprehensive sensor integration."
pubDate: 2025-07-31
githubLink: https://github.com/Laurence-Wu/RocketFlightComputer.git
tags: ["Aerospace", "STM32", "Flight Control", "Embedded Systems", "Sensors", "Real-time Systems"]
---

## Technical Implementation: How It Works

The system is built around a powerful microprocessor and uses a sophisticated architecture for power, memory, and communication.

- **Power System**:
  - It starts with a **14.8V LiPo battery**.
  - The Power Board uses two-phase buck converters to efficiently step this down to **7.4V and 5V**.
  - The 5V rail powers the Flight Computer, which uses a **PMIC** (Power Management IC) to generate a stable **3.3V** for sensitive components like sensors and memory chips.
- **Processing and Memory**:
  - **Processor**: The brain of the flight computer is a powerful **STM32MP157 series** microprocessor.
  - **Memory Hierarchy**: A multi-level memory system is used to balance speed and cost:
    - **DDR RAM**: For fast, volatile memory access.
    - **NOR Flash**: For fast booting of the system.
    - **NAND Flash / SD Card**: For cheaper, high-capacity, non-volatile data storage.
- **Sensors and Communication**:
  - **Sensors**: The board integrates a **GPS**, **IMU** (Inertial Measurement Unit), and a **barometer** to track the rocket's position, orientation, and altitude.
  - **Communication Protocols**: Different protocols are used for specific tasks to optimize performance:
    - **I2C**: For communicating with the sensors.
    - **SPI**: For high-speed communication with the NOR flash.
    - **SDIO**: For communicating with the SD card.
    - **CAN bus**: For robust communication between the Flight Computer and the Telemetry board.