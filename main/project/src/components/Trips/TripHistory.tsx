import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Navigation, RefreshCw, MapPin, ChevronsUp, Gauge } from 'lucide-react';
import { Trip } from '../../types';
import { clsx } from 'clsx';

const TripHistory: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/trips');
      if (!response.ok) throw new Error('Failed to fetch trip data');
      const data = await response.json();
      setTrips(data);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip History</h1>
          <p className="text-gray-600 mt-1">Detailed logs of all completed journeys.</p>
        </div>
        <button
          onClick={fetchTrips}
          disabled={isLoading}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-gray-500">Loading trip history...</div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800">No Trips Recorded</h3>
          <p className="text-gray-500 mt-2">Go to the dashboard and toggle the ignition to start and end a new trip.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const startTime = new Date(trip.startTime);
            const endTime = new Date(trip.endTime);

            // Safely access properties with default values
            const distance = trip.distance || 0;
            const duration = trip.duration || 0;
            const maxSpeed = trip.maxSpeed || 0;
            const avgSpeed = trip.avgSpeed || 0;
            const startLat = trip.startLat || 0;
            const startLon = trip.startLon || 0;
            const endLat = trip.endLat || 0;
            const endLon = trip.endLon || 0;

            return (
              <div key={trip.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b bg-gray-50">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600"/>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">{startTime.toLocaleDateString()}</p>
                            <p className="text-sm text-gray-500">{startTime.toLocaleTimeString()} - {endTime.toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <TripDetail icon={Navigation} label="Distance" value={`${distance.toFixed(2)} km`} />
                    <TripDetail icon={Clock} label="Duration" value={`${duration} min`} />
                    <TripDetail icon={ChevronsUp} label="Max Speed" value={`${maxSpeed} km/h`} />
                    <TripDetail icon={Gauge} label="Avg Speed" value={`${avgSpeed} km/h`} />
                </div>
                 <div className="p-5 border-t bg-gray-50 space-y-3">
                    <LocationDetail label="Start" lat={startLat} lon={startLon} />
                    <LocationDetail label="End" lat={endLat} lon={endLon} />
                 </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TripDetail = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);

const LocationDetail = ({ label, lat, lon }: { label: string, lat: number, lon: number }) => (
    <div className="flex items-start space-x-3 text-sm">
        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
            <span className="font-medium text-gray-800">{label}:</span>
            <span className="text-gray-600 ml-2">{lat.toFixed(5)}, {lon.toFixed(5)}</span>
        </div>
    </div>
);

export default TripHistory;