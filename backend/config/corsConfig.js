const corsOptions = {
    origin: ['http://localhost:3000', 'https://skattchat.online', 'app://skattchat'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = corsOptions;
