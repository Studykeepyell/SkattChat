const axios = require('axios');
const Message = require('../models/Message');

exports.getOpinion = async (req, res) => {
    const { message, roomId, username } = req.body;

    if (!message || !roomId || !username) {
        return res.status(400).json({ error: 'Required fields missing.' });
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: `Opinion on this message: "${message}"` }],
            },
            { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
        );

        const opinion = response.data.choices[0].message.content;

        // Save the response as a message
        await Message.create({
            username: 'AttyAI',
            message: opinion,
            timestamp: new Date(),
            room: roomId,
        });

        res.json({ opinion });
    } catch (error) {
        console.error('Error fetching opinion from ChatGPT:', error);
        res.status(500).json({ error: 'Error fetching opinion from ChatGPT' });
    }
};
