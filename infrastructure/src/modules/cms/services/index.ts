import axios from 'axios';

import { PageElement } from '../models/page-element';
import { Website } from '../models/website';
import { Article } from '../models/article';
import { FolderPage } from '../models/folder-page';

const api = axios.create({
  baseURL: process.env.WEBINY_GRAPHQL_ENDPOINT,
  headers: {
    Authorization: `${process.env.WEBINY_TOKEN}`,
  },
});

const get_subfolders = async (folder_id: string) => {
  const query = `
  query ListSubfolders($parent_id: String!) {
    aco {
      listFolders(where: { type: "PbPage", parentId: $parent_id }) {
        data {
          id
          title
          parentId
        }
      }
    }
  }
  `;

  const { data } = await api.post(`/graphql`, {
    query,
    variables: { parent_id: folder_id },
  });

  return data.data.aco.listFolders.data[0] as FolderPage;
};

const get_page_elements = async (page_id: string) => {
  const query = `
      query PbGetPagePreview($id: ID!) {
        pageBuilder {
          getPage(id: $id) {
            data {
              content
              createdOn
              __typename
            }
            error {
              code
              message
              data
              __typename
            }
            __typename
          }
          __typename
        }
      }
    `;

  const { data } = await api.post(`graphql`, {
    query,
    variables: { id: page_id },
  });

  const page_data = data.data.pageBuilder.getPage.data as {
    content: PageElement;
    createdOn: string;
  };

  return {
    ...page_data.content.elements[0].elements[0],
    createdOn: page_data.createdOn,
  } as PageElement;
};

const get_sites = async (lang: string) => {
  const query = `
    query CmsEntriesListWebsites {
      listWebsites {
        data {
          folderId
          image
          description
          title
        }
      }
    }
  `;

  const { data } = await api.post(`cms/read/${lang}`, {
    query,
  });

  return data.data.listWebsites.data as Website[];
};

const get_blog_posts = async (lang: string) => {
  const query = `
    query CmsEntriesListBlogPosts {
      listPosts {
        data {
          author {
            id
            name
            image
            position
          }

          slug

          title
          description
          image

          visible

          topics
          types

          content

          createdOn
        }
      }
    }`;

  const { data } = await api.post(`/cms/read/${lang}`, {
    query,
  });

  return data.data.listPosts.data as Article[];
};

const get_folder_pages = async (folder_id: string) => {
  const query = `
  query FolderPages($id: String) {
    search {
      content: listAcoSearchRecordPb(
        where: {
          location: {
            folderId: $id
          }
        }
      ) {
        data {
          id
          data {
            id
            pid
            title
            createdOn
            savedOn
          }
        }
      }
    }
  }
  `;

  const { data } = await api.post(`/graphql`, {
    query,
    variables: { id: folder_id },
  });

  return data.data.search.content.data as FolderPage[];
};

export const cms_services = {
  get_blog_posts,
  get_folder_pages,
  get_page_elements,
  get_subfolders,
  get_sites,
};
