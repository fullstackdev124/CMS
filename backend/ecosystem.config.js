module.exports = {
	apps: [
		{
			name: 'eCMS Backend RestFul API',
			script: 'dist/index.js',
			instances: 2,
			autorestart: true,
			watch: false,
			exec_mode: "cluster",
			max_memory_restart: '1G',
			env: {
				NODE_ENV: 'prod',
				PORT: 3001
			},
			env_development: {
				NODE_ENV: 'dev',
				PORT: 3002
			},
		},
		{
			name: 'eCMS Telephony RestFul API',
			script: 'dist/index.js',
			instances: 2,
			autorestart: true,
			watch: false,
			exec_mode: "cluster",
			max_memory_restart: '1G',
			env: {
				NODE_ENV: 'prod',
				PORT: 3003
			}
		},
	]
};
