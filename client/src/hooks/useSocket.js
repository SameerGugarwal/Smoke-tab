import { useEffect } from 'react';
import { getSocket } from '../lib/socket';

export default function useSocket(event, handler, deps = []) {
  useEffect(() => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => socket.off(event, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, handler, ...deps]);
}
