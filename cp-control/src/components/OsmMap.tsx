import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import "leaflet/dist/leaflet.css"
import "./osm_style.css"
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [10, 41],
    popupAnchor: [2, -40],
});

L.Marker.prototype.options.icon = DefaultIcon;

function OsmMap() {
    
    var latlngs: [number, number][] = [
        [49, 8],
        [49, 7],
        [34.04, -118.2]
    ];


    return (
    <div>
        <MapContainer center={[47.66556827380604, 9.44608097446138]} zoom={16} scrollWheelZoom={true}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[47.66556827380604, 9.44608097446138]}>
            <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
            </Popup>
        </Marker>
        <Polyline positions={latlngs}></Polyline>
        </MapContainer>
    </div>
    )
}

export default OsmMap;

