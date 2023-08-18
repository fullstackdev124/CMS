import {ApplicationConfig} from '@loopback/core';
import {once} from 'events';
import express, {Request, Response} from 'express';
import http from 'http';
import {AddressInfo} from 'net';
import path from 'path';
import {DashWsSrvApplication} from './application';

const loopback = require('loopback');
const compression = require('compression');
const cors = require('cors');

// Required as additional security
// const helmet = require('helmet');

export {ApplicationConfig};

export class ExpressServer {
  private app: express.Application;
  public readonly lbApp: DashWsSrvApplication;
  public server?: http.Server;
  public url: String;

  constructor(options: ApplicationConfig = {}) {
    this.app = express();

    this.lbApp = new DashWsSrvApplication(options);

    // Middleware migrated from LoopBack 3
    this.app.use(loopback.favicon());
    this.app.use(compression());
    this.app.use(cors());

    // Helmet will secure app deployment but also broke API Swagger Explorer UI
    // this.app.use(helmet());

    // Mount the LB4 REST API
    this.app.use('/api', this.lbApp.requestHandler);

    // Custom Express routes
    this.app.get('/ping', function (_req: Request, res: Response) {
      res.send('pong');
    });

    // Serve static files in the public folder
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  public async boot() {
    await this.lbApp.boot();
  }

  public async start() {
    await this.lbApp.start();
    const port = this.lbApp.restServer.config.port ?? 3001;
    const host = this.lbApp.restServer.config.host ?? '0.0.0.0';
    this.server = this.app.listen(port, host);
    await once(this.server, 'listening');
    const add = <AddressInfo>this.server.address();
    this.url = `http://${add.address}:${add.port}`;
  }

  public async stop() {
    if (!this.server) return;
    await this.lbApp.stop();
    this.server.close();
    await once(this.server, 'close');
    this.server = undefined;
  }
}
