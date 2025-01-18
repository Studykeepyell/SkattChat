#!/bin/sh

# Start the backend server
npm run dev:server &

# Start webpack dev server
npm run dev:web &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $? 