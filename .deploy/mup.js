module.exports = {
  servers: {
    one: {
      // TODO: set host address, username, and authentication method
      host: '13.57.143.215',
      username: 'ubuntu',
      pem: '~/.ssh/nobankers-rocketchat.pem'
      // pem: './path/to/pem'
      // password: 'server-password'
      // or neither for authenticate from ssh-agent
    }
  },

  app: {
    // TODO: change app name and path
    name: 'rocket.chat',
    path: '../',
    volumes: {
      '/files':'/files'
    },

    servers: {
      one: {},
    },

    buildOptions: {
      serverOnly: true,
    },

    env: {
      // TODO: Change to your app's url
      // If you are using ssl, it needs to start with https://
      ROOT_URL: 'http://staging.rocketchat.io',
      MONGO_URL: 'mongodb://db_owner:y7Tw6K4RJf9k7ssj@ds141657.mlab.com:41657/capx-rocketchat',
      HUB_MONGO_URL: 'mongodb://db_owner:YQ6MewFaethU4nkD@ds064198.mlab.com:64198/hub'
    },

    // ssl: { // (optional)
    //   // Enables let's encrypt (optional)
    //   autogenerate: {
    //     email: 'email.address@domain.com',
    //     // comma separated list of domains
    //     domains: 'website.com,www.website.com'
    //   }
    // },

    docker: {
      // change to 'abernix/meteord:base' if your app is using Meteor 1.4 - 1.5
      image: 'abernix/meteord:base',
      // args: [
      //   '--link=rocketchat_db_1'
      // ]
    },

    // Show progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    enableUploadProgressBar: true
  },
};
