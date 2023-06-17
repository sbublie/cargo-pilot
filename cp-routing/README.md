# CP-Routing

The CP-Routing component is a powerful tool for calculating routes, and it is based on openrouteservice. This component allows you to calculate routes using openrouteservice's functionality. Currently, it supports car routes within Germany.

To change the routing data (e.g. use the Europe map) new graphs need to be calculated. Refer to [this guide](https://giscience.github.io/openrouteservice/installation/Advanced-Docker-Setup.html) for more instructions.

## Getting Started

To use CP-Routing and start calculating routes, you need to follow these steps:

    1. Obtain the OpenStreetMap (OSM) file for Germany. You can download it from the OpenStreetMap website or other reliable sources.

    2. Create a directory named maps in the /data directory.

    3. Place the downloaded OSM file for Germany in the /data/maps directory. Ensure that the file has the correct name as stated in the top-level docker compose file.

    4. Start the cp-routing container using the top-level docker compose file:
    ```
    docker compose up -d cp-routing
    ```
    
## Usage 

Please refer to the [openrouteservice API specification](https://openrouteservice.org/dev/#/api-docs) for more information on how to calculate routes.