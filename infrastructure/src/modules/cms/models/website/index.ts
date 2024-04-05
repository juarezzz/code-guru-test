interface WebsiteInterface {
  folderId: string;
  description: string;
  image: string;
  title: string;
}

export class Website implements WebsiteInterface {
  folderId: string;

  description: string;

  image: string;

  title: string;
}
