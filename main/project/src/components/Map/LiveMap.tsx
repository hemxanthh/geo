// src/components/Map/LiveMap.tsx

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../../contexts/SocketContext';
import { VehicleStatus } from '../../types';

const LiveMap: React.FC = () => {
  const { vehicleStatus } = useSocket();
  const [mockVehicle, setMockVehicle] = useState<VehicleStatus | null>(null);

  const currentVehicle = Object.values(vehicleStatus)[0] || mockVehicle;

  // Default map icon fix
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });

  // For fallback: keep showing last known vehicle location
  useEffect(() => {
    if (currentVehicle) {
      setMockVehicle(currentVehicle);
    }
  }, [currentVehicle]);

  if (!currentVehicle?.location) {
    return <div className="text-center text-gray-500">No vehicle data available</div>;
  }

  return (
    <div className="w-full h-[500px] rounded-lg shadow-md border border-gray-300 overflow-hidden">
      <MapContainer
        center={[currentVehicle.location.latitude, currentVehicle.location.longitude]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[currentVehicle.location.latitude, currentVehicle.location.longitude]}>
          <Popup>
            Vehicle ID: <b>{currentVehicle.vehicleId}</b><br />
            Speed: {currentVehicle.location.speed?.toFixed(1)} km/h<br />
            Heading: {currentVehicle.location.heading?.toFixed(0)}°<br />
            Last update: {new Date(currentVehicle.lastUpdate).toLocaleTimeString()}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LiveMap;
