interface FolderPageInterface {
  id: string;
  data: {
    id: string;
    pid: string;
    title: string;
    createdOn: string;
    savedOn: string;
  };
}

export class FolderPage implements FolderPageInterface {
  data: {
    id: string;
    pid: string;
    title: string;
    createdOn: string;
    savedOn: string;
  };

  id: string;
}
