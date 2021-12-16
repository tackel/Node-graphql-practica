import { IsEmail, Length } from "class-validator";
import {
  Arg,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
} from "type-graphql";
import { getRepository, Repository } from "typeorm";
import { User } from "../entity/user.entity";
import { hash, compareSync } from "bcryptjs"; // para la contraseña
import { environment } from "../config/environment";
import { sign } from "jsonwebtoken";

@InputType()
class UserInput {
  @Field()
  @Length(3, 64)
  fullName!: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @Length(8, 264)
  password!: string;
}

@InputType()
class LoginInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  password!: string;
}

@ObjectType()
class LoginResponse {
  @Field()
  userId!: number;

  @Field()
  jwt!: string; //json web token
}

@Resolver()
export class AuthResolver {
  userRepository: Repository<User>;

  constructor() {
    this.userRepository = getRepository(User);
  }

  @Mutation(() => User)
  async register(
    @Arg("input", () => UserInput) input: UserInput
  ): Promise<User | undefined> {
    try {
      const { fullName, email, password } = input; // desastructura lo que se ingresa en el input
      // primero se comprueba si el usuario existe
      const userExist = await this.userRepository.findOne({ where: { email } });
      if (userExist) {
        const error = new Error();
        error.message = "Email no valido, ya existe";
        throw error;
      }
      const hashedPassword = await hash(password, 10);
      const newUser = await this.userRepository.insert({
        fullName,
        email,
        password: hashedPassword,
      });

      return this.userRepository.findOne(newUser.identifiers[0].id);
    } catch (error) {
      throw new Error("Email no valido");
    }
  }

  @Mutation(() => LoginResponse)
  async login(@Arg("input", () => LoginInput) input: LoginInput) {
    try {
      const { email, password } = input;
      const userFound = await this.userRepository.findOne({ where: { email } });

      if (!userFound) {
        const error = new Error();
        error.message = "Invalid Credential";
        throw error;
      }
      const isValidPassword: boolean = compareSync(
        password,
        userFound.password
      );

      if (!isValidPassword) {
        const error = new Error();
        error.message = "Invalid credential";
        throw error;
      }

      const jwt: string = sign({ id: userFound.id }, environment.JWT_SECRET);

      return {
        userId: userFound.id,
        jwt: jwt,
      };
    } catch (error) {
      throw new Error("Invalid credential");
    }
  }
}

// hay que registrar los resorlver en el server
