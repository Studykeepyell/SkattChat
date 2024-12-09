module.exports = {
  origin: [
    'http://localhost:3000',
    'https://skattchat.online',
    'app://.',
    'app://skattchat'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};
