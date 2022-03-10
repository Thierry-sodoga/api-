import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const DB_USER = 'thithi07';
const PASSWORD = encodeURIComponent('gondolamerveille@123');
const DB_URL = `mongodb+srv://${DB_USER}:${PASSWORD}@cluster0.qd3kn.mongodb.net/test?retryWrites=true&w=majority`;
const HOST = 'cluster0.qd3kn.mongodb.net/test';

const config = {
  name: 'mongoatlas',
  connector: 'mongodb',
  url: 'mongodb+srv://thithi:0hQelKLPVvkeqzAE@cluster0.qd3kn.mongodb.net/test?retryWrites=true&w=majority',
  host: HOST,
  port: 27017,
  user: 'thithi',
  password: '0hQelKLPVvkeqzAE',
  database: 'test',
  protocol: 'mongodb+srv',
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MongoatlasDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'mongoatlas';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mongoatlas', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
