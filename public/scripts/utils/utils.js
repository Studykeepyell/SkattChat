export async function fetchProfileImage(userId) {
    if (!userId) return '/default-profile.jpg';

    try {
        const response = await fetch(`/api/getUserProfileImage/${userId}`);
        const data = await response.json();
        return data.success ? data.profileImage : '/default-profile.jpg';
    } catch {
        return '/default-profile.jpg';
    }
}

export function formatTimestamp(timestamp) {
    try {
        // Handle both string and number timestamps
        const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(Number(timestamp));
        if (date.toString() === 'Invalid Date') {
            console.warn('Invalid timestamp:', timestamp);
            return 'Invalid Date';
        }
        return date.toLocaleString();
    } catch (error) {
        console.error('Error formatting timestamp:', timestamp, error);
        return 'Invalid Date';
    }
}

export function formatMessageTime(timestamp) {
    try {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(Number(timestamp));
        if (date.toString() === 'Invalid Date') {
            console.warn('Invalid timestamp:', timestamp);
            return 'Invalid Date';
        }
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        console.error('Error formatting message time:', timestamp, error);
        return 'Invalid Date';
    }
}

export function formatMessageDate(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
