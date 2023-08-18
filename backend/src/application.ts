import {BootMixin} from '@loopback/boot';
import {Lb3AppBooterComponent} from '@loopback/booter-lb3app';
import {ApplicationConfig, BindingKey} from '@loopback/core';
import {LoggingBindings, LoggingComponent} from '@loopback/logging';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import * as path from 'path';
import {MySequence} from './sequence';
import {OPERATION_SECURITY_SPEC, SECURITY_SCHEME_SPEC} from './utils/security-specs';

/**
 * Information from package.json
 */
export interface PackageInfo {
  name: string;
  version: string;
  description: string;
}
export const PackageKey = BindingKey.create<PackageInfo>('application.package');

const pkg: PackageInfo = require('../package.json');

export class DashWsSrvApplication extends BootMixin(
  RepositoryMixin(RestApplication),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Define OpenAPI Security Spec
    this.api({
      openapi: '3.0.0',
      info: {title: pkg.name, version: pkg.version},
      paths: {},
      components: {securitySchemes: SECURITY_SCHEME_SPEC},
      servers: [{url: '/'}],
      security: OPERATION_SECURITY_SPEC
    });

    this.configure(LoggingBindings.COMPONENT).to({
	    enableFluent: false, // default to true
	    enableHttpAccessLog: true, // default to true
    });
    this.component(LoggingComponent);

    // Enable JWT Authentication
    // this.component(JWTAuthenticationComponent);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Initialite Rest Explorer
    this.component(RestExplorerComponent);
    this.configure(RestExplorerBindings.COMPONENT).to({
	    indexTitle: 'eCMS Backend API Explorer',
	    indexTemplatePath: path.resolve(__dirname, '../explorer/index.html.ejs'),
    });

    // Mount LB3 Application
    this.component(Lb3AppBooterComponent);
    this.projectRoot = __dirname;

    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
	    controllers: {
		    // Customize ControllerBooter Conventions here
		    dirs: ['controllers'],
		    extensions: ['.controller.js'],
		    nested: true,
	    },
	    lb3app: {
		    mode: 'fullApp',
	    },
    };
  }
}
