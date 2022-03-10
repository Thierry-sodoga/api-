import {
  authenticate,
  TokenService,
  UserService,
} from '@loopback/authentication';
import {RequestContext} from '@loopback/rest';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {model, property, repository} from '@loopback/repository';
import {get, HttpErrors, param, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import _ from 'lodash';
import {
  PasswordHasherBindings,
  TokenServiceBindings,
  UserServiceBindings,
} from '../keys';
import {basicAuthorization} from '../middlewares/auth.midd';
import {User} from '../models';
import {Credentials, UserRepository} from '../repositories';
import {PasswordHasher, validateCredentials} from '../services';
import {UserProfileSchema} from './specs/user-controller.specs';

@model()
export class NewUserRequest extends User {
  @property({
    type: 'string',
    required: true,
  })
  password: string;
}

export class UserController {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<User, Credentials>,
    @inject.context()public context: RequestContext,
  ) {}

  @post('/users/sign-up', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  async create(
    @requestBody()
    newUserRequest: Credentials,
  ): Promise<User> {
    newUserRequest.role = 'user';

    // ensure a valid email value and password value
    validateCredentials(_.pick(newUserRequest, ['email', 'password']));

    // encrypt the password
    const password = await this.passwordHasher.hashPassword(
      newUserRequest.password,
    );

    try {
      // create the new user
      const savedUser = await this.userRepository.create(
        _.omit(newUserRequest, 'password'),
      );

      // set the password
      await this.userRepository
        .userCredentials(savedUser.id)
        .create({password});

      return savedUser;
    } catch (error) {
      // MongoError 11000 duplicate key
      if (error.code === 11000 && error.errmsg.includes('index: uniqueEmail')) {
        throw new HttpErrors.Conflict('Email value is already taken');
      } else {
        throw error;
      }
    }
  }

  @post('/users/sign-up/admin', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  async createAdmin(
    @requestBody()
    newUserRequest: Credentials,
  ): Promise<User> {
    // All new users have the "customer" role by default
    newUserRequest.role = 'admin';
    // ensure a valid email value and password value
    validateCredentials(_.pick(newUserRequest, ['email', 'password']));

    // encrypt the password
    const password = await this.passwordHasher.hashPassword(
      newUserRequest.password,
    );

    try {
      // create the new user
      const savedUser = await this.userRepository.create(
        _.omit(newUserRequest, 'password'),
      );

      // set the password
      await this.userRepository
        .userCredentials(savedUser.id)
        .create({password});

      return savedUser;
    } catch (error) {
      // MongoError 11000 duplicate key
      if (error.code === 11000 && error.errmsg.includes('index: uniqueEmail')) {
        throw new HttpErrors.Conflict('Email value is already taken');
      } else {
        throw error;
      }
    }
  }

  // @get('/users/{userId}', {
  //   responses: {
  //     '200': {
  //       description: 'User',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             'x-ts-type': User,
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // @authenticate('jwt')
  // @authorize({
  //   allowedRoles: ['admin'],
  //   voters: [basicAuthorization],
  // })
  // async findById(@param.path.string('userId') userId: string): Promise<User> {
  //   return this.userRepository.findById(userId);
  // }

  // @get('/users/me', {
  //   responses: {
  //     '200': {
  //       description: 'The current user profile',
  //       content: {
  //         'application/json': {
  //           schema: UserProfileSchema,
  //         },
  //       },
  //     },
  //   },
  // })
  // @authenticate('jwt')
  // async printCurrentUser(
  //   @inject(SecurityBindings.USER)
  //   currentUserProfile: UserProfile,
  // ): Promise<User> {
  //   const userId = currentUserProfile[securityId];
  //   return this.userRepository.findById(userId);
  // }

  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody() credentials: Credentials,
  ): Promise<{token: string}> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);

    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);

    return {token};
  }

  @post('/users/login/admin', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async adminlogin(
    @requestBody() credentials: Credentials,
  ): Promise<{token: string}> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);

    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);

    return {token};
  }

  // @post('/users/logout', {
  //   responses: {
  //     '200': {
  //       description: 'Return success',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'object'
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // async logout():Promise<object> {
  //   const authHeader = this.context.request.headers.authorization;
  //   console.log(authHeader);
  //   if (authHeader && authHeader.split(" ")[1]) {
  //     return {code:204, status: true, message: 'Logout successful'};
  //   }
  //   else {
  //     return {code:204, status: false, message: 'Somethings wrong'}
  //   }
  // }
}
