module.exports = {
    apps: [
      {
        name: "Skychat",
        script: "/home/ec2-user/my-project/Skychat/backend/server.js", // Full path to server.js
        cwd: "/home/ec2-user/my-project/Skychat/backend",              // Working directory
        watch: false,
        env: {
          NODE_ENV: "production",
          PORT: 3000
        }
      },
      {
        name: 'Skychat-wordgame',
        script: '/home/ec2-user/my-project/Skychat/backend/wordGameServer.js', // Path to your frontend server file
        cwd: '/home/ec2-user/my-project/Skychat/backend', // Directory of the server
        env: {
          NODE_ENV: 'production',
          PORT: 5001,
        },
      }
    ]
  };
  