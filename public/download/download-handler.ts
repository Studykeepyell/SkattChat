class DownloadHandler {
    private baseUrl: string;
    private downloadEndpoint: string;

    constructor() {
        this.baseUrl = window.location.origin;
        this.downloadEndpoint = '/api/downloads';
    }

    async downloadApp(platform: string) {
        try {
            const response = await fetch(`${this.downloadEndpoint}/latest/${platform}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/octet-stream'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Create blob with proper type
            const blob = await response.blob();
            const filename = this.getFilenameFromResponse(response) || 'SkattChat-x64-Setup.exe';
            
            // Create and click download link
            const url = window.URL.createObjectURL(new Blob([blob], { 
                type: 'application/octet-stream' 
            }));
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup after short delay to ensure download starts
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
        } catch (error) {
            console.error('Download error:', error);
            alert('Download failed. Please try again later.');
        }
    }

    getFilenameFromResponse(response: any) {
        const disposition = response.headers.get('content-disposition');
        if (disposition && disposition.includes('filename=')) {
            return disposition.split('filename=')[1].replace(/"/g, '');
        }
        return null;
    }
    
}

export default DownloadHandler;