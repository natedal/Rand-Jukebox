'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { motion } from 'framer-motion';

interface Device {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

export function DeviceSelector() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
    fetchSelectedDevice();
  }, []);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminApi.getDevices();
      setDevices(response.data.devices || []);
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      setError(error.response?.data?.error || 'Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSelectedDevice = async () => {
    try {
      // Get selected device from admin status
      const response = await adminApi.getStatus();
      if (response.data.selected_device_id) {
        setSelectedDevice(response.data.selected_device_id);
      } else {
        // If no device is selected, use the first active device
        const devicesResponse = await adminApi.getDevices();
        const activeDevice = devicesResponse.data.devices?.find((d: Device) => d.is_active);
        if (activeDevice) {
          setSelectedDevice(activeDevice.id);
        }
      }
    } catch (error) {
      // Ignore - not critical
    }
  };

  const handleSelectDevice = async (deviceId: string) => {
    try {
      await adminApi.selectDevice(deviceId);
      setSelectedDevice(deviceId);
      setError(null);
    } catch (error: any) {
      console.error('Error selecting device:', error);
      setError(error.response?.data?.error || 'Failed to select device');
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Spotify Device</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchDevices}
          className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </motion.button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4 text-gray-400">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full mx-auto"
          />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="font-medium mb-1">No devices found</p>
          <p className="text-sm">
            Open Spotify on a device (desktop, web, or phone) and refresh.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((device) => (
            <motion.button
              key={device.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectDevice(device.id)}
              className={`w-full p-3 rounded-xl text-left transition-all ${
                selectedDevice === device.id || device.is_active
                  ? 'bg-gold-500/20 border border-gold-500/30'
                  : 'bg-midnight-700/50 hover:bg-midnight-700 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-white truncate">{device.name}</div>
                    {device.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs flex-shrink-0">
                        Active
                      </span>
                    )}
                    {selectedDevice === device.id && !device.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex-shrink-0">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {device.type.charAt(0).toUpperCase() + device.type.slice(1)} • {device.volume_percent}% volume
                  </div>
                </div>
                {selectedDevice === device.id && (
                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

