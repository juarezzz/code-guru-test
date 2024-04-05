interface PageElementInterface {
  id: string;
  type: string;
  data: {
    variables?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  };
  elements: PageElementInterface[];
  path: string[];
  createdOn?: string;
}

export class PageElement implements PageElementInterface {
  data: {
    variables?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  };

  elements: PageElementInterface[];

  id: string;

  path: string[];

  type: string;

  createdOn?: string;
}
