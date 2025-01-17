document.addEventListener('DOMContentLoaded', function() {
    const downloadButtons = document.querySelectorAll<HTMLAnchorElement>('.download-btn');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const platform = this.getAttribute('data-platform');
            if (platform) {
                if (platform === 'windows') {
                    this.href = '/downloads/SkattChat Setup 1.0.0.exe';
                    this.download = 'SkattChat Setup 1.0.0.exe';
                } else {
                    e.preventDefault();
                    alert(`Downloads for ${platform} are coming soon!`);
                }
            } else {
                console.error('Platform not specified');
            }
        });
    });
}); 