/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ProductToGroupAssociation } from '_modules/products/models/product-to-product-group-association';

/* ---------- Interfaces ---------- */
interface GetAllProductsAssociationsToProductGroupInput {
  brand_id: string;
  product_group_sort_key: string;
  last_key?: Record<string, unknown> | undefined;
}

interface GetAllProductsAssociationsToProductGroupOutput {
  product_to_product_group_associations: ProductToGroupAssociation[];
  last_evaluated_key: Record<string, unknown> | undefined;
}

/* ---------- Function ---------- */
const get_all_product_associations_to_product_group = async ({
  brand_id,
  product_group_sort_key,
  last_key,
}: GetAllProductsAssociationsToProductGroupInput): Promise<GetAllProductsAssociationsToProductGroupOutput> => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    ExclusiveStartKey: last_key,
    KeyConditionExpression:
      'partition_key = :partition_key AND begins_with(sort_key, :sort_key)',
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':sort_key': `${product_group_sort_key}brand-product#`,
    },
  };

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  if (!Items?.length) {
    return {
      product_to_product_group_associations: [],
      last_evaluated_key: undefined,
    };
  }

  return {
    product_to_product_group_associations: Items as ProductToGroupAssociation[],
    last_evaluated_key: LastEvaluatedKey,
  };
};

/* ---------- Export ---------- */
export { get_all_product_associations_to_product_group };
