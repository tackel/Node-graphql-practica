import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Book } from "./book.entity";
import { ObjectType, Field } from "type-graphql";

@ObjectType() // cuando queremos devolver un objeto mas complejo que un number o un string
@Entity()
export class Author {
  @Field() // para informar que es un campo
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String) // tambien podemos indicarle que va a retornar un string el campo
  @Column()
  fullName!: string;

  @Field(() => [Book], { nullable: true }) // debe ser anulable por que cuando creemos un autor no va  tener un libro
  @OneToMany(() => Book, (book) => book.author, { nullable: true })
  books!: Book[]; // es de tipo array de libros

  @Field(() => String)
  @CreateDateColumn({ type: "timestamp" })
  createAt!: string;
}
