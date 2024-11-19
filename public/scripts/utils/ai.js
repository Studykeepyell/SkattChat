export async function getAIResponse(message, roomId, username) {
    try {
        const response = await fetch('/api/get-opinion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, roomId, username }),
        });

        const data = await response.json();
        return data.opinion || 'No opinion available.';
    } catch (error) {
        console.error('Error fetching AI opinion:', error);
        return 'Error retrieving opinion.';
    }
}
