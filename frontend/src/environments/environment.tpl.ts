export const environment = {
	production: true,
	api: {
		core: {
			uri: '{{BACKEND_PROTO}}://{{HOST_FQDN}}:{{BACKEND_HTTPS_PORT}}',
			path: '/api/v1'
		}
	},
	softphone: {
		scheme: '{{WS_PROTO}}',
		server: '{{HOST_FQDN}}',
		port: '{{WS_PORT}}',
		path: '/ws',
		sipDomain: 'tenant_',
	},
	stripe: {
		key: "{{STRIPE_CLIENT_KEY}}"
	}
};
