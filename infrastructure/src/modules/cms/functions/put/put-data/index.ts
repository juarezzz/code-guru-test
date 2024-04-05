/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { CmsWebsite } from '_modules/cms/models';

/* ---------- Services ---------- */
import { cms_services } from '_modules/cms/services';

/* ---------- Interfaces ---------- */
interface PutCMSDataInput {
  language: string;
}

export const put_cms_data = async ({ language }: PutCMSDataInput) => {
  const sites = await cms_services.get_sites(language);
  const website = sites[sites.length - 1];

  const folder_id = decodeURIComponent(website.folderId);
  const website_folder = folder_id.includes('#')
    ? folder_id
    : `${folder_id}#0001`;

  const [rich_articles_folder, articles, folder_pages] = await Promise.all([
    cms_services.get_subfolders(website_folder),
    cms_services.get_blog_posts(language),
    cms_services.get_folder_pages(website_folder),
  ]);

  const [rich_articles_pages, pages_elements_array] = await Promise.all([
    cms_services.get_folder_pages(rich_articles_folder.id),
    await Promise.all(
      folder_pages.map(async ({ id, data }) => ({
        [data.title]: await cms_services.get_page_elements(id),
      })),
    ),
  ]);

  const rich_articles_array = await Promise.all(
    rich_articles_pages.map(async ({ id, data }) => ({
      [`/articles${data.title}`]: await cms_services.get_page_elements(id),
    })),
  );

  pages_elements_array.push(...rich_articles_array);

  const pages = JSON.stringify(
    pages_elements_array.reduce((acc, curr) => ({ ...acc, ...curr }), {}),
  );

  const cms_website: CmsWebsite = {
    partition_key: 'cms-website',
    sort_key: `cms-website#${language}#${website_folder}`,
    datatype: 'cms-website',
    updated_at: Date.now(),

    website,
    articles,
    pages,
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: cms_website,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { cms_website };
};
