import { v4 as uuidv4 } from 'uuid';

const BRAND_ID = 'brand-e2e';

const TEST_USER = {
  brand_name: 'Main Brand',
  brand_id: 'brand-e2e',
  full_name: 'Paul L. Stewart',
  job_title: 'Developer',
  email: 'user@brand-e2e.com',
  password: 'User@123',
};

const MRF_USER = {
  email: 'mrf-user@brand-e2e.com',
  password: 'Mrf@159753',
};

const TEST_BRAND_GTIN = '7898617451062';

const products = [
  {
    gtin: '7898617451062',
    product_name: 'PASTA DE AMENDOIM',
    reference: 'PS-0001',
    labels_printed: 7,
    format: 'xml',
    attributes: [
      {
        id: uuidv4(),
        name: 'Size',
        value: '50',
      },
      {
        id: uuidv4(),
        name: 'Weight',
        value: '160',
      },
    ],
    components: [
      {
        id: uuidv4(),
        material: 'PET',
        name: 'Bottle',
        percentage: 20,
        weight: 25,
      },
      {
        id: uuidv4(),
        material: 'LDPE',
        name: 'Polyethylene',
        percentage: 10,
        weight: 10,
      },
    ],
  },
  {
    gtin: '7622210596413',
    product_name: 'BOMBOM LACTA FAVORITOS',
    reference: 'BM-0001',
    labels_printed: 3,
    format: 'xml',
    attributes: [
      {
        id: uuidv4(),
        name: 'Size',
        value: '20',
      },
      {
        id: uuidv4(),
        name: 'Weight',
        value: '200',
      },
    ],
    components: [
      {
        id: uuidv4(),
        material: 'Steel',
        name: 'Bottle',
        percentage: 30,
        weight: 50,
      },
      {
        id: uuidv4(),
        material: 'Fabric',
        name: 'Polyethylene',
        percentage: 15,
        weight: 15,
      },
    ],
  },
];

export { BRAND_ID, MRF_USER, TEST_BRAND_GTIN, TEST_USER, products };
