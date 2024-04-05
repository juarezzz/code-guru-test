/* ---------- External ---------- */
import { DynamoDBStreamEvent } from 'aws-lambda';

/* ---------- Types ---------- */
import { Failure } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/@types';

/* ---------- Handlers ---------- */
import { handle_brand_modify } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/brand/handle-brand-modify';
import { handle_brand_deletion } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/brand/handle-brand-deletion';
import { handle_campaign_creation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/campaign/handle-campaign-creation';
import { handle_campaign_deletion } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/campaign/handle-campaign-deletion';
import { handle_campaign_modify } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/campaign/handle-campaign-modify';
import { handle_campaign_to_landing_page_association } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/campaign-to-landing-page/handle_campaign_to_landing_page_association';
import { handle_campaign_to_landing_page_dissociation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/campaign-to-landing-page/handle_campaign_to_landing_page_dissociation';
import { handle_product_creation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product/handle-product-creation';
import { handle_product_deletion } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product/handle-product-deletion';
import { handle_product_group_deletion } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-group/handle-product-group-deletion';
import { handle_product_group_to_campaign_association } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-group-to-campaign/handle-product-group-to-campaign-association';
import { handle_product_group_to_campaign_dissociation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-group-to-campaign/handle-product-group-to-campaign-dissociation';
import { handle_product_to_product_group_association } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-to-product-group/handle-product-to-product-group-association';
import { handle_product_to_product_group_dissociation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-to-product-group/handle-product-to-product-group-dissociation';
import { handle_product_modify } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product/handle-product-modify';
import { handle_landing_page_deletion } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/landing-page/handle-landing-page-deletion';
import { handle_landing_page_modify } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/landing-page/handle-landing-page-modify';
import { handle_landing_page_creation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/landing-page/handle-landing-page-creation';
import { handle_mrf_deletion } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/mrf/handle-mrf-deletion';
import { handle_product_group_modify } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-group/handle-product-group-modify';
import { handle_printer_deletion } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/printer/handle-printer-deletion';
import { handle_product_attributes_modify } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-attributes/handle-product-attributes-modify';
import { handle_product_components_modify } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-components/handle-product-components-modify';
import { handle_brand_creation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/brand/handle-brand-creation';
import { handle_product_attributes_creation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-attributes/handle-product-attributes-creation';
import { handle_product_components_creation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-components/handle-product-components-creation';
import { handle_product_group_creation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/product-group/handle-product-group-creation';
import { handle_campaign_event_creation } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/handlers/campaign-event/handle-campaign-event-creation';

export const handler = async (
  event: DynamoDBStreamEvent,
): Promise<void | Failure> => {
  /* ---------- Controller ---------- */
  let sequence_number: string | undefined;

  const { Records } = event;

  try {
    for (const record of Records) {
      sequence_number = record.dynamodb?.SequenceNumber;

      if (record.dynamodb && record.dynamodb.Keys) {
        let datatype: string | undefined = '';

        if (record.eventName === 'INSERT') {
          datatype = record.dynamodb.NewImage?.datatype?.S;

          if (!datatype) return undefined;

          switch (datatype) {
            case 'brand':
              await handle_brand_creation({ item: record.dynamodb });
              break;
            case 'brand-campaign':
              await handle_campaign_creation({ item: record.dynamodb });
              break;
            case 'brand-product':
              await handle_product_creation({ item: record.dynamodb });
              break;
            case 'brand-product-group':
              await handle_product_group_creation({ item: record.dynamodb });
              break;
            case 'brand-product-to-product-group':
              await handle_product_to_product_group_association({
                item: record.dynamodb,
              });
              break;
            case 'brand-product-group-to-campaign':
              await handle_product_group_to_campaign_association({
                item: record.dynamodb,
              });
              break;
            case 'brand-campaign-to-landing-page':
              await handle_campaign_to_landing_page_association({
                item: record.dynamodb,
              });
              break;
            case 'brand-product-attributes':
              await handle_product_attributes_creation({
                item: record.dynamodb,
              });
              break;
            case 'brand-product-components':
              await handle_product_components_creation({
                item: record.dynamodb,
              });
              break;
            case 'brand-landing-page':
              await handle_landing_page_creation({ item: record.dynamodb });
              break;
            case 'campaign-event':
              await handle_campaign_event_creation({ item: record.dynamodb });
              break;
            default:
              break;
          }
        } else if (record.eventName === 'REMOVE') {
          datatype = record.dynamodb.OldImage?.datatype?.S;

          if (!datatype) return undefined;

          switch (datatype) {
            case 'brand-campaign':
              await handle_campaign_deletion({ item: record.dynamodb });
              break;
            case 'brand-product':
              await handle_product_deletion({ item: record.dynamodb });
              break;
            case 'brand-product-group':
              await handle_product_group_deletion({ item: record.dynamodb });
              break;
            case 'brand-product-to-product-group':
              await handle_product_to_product_group_dissociation({
                item: record.dynamodb,
              });
              break;
            case 'brand-product-group-to-campaign':
              await handle_product_group_to_campaign_dissociation({
                item: record.dynamodb,
              });
              break;
            case 'brand-campaign-to-landing-page':
              await handle_campaign_to_landing_page_dissociation({
                item: record.dynamodb,
              });
              break;
            case 'brand':
              await handle_brand_deletion({ item: record.dynamodb });
              break;
            case 'printer':
              await handle_printer_deletion({ item: record.dynamodb });
              break;
            case 'mrf':
              await handle_mrf_deletion({ item: record.dynamodb });
              break;
            case 'brand-landing-page':
              await handle_landing_page_deletion({ item: record.dynamodb });
              break;

            default:
              break;
          }
        } else if (record.eventName === 'MODIFY') {
          datatype = record.dynamodb.OldImage?.datatype?.S;

          if (!datatype) return undefined;

          switch (datatype) {
            case 'brand':
              await handle_brand_modify({ item: record.dynamodb });
              break;

            case 'brand-campaign':
              await handle_campaign_modify({ item: record.dynamodb });
              break;
            case 'brand-product':
              await handle_product_modify({ item: record.dynamodb });
              break;
            case 'brand-landing-page':
              await handle_landing_page_modify({ item: record.dynamodb });
              break;
            case 'brand-product-group':
              await handle_product_group_modify({ item: record.dynamodb });
              break;
            case 'brand-product-attributes':
              await handle_product_attributes_modify({ item: record.dynamodb });
              break;
            case 'brand-product-components':
              await handle_product_components_modify({ item: record.dynamodb });
              break;

            default:
              break;
          }
        } else {
          // nothing
        }
      }
    }

    return undefined;
  } catch (err) {
    console.error(err);
    console.info('Failure: ', sequence_number);

    return { batchItemFailures: [{ itemIdentifier: sequence_number }] };
  }
};
