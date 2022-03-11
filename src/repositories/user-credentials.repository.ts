import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongodbsDataSource} from '../datasources';
import {UserCredentials, UserCredentialsRelations} from '../models';

export class UserCredentialsRepository extends DefaultCrudRepository<
  UserCredentials,
  typeof UserCredentials.prototype.id,
  UserCredentialsRelations
> {
  constructor(
    @inject('datasources.mongoatlas') dataSource: MongodbsDataSource,
  ) {
    super(UserCredentials, dataSource);
  }
}
