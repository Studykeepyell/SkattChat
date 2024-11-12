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
      }
    ]
  };
  