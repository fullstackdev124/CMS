// Using import doesn't properly bind events
// import * as _cluster from 'cluster';
const cluster = require('cluster');
import * as os from 'os';

export class Cluster {
    static register(workers: Number, callback: Function): void {

        if (cluster.isMaster) {

            //ensure workers exit cleanly
            process.on('SIGINT', function () {
                console.log('[CLUSTER] System Shutdown...');
                for (var id in cluster.workers) {
                    cluster?.workers[id]?.kill();
                }
                // exit the master process
                process.exit(0);
            });

            var cpus = os.cpus().length;
            console.log(`[CLUSTER] Master server started on ${process.pid} cpu len: ${os.cpus().length} reqested workers: ${workers}`);

            if (Number(workers) > cpus)
                workers = cpus;

            for (let i = 0; i < Number(workers); i++) {
                cluster.fork();
            }

            cluster.on('online', function (worker: any) {
                console.log('[CLUSTER] Worker %s is online', worker.process.pid);
            });

            cluster.on('exit', (worker: any, code: any, signal: any) => {
                console.log(`[CLUSTER] Worker ${worker.process.pid} died. Restarting`);
                cluster.fork();
            });

        } else {
            callback();
        }
    }
}
