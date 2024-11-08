module.exports = {
    apps: [
      {
        name: "Skychat",
        script: "/home/ec2-user/my-project/Skychat/backend/server.js", // Full path to server.js
        cwd: "/home/ec2-user/my-project/Skychat/backend",              // Working directory
        watch: false,
        env: {
          NODE_ENV: "production",
          MONGO_URI: "mongodb+srv://Sky:Sky090726@cluster1.ripon.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1",
          PORT: 3000
        }
      }
    ]
  };
  