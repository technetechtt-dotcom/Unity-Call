export async function getIceServers() {
  const response = await fetch('/api/ice');
  const data = await response.json();
  return data.iceServers as RTCIceServer[];
}

export async function createPeerConnection(onTrack: (stream: MediaStream) => void) {
  const iceServers = await getIceServers();
  const pc = new RTCPeerConnection({ iceServers });
  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) onTrack(stream);
  };
  return pc;
}

export function setTrackEnabled(stream: MediaStream | null, kind: 'audio' | 'video', enabled: boolean) {
  stream?.getTracks().filter((track) => track.kind === kind).forEach((track) => {
    track.enabled = enabled;
  });
}

export async function getConnectionStats(pc: RTCPeerConnection | null) {
  if (!pc) return { quality: 'unknown', bytes: 0 };
  const stats = await pc.getStats();
  let bytes = 0;
  let rtt = 0;
  stats.forEach((report) => {
    if ('bytesReceived' in report) bytes += Number(report.bytesReceived || 0);
    if ('bytesSent' in report) bytes += Number(report.bytesSent || 0);
    if ('currentRoundTripTime' in report) rtt = Number(report.currentRoundTripTime || 0);
  });
  const quality = rtt > 0.4 ? 'poor' : rtt > 0.2 ? 'fair' : 'good';
  return { quality, bytes, rtt };
}
