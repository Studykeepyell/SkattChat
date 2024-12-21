// Shared message handling logic
export class MessageHandler {
  static formatMessage(message: string, username: string) {
    return {
      content: message,
      username,
      timestamp: new Date().toISOString()
    };
  }

  static validateMessage(message: string) {
    return message.length > 0 && message.length <= 1000;
  }
} 