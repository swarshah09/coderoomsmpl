import { io } from 'socket.io-client';

let socket;

export const initSocket = async () => {
    if (!socket) {
        const options = {
            'force new connection': true,
            reconnectionAttempts: 'Infinity',
            timeout: 10000,
            transports: ['websocket'],
        };
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        socket = io(BACKEND_URL, options);

        // Handle errors and disconnections
        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });
    }
    return socket;
};

export const emitEvent = (event, data) => {
    if (socket) {
        socket.emit(event, data);
    }
};

export const listenEvent = (event, callback) => {
    if (socket) {
        socket.on(event, callback);
    }
};

export const closeSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

