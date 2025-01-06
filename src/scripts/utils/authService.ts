// authService.js

async function fetchWithToken(url: string, options: RequestInit = {}) {
    let token = localStorage.getItem('authToken') || '';
    const refreshToken = localStorage.getItem('refreshToken') || '';

    // Attempt the request with the current access token
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });

    // Handle expired tokens
    if (response.status === 401 && refreshToken) {
        const refreshResponse = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            token = data.accessToken;
            localStorage.setItem('authToken', token);

            // Retry the original request with the new token
            return fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                },
            });
        }
    }

    return response;
}

export default fetchWithToken;
