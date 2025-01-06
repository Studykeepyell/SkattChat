export class ErrorHandler {
    static handle(error: any) {
        console.error('Application error:', error);

        if (error.response) {
            // Handle HTTP errors
            switch (error.response.status) {
                case 401:
                    this.handleUnauthorized();
                    break;
                case 403:
                    this.handleForbidden();
                    break;
                case 404:
                    this.handleNotFound();
                    break;
                default:
                    this.handleGenericError(error);
            }
        } else if (error instanceof TypeError) {
            // Handle network errors
            this.handleNetworkError(error);
        } else {
            // Handle other errors
            this.handleGenericError(error);
        }
    }

    private static handleUnauthorized() {
        // Redirect to login page
        window.location.href = '/pages/login.html';
    }

    private static handleForbidden() {
        alert('You do not have permission to perform this action.');
    }

    private static handleNotFound() {
        alert('The requested resource was not found.');
    }

    private static handleNetworkError(error: TypeError) {
        alert('Network error occurred. Please check your connection.');
    }

    private static handleGenericError(error: any) {
        alert('An error occurred. Please try again later.');
    }
} 