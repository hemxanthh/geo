// project/src/components/Dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Car, MapPin, Clock, AlertTriangle, Battery, Signal, Power } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { useSocket } from '../../contexts/SocketContext';
import { DashboardStats } from '../../types';
import { clsx } from 'clsx';

const Dashboard: React.FC = () => {
  const { vehicleStatus, alerts, connected } = useSocket();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    activeVehicles: 0,
    totalTrips: 0,
    totalDistance: 0,
    unreadAlerts: 0,
    avgSpeed: 0,
  });

  const currentVehicle = Object.values(vehicleStatus)[0];

  useEffect(() => {
    const vehicles = Object.values(vehicleStatus);
    const activeVehicles = vehicles.filter(v => v.isMoving || v.ignitionOn).length;
    const unreadAlerts = alerts.filter(a => !a.isRead).length;
    const avgSpeed = vehicles.reduce((sum, v) => sum + (v.location.speed || 0), 0) / vehicles.length || 0;

    setStats({
      totalVehicles: vehicles.length,
      activeVehicles,
      totalTrips: 247,
      totalDistance: 15420,
      unreadAlerts,
      avgSpeed: Math.round(avgSpeed),
    });
  }, [vehicleStatus, alerts]);

  // --- NEW FUNCTION TO TOGGLE IGNITION ---
  const handleToggleIgnition = async () => {
    try {
      const response = await fetch('http://localhost:3001/toggle-ignition', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to toggle ignition');
      }
      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error("Error toggling ignition:", error);
    }
  };
  // ------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your fleet and security status</p>
        </div>
        <div className="flex items-center mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">
              {connected ? 'System Online' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total Vehicles" value={stats.totalVehicles} icon={Car} color="blue" subtitle="Registered in system" />
        <DashboardCard title="Active Now" value={stats.activeVehicles} icon={MapPin} color="green" subtitle="Currently moving" />
        <DashboardCard title="Total Trips" value={stats.totalTrips} icon={Clock} color="purple" subtitle="This month" trend={{ value: 12, isPositive: true }} />
        <DashboardCard title="Unread Alerts" value={stats.unreadAlerts} icon={AlertTriangle} color={stats.unreadAlerts > 0 ? 'red' : 'yellow'} subtitle="Requires attention" />
      </div>

      {/* Vehicle Status & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Status</h2>
          {currentVehicle ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Car className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Primary Vehicle</h3>
                    <p className="text-sm text-gray-500">Last update: {new Date(currentVehicle.lastUpdate).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className={clsx(`px-3 py-1 rounded-full text-sm font-medium`, currentVehicle.ignitionOn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                  {currentVehicle.ignitionOn ? 'Engine ON' : 'Engine OFF'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg"><Battery className="w-5 h-5 text-blue-600 mx-auto mb-1" /><div className="text-sm text-gray-600">Battery</div><div className="font-semibold text-blue-600">{currentVehicle.batteryLevel}%</div></div>
                <div className="text-center p-3 bg-green-50 rounded-lg"><Signal className="w-5 h-5 text-green-600 mx-auto mb-1" /><div className="text-sm text-gray-600">GPS Signal</div><div className="font-semibold text-green-600">{currentVehicle.gpsSignal}%</div></div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-center space-x-2 mb-2"><MapPin className="w-5 h-5 text-yellow-600" /><span className="font-medium text-yellow-800">Current Location</span></div>
                <p className="text-sm text-yellow-700">{currentVehicle.location.latitude.toFixed(6)}, {currentVehicle.location.longitude.toFixed(6)}</p>
                <p className="text-sm text-yellow-700 mt-1">Speed: {Math.round(currentVehicle.location.speed || 0)} km/h</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500"><Car className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No vehicle data available</p></div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-orange-500' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                <div className="flex-1"><p className="text-sm font-medium text-gray-900">{alert.message}</p><p className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleDateString()} at {new Date(alert.timestamp).toLocaleTimeString()}</p></div>
                {!alert.isRead && (<div className="w-2 h-2 bg-blue-500 rounded-full"></div>)}
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8 text-gray-500"><AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No alerts at this time</p><p className="text-sm">Your vehicles are secure</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* --- NEW BUTTON TO TOGGLE IGNITION --- */}
          <button onClick={handleToggleIgnition} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Power className={clsx("w-5 h-5", currentVehicle?.ignitionOn ? "text-green-600" : "text-red-600")} />
            <span className="font-medium text-gray-900">
              {currentVehicle?.ignitionOn ? "Turn Ignition OFF (Park)" : "Turn Ignition ON"}
            </span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">View Live Map</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900">Trip History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;