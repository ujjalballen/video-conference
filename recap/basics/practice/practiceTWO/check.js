const room = await getOrCreateRoom('test-voice-room');
console.log('Router codecs:', room.router.rtpCapabilities.codecs.map(c => c.mimeType));