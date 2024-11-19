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
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatMessageDate(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
