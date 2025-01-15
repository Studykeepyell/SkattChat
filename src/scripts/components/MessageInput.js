(function(window) {
  class MessageInput {
    constructor(container) {
      this.container = container;
      this.message = '';
      this.isGifPickerOpen = false;
      this.render();
      this.attachEventListeners();
    }

    render() {
      this.container.innerHTML = `
        <div class="w-full p-4 bg-background">
          <form class="flex flex-col gap-3 max-w-[95%] mx-auto">
            <!-- Buttons row -->
            <div class="flex justify-between items-center w-full">
              <div class="flex gap-2">
                <button type="button" class="emoji-button button-ghost">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </button>

                <button type="button" class="file-button button-ghost">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                </button>

                <button type="button" class="scissors-button button-ghost">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="6" cy="6" r="3"></circle>
                    <circle cx="6" cy="18" r="3"></circle>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                    <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                    <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                  </svg>
                </button>

                <button type="button" class="image-button button-ghost">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </button>
              </div>

              <button type="button" class="video-button button-ghost">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </button>
            </div>

            <!-- Input row -->
            <div class="flex items-center gap-2 w-full">
              <input
                type="text"
                class="message-input flex-1"
                placeholder="Type a message..."
              />
              <button type="submit" class="send-button" disabled>
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </form>
        </div>
      `;
    }

    attachEventListeners() {
      const form = this.container.querySelector('form');
      const input = this.container.querySelector('.message-input');
      const sendButton = this.container.querySelector('.send-button');

      input.addEventListener('input', (e) => {
        this.message = e.target.value;
        sendButton.disabled = !this.message.trim();
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!this.message.trim()) return;
        
        // Emit the message event
        const event = new CustomEvent('message-sent', {
          detail: { message: this.message }
        });
        this.container.dispatchEvent(event);
        
        // Clear input
        this.message = '';
        input.value = '';
        sendButton.disabled = true;
      });
    }
  }

  // Expose to window object
  window.MessageInput = MessageInput;

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const messageInputRoot = document.getElementById('message-input-root');
    if (messageInputRoot) {
      new MessageInput(messageInputRoot);
    }
  });
})(window); 