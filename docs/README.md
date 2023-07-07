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

<div hidden>
```
@startuml highlevel_components

skinparam linetype polyline
skinparam linetype ortho

node "Docker Compose ZDM Server" {
    frame "CP-Control" {
        component [     CP-Control Server    ] as control1 <<Node.js>>
        component [CP-Control Frontend] as control2 <<React>>
    }

    component [CP-Routing] as routing <<Openrouteservice>>
    component [CP-Analyzer] as analyzer <<Python App>>
    component [CP-Gateway] as gateway <<Node.js>>
    database "SQL Database" {
        component [CP-DB] as db <<Postgres>>
    }

    note right of gateway
        Database abstraction via API
    end note

    note right of analyzer
        Data aggregation
        Pattern analysis
        Cluster analysis
    end note

    note left of control1
        Internet-facing gateway
    end note
}

component [CP-Uploader] as uploader <<Python App>>

interface "Freight Market" as market
interface "File (.csv, .geojson, .xslx)" as file
interface "API" as api


control1 <-> control2
uploader --> control1
control1 <--> routing
control1 ---> analyzer
control1 <--> gateway
analyzer <--> gateway
gateway <--> db
market <--> analyzer
file --> uploader
api --> control1

note left of uploader
    File input handling and uploading
    from local machines.
end note


note right of control2
    Frontend dashboard
end note


@enduml

```
</div>

![](highlevel_components.svg)