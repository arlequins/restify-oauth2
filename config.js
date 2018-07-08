const database = process.env.DATABASE_TYPE || 'mongodb'
const setModel = (database) => {
	if (database === 'mongodb') {
		return require('./oauth/mongo-models')
	} else {
		return require('./oauth/models')
	}
}

module.exports = {
	jwtSecret: process.env.JWT_SECRET || 'supersecret',
	name: 'API',
	env: process.env.NODE_ENV || 'development',
	port: process.env.PORT || 3000,
	base_url: process.env.BASE_URL || 'http://localhost:3000',
	apiUrl: process.env.API_URL || '/api/v1',
	model: setModel(database),
	database: process.env.DATABASE_TYPE || 'mongodb', // or sqldb
	seedDBForce: true,
	db: {
		mongo: {
			uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/setine',
		},
		sqldb: {
			database: process.env.SQL_DATABASE || 'oauth',
			username: process.env.SQL_USERNAME || 'root',
			password: process.env.SQL_PASSWORD || '',
			options: {
				host: process.env.SQL_HOST || 'localhost',
				dialect: process.env.SQL_TYPE || 'mysql', // 'mysql'|'sqlite'|'postgres'|'mssql'
				port: process.env.SQL_PORT || 3306,
				operatorsAliases: false,
				pool: {
					max: process.env.SQL_POOL_MAX || 10,
					min: process.env.SQL_POOL_MIN || 0,
					acquire: process.env.SQL_POOL_ACQUIRE || 30000,
					idle: process.env.SQL_POOL_IDLE || 10000
				}
			}
		}
	}
}
