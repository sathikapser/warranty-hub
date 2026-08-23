import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, userInfo }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveToasts, setLiveToasts] = useState([]);
  const [latestActivity, setLatestActivity] = useState(null);

  // Toast auto-dismiss helper
  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { ...toast, id };
    setLiveToasts(prev => [newToast, ...prev.slice(0, 4)]); // max 5 toasts

    setTimeout(() => {
      setLiveToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const removeToast = (id) => {
    setLiveToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (!userInfo || !userInfo._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketServerUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Connected to server, ID:', newSocket.id);
      setIsConnected(true);

      // Join user room
      newSocket.emit('join_user', userInfo._id);

      // Join workspace room
      const workspaceId = userInfo.familyWorkspaceOwnerId || userInfo._id;
      newSocket.emit('join_workspace', workspaceId);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from server');
      setIsConnected(false);
    });

    // 1. Notification Event
    newSocket.on('notification_new', (data) => {
      addToast({
        type: 'notification',
        title: data.notification?.title || 'New Notification',
        message: data.notification?.message || 'Action required on your asset',
        urgency: data.urgency || 'medium'
      });
    });

    // 2. Warranty Alert
    newSocket.on('warranty_alert', (data) => {
      addToast({
        type: 'warranty',
        title: data.title || 'Warranty Event',
        message: data.message,
        urgency: data.urgency || 'urgent'
      });
    });

    // 3. Asset Created by Workspace Member
    newSocket.on('asset_created', (data) => {
      addToast({
        type: 'asset',
        title: 'New Asset Added',
        message: `${data.createdBy || 'Family Member'} added ${data.asset?.brand} ${data.asset?.assetName}`,
        urgency: 'low'
      });
    });

    // 4. Service Request Created
    newSocket.on('service_request_created', (data) => {
      addToast({
        type: 'service',
        title: 'Service Request Lodged',
        message: `Ticket #${data.requestNumber} for ${data.assetId?.assetName || 'Asset'}`,
        urgency: 'medium'
      });
    });

    // 5. Service Status Progressed
    newSocket.on('service_status_changed', (data) => {
      addToast({
        type: 'service',
        title: 'Service Status Changed',
        message: `${data.serviceRequest?.assetId?.assetName || 'Asset'}: Stage updated to ${data.newStatus?.toUpperCase().replace(/_/g, ' ')}`,
        urgency: 'high'
      });
    });

    // 6. Live Activity Stream Broadcast
    newSocket.on('activity_new', (activity) => {
      setLatestActivity(activity);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userInfo?._id, userInfo?.familyWorkspaceOwnerId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, liveToasts, addToast, removeToast, latestActivity }}>
      {children}

      {/* Floating Toast Notification Container */}
      {liveToasts.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '380px',
          pointerEvents: 'none'
        }}>
          {liveToasts.map(toast => {
            const isUrgent = toast.urgency === 'urgent';
            const isHigh = toast.urgency === 'high';
            const borderColor = isUrgent ? '#ef4444' : isHigh ? '#f59e0b' : '#00f2fe';
            const icon = isUrgent ? '🔴' : isHigh ? '⚠️' : toast.type === 'service' ? '🛠️' : '🔔';

            return (
              <div
                key={toast.id}
                style={{
                  pointerEvents: 'auto',
                  background: 'rgba(11, 17, 32, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '14px',
                  padding: '14px 18px',
                  boxShadow: `0 8px 30px rgba(0, 0, 0, 0.6), 0 0 15px ${isUrgent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 242, 254, 0.2)'}`,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isUrgent ? '#f87171' : '#f3f4f6', marginBottom: '2px' }}>
                    {toast.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    {toast.message}
                  </div>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    lineHeight: 1,
                    padding: '2px'
                  }}
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
