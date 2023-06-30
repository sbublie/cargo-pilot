# Cargo Pilot

Cargo Pilot is a full-stack application designed to analyze truck trip data and find potential for load optimisation. This project aims to provide a comprehensive solution for managing and understanding cargo shipments by leveraging data analysis techniques.

## Features
- Data Import: Easily import truck load data from various sources, such as CSV files or the provided API
- Pattern Detection: The application utilizes advanced algorithms to identify patterns in the truck load data.
- Visualization: Visualize the detected patterns via the dashboard

## Components
The project consists of multiple components:

- cp-control: React frontend application served by Node.js
- cp-gateway: Node.js application that controls the access to the database via an API
- cp-analyzer: Python application for performing all necessary calculations like pattern and cluster analysis
- cp-routing: Self-hosted instance of openrouteservice
- cp-db: Postgres SQL database for consistent data storage

## Getting Started
To get started with Cargo Pilot, follow the instructions below:

### Prerequisites

- Docker and Docker Compose must be installed and running on your system.

### Setup

1. Follow instructions in cp-routing folder to obtain the required files for routing
2. Build the Docker images and start all container from the project root folder:
```
docker compose run -d --build
``` 