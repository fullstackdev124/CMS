// Uncomment this in order to use cluster module
// import {Cluster} from './cluster';
import {ApplicationConfig, ExpressServer} from './server';
export * from './server';

// For certificates retrival
const fs = require('fs');

// This variable will old our server instance
var server: any = undefined;

/**
 * Prepare server instance and cluster it
 * @param options
 */
export async function main(options: ApplicationConfig = {}) {
  server = new ExpressServer(options);

  // Uncomment this if you want to use cluster module
  // Cluster.register(4, bootstrapServer);

  bootstrapServer();
}

/**
 * This additional function is created only for clustering purposes
 */
export async function bootstrapServer() {
  if(server !== undefined) {
    await server.boot();
    await server.start();
    console.log(`[CLUSTER] Server is running at ${server.url} on ${process.pid}`);
  }
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3001),
      host: process.env.HOST ?? '0.0.0.0',
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true
      },
      expressSettings: {
        'x-powered-by': false
      },
      // Use the LB4 application as a route. It should not be listening.
      listenOnStart: false,
      // Enabled HTTPS
      protocol: 'https',
      key: fs.readFileSync('./certs/localhost.key'),
      cert: fs.readFileSync('./certs/localhost.crt')
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  })
}
