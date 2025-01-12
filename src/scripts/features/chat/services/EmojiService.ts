export class EmojiService {
    constructor() {}

    public initialize(): void {
        this.setupEmojiPicker();
    }

    private setupEmojiPicker(): void {
        const emojiButton = document.getElementById("emoji-button");
        const emojiPicker = document.getElementById("emoji-picker");
        const messageInput = document.getElementById("messageInput") as HTMLInputElement;

        emojiButton?.addEventListener("click", () => {
            if (emojiPicker) {
                emojiPicker.style.display = 
                    emojiPicker.style.display === "none" ? "block" : "none";
            }
        });

        document.querySelectorAll(".emoji").forEach((emoji) => {
            emoji.addEventListener("click", () => {
                if (messageInput && emojiPicker) {
                    messageInput.value += emoji.textContent;
                    emojiPicker.style.display = "none";
                }
            });
        });
    }
} 