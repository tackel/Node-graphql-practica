import {
  InputType,
  Mutation,
  Resolver,
  Field,
  Arg,
  Query,
  UseMiddleware,
  Ctx,
} from "type-graphql";
import { getRepository, Repository } from "typeorm";
import { Book } from "../entity/book.entity";
import { Author } from "../entity/author.entity";
import { Length } from "class-validator";
import { IContext, isAuth } from "../middlewares/auth.middleware";

@InputType()
class BookInput {
  // dos campos
  @Field()
  @Length(3, 64) // un minimo y un maximo de caraceteres
  title!: string;

  @Field()
  author!: number;
}

@InputType() // difiere del anterior en que los campos no son obligatorios
class BookUpdateInput {
  // dos campos
  @Field(() => String, { nullable: true })
  @Length(3, 64)
  title?: string;

  @Field(() => Number, { nullable: true })
  author?: number;
}
@InputType() // difiere del anterior en que los campos no son obligatorios
class BookUpdateParsedInput {
  // dos campos
  @Field(() => String, { nullable: true })
  @Length(3, 64)
  title?: string;

  @Field(() => Author, { nullable: true })
  author?: Author;
}

@InputType()
class BookIdInput {
  @Field(() => Number)
  id!: number; // con el signo ! indicamos que lo estamos inicializando
}

@Resolver()
export class BookResolver {
  BookRepository: Repository<Book>; // creamos el repositorio
  AuthorRepository: Repository<Author>; // Creamos el repositorio de author para poder consultarlo

  constructor() {
    this.BookRepository = getRepository(Book); // Inicializamos el repositorio
    this.AuthorRepository = getRepository(Author);
  }

  @Mutation(() => Book)
  @UseMiddleware(isAuth)
  async createBook(
    @Arg("input", () => BookInput) input: BookInput,
    @Ctx() context: IContext
  ) {
    // Arg recibe un input y nos devuelve un bookinput que lo creamos arriba.
    // tabien le decimos que va a tener la VARIABLE input que es de tipo BookInput
    try {
      console.log(context.payload);
      const author: Author | undefined = await this.AuthorRepository.findOne(
        input.author
      );
      if (!author) {
        const error = new Error();
        error.message =
          " The author for this book don´t exists, esta en el try";
        throw error;
      }
      // creamos el libro
      const book = await this.BookRepository.insert({
        title: input.title,
        author: author, // este author es el que buscamos recine el el repositorio, que si no esta entraria en el catch.
      });

      return await this.BookRepository.findOne(book.identifiers[0].id, {
        relations: ["author", "author.books"], // para relacionar e book con author
      });
    } catch {
      throw new Error(
        "The author for this book don´t exists, esta en el catch"
      );
    }
  }

  @Query(() => [Book])
  @UseMiddleware(isAuth)
  async getAllBooks(): Promise<Book[]> {
    try {
      return await this.BookRepository.find({
        relations: ["author", "author.books"],
      });
    } catch {
      throw new Error();
    }
  }

  @Query(() => Book)
  async getBookById(
    @Arg("input", () => BookIdInput) input: BookIdInput
  ): Promise<Book | undefined> {
    try {
      const book = await this.BookRepository.findOne(input.id, {
        relations: ["author", "author.books"],
      });
      if (!book) {
        const error = new Error();
        error.message = "Book not found";
        throw error.message;
      }
      return book;
    } catch {
      throw new Error("Book not found");
    }
  }
  @Mutation(() => Boolean)
  async deleteBook(
    @Arg("bookId", () => BookIdInput) bookId: BookIdInput
  ): Promise<Boolean> {
    try {
      const result = await this.BookRepository.delete(bookId.id);
      if (result.affected === 0) {
        throw new Error("Book no existe"); // tambien se puede consultar primero si el libro existe para poder borrarlo
      }
      return true;
    } catch (e) {
      throw new Error("Error en delete");
    }
  }

  @Mutation(() => Boolean)
  async updateBookById(
    @Arg("bookId", () => BookIdInput) bookId: BookIdInput,
    @Arg("input", () => BookUpdateInput) input: BookUpdateInput
  ): Promise<Boolean> {
    try {
      await this.BookRepository.update(bookId, await this.parseInput(input));
      return true;
    } catch (e) {
      throw new Error();
    }
  }
  private async parseInput(input: BookUpdateInput) {
    try {
      const _input: BookUpdateParsedInput = {};
      if (input.title) {
        _input["title"] = input.title;
      }
      if (input.author) {
        const author = await this.AuthorRepository.findOne(input.author);
        if (!author) {
          throw new Error(" This author not exists");
        }
        _input["author"] = await this.AuthorRepository.findOne(input.author);
      }
      return _input;
    } catch (e) {
      throw new Error();
    }
  }
}
