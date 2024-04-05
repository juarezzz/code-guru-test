interface ArticleInterface {
  slug: string;
  title: string;
  description: string;
  image?: string;
  body: string;
  createdOn: string;
  visible: boolean;
  content: string;
  author: {
    name: string;
    image: string;
    position: string;
  };
  topics: string[];
  types: string[];
}

export class Article implements ArticleInterface {
  author: { name: string; image: string; position: string };

  body: string;

  content: string;

  createdOn: string;

  description: string;

  image?: string;

  slug: string;

  title: string;

  topics: string[];

  types: string[];

  visible: boolean;
}
