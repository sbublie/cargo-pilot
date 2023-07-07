# Introduction

Cargo Pilot is a full-stack application designed to analyze truck trip data and find potential for load optimisation. The project aims to provide a comprehensive solution for managing and understanding cargo shipments by leveraging data analysis techniques.

### Features

* Data Import: Easily import truck load data from various sources, such as CSV files or the provided API
* Pattern Detection: The application utilizes advanced algorithms to identify patterns in the truck load data.
* Visualization: Visualize the detected patterns via the dashboard

### Components

The project consists of multiple components:

* **cp-control**: React frontend application served by Node.js
* **cp-gateway**: Node.js application that controls the access to the database via an API
* **cp-analyzer**: Python application for performing all necessary calculations like pattern and cluster analysis
* **cp-routing**: Self-hosted instance of openrouteservice
* **cp-db**: Postgres SQL database for consistent data storage

![](highlevel_components.svg)