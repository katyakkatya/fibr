import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

// структура данных
const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    birthYear: Int
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    year: Int
    author: Author!
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    authors: [Author!]!
  }

  type Mutation {
    createBook(title: String!, year: Int, authorId: ID!): Book!
    createAuthor(name: String!, birthYear: Int): Author!
  }
`;

// временное хранение в памяти
const authors = [
  { id: "1", name: "Лев Толстой", birthYear: 1828 },
  { id: "2", name: "Фёдор Достоевский", birthYear: 1821 },
];

const books = [
  { id: "1", title: "Война и мир", year: 1869, authorId: "1" },
  { id: "2", title: "Анна Каренина", year: 1877, authorId: "1" },
  { id: "3", title: "Преступление и наказание", year: 1866, authorId: "2" },
];

// резолверы
const resolvers = {
  // обработчики запросов на чтение
  Query: {
    books: () => books,
    book: (_, { id }) => books.find((book) => book.id === id),
    authors: () => authors,
  },

  // обработчики запросов на изменение
  Mutation: {
    createBook: (_, { title, year, authorId }) => {
      const newBook = {
        id: String(books.length + 1),
        title,
        year,
        authorId,
      };
      books.push(newBook);
      return newBook;
    },
    createAuthor: (_, { name, birthYear }) => {
      const newAuthor = {
        id: String(authors.length + 1),
        name,
        birthYear,
      };
      authors.push(newAuthor);
      return newAuthor;
    },
  },

  // как связать книгу с автором
  Book: {
    author: (book) => authors.find((author) => author.id === book.authorId),
  },

  // как связать автора с его книгами
  Author: {
    books: (author) => books.filter((book) => book.authorId === author.id),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`Сервер запущен: ${url}`);
