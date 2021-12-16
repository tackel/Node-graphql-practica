import { InputType, Mutation, Resolver, Field, Arg, Query } from "type-graphql";
import { Author } from "../entity/author.entity";
import { getRepository, Repository } from "typeorm";
import { Length } from "class-validator";
// repository nos da acceso a los metodos para poder ahcer consultas en la bd

@InputType()
class AuthorUpdateInput {
  @Field(() => Number)
  id!: number;

  @Field()
  @Length(3, 64)
  fullName?: string; // con el signo ! indicamos que lo estamos inicializando
}

@InputType()
class AuthorInput {
  @Field()
  @Length(3, 64)
  fullName!: string; // con el signo ! indicamos que lo estamos inicializando
}

@InputType()
class AuthorIdInput {
  @Field(() => Number)
  id!: number; // con el signo ! indicamos que lo estamos inicializando
}

@Resolver()
export class AuthorResolver {
  authorRepository: Repository<Author>;

  constructor() {
    //en el constructor vamos a pasarle a la variable que creamos que es de tipo getRepositorio y le pasamos de que entidad es
    this.authorRepository = getRepository(Author); // aca tenemos abilitado todos los metodos de consulta en la bd
  }

  @Mutation(() => Author) // mutation se encarga de guardar o generan datos en la base de datos y aca devuelve un objeto de tipo Authon con las misma propiedades que tiene nuestra entidad
  async createAuthor(
    @Arg("input", () => AuthorInput) input: AuthorInput
  ): Promise<Author | undefined> {
    try {
      const createdAuthor = await this.authorRepository.insert({
        fullName: input.fullName,
      }); // se puede pasar el input entero pero como es uno solo lo pasa asi
      const result = await this.authorRepository.findOne(
        createdAuthor.identifiers[0].id
      );
      return result;
    } catch {
      console.error;
    }
  }

  // esta query devueve los autores
  @Query(() => [Author]) // se pone entre [] para especificar que devuelve un array
  async getAllAuthors(): Promise<Author[]> {
    // los corchetes son opr que sino solo dara un solo autor, asi dara un array de autores
    return await this.authorRepository.find({ relations: ["books"] });
  }
  @Query(() => Author)
  async getOneAuthor(
    @Arg("input", () => AuthorIdInput) input: AuthorIdInput
  ): Promise<Author | undefined> {
    try {
      const author = await this.authorRepository.findOne(input.id);
      if (!author) {
        const error = new Error();
        error.message = "Author don´t exist";
        throw new Error(error.message);
      }
      return author;
    } catch {
      throw new Error("Author don´t exists otro");
    }
  }

  @Mutation(() => Author)
  async updateOneAuthor(
    @Arg("input", () => AuthorUpdateInput) input: AuthorUpdateInput
  ): Promise<Author | undefined> {
    // si queremso saber si el author existe o no primero
    const authorExist = await this.authorRepository.findOne(input.id);
    if (!authorExist) {
      throw new Error("Author don´t exists");
    }

    const updetedAuthor = await this.authorRepository.save({
      id: input.id,
      fullName: input.fullName,
    });
    return await this.authorRepository.findOne(updetedAuthor.id);
  }

  @Mutation(() => Boolean)
  async deleteAuthor(
    @Arg("input", () => AuthorIdInput) input: AuthorIdInput
  ): Promise<Boolean> {
    await this.authorRepository.delete(input.id);
    return true;
  }
}
