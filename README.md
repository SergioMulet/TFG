# TFG
This Final Grade Project focuses on the design and development of an Internet of Things (IoT) system for maritime identification and visualization. The main goal is to provide a low-cost, high-performance solution for real time tracking, serving as an accessible alternative to traditional maritime monitoring systems.

This software has three main components:
* Mobile telemetry application: Where the clients will register their boats and let the server track them
* Main Server (core): A robust server-side infrastructure that orchestrates data ingestion from multiple sources (mobile applications), manages persistent storage in a time-series database, and handles the real-time status and geographical distribution of data
* Web visualization dashboard: It allows all users to visualize real time information of all registered vessels on our system through an interactive mapping user interface.
