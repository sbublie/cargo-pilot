# Cargo Pilot Control
## Getting started

## Deploy with Docker Compose

Use the main docker compose file in the project root folder to deploy this application. 
But before you build the image please place the domains SSL certifactes in the `deploy/cert` folder. Refer to the Letsencrypt documentation for more information on how to obtain these certificated.

A command like this can be used to copy the necessary files: 

```
cp /etc/letsencrypt/live/cargo-pilot.de/* ~/cargo-pilot/deploy/cert
```