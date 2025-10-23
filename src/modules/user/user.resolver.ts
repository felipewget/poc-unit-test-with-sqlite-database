import { Resolver, Query, Args } from '@nestjs/graphql';
import { User } from 'src/entities/users.entity';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private usersService: UserService) {}

  @Query(() => User, { nullable: true })
  getUserByEmail(@Args('email') email: string) {
    return this.usersService.getUserByEmail(email);
  }
}