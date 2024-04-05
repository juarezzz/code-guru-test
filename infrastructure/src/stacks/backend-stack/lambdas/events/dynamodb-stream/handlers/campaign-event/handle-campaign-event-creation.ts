/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

/* ---------- Modules ---------- */
import { CampaignFormEvent } from '_modules/campaign-events/models';
import { increment_form_events_count } from '_modules/campaigns/functions/update/increment-form-event-count';

export const handle_campaign_event_creation = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { NewImage } = item;

    if (!NewImage) return;

    const campaign_event = DynamoDB.Converter.unmarshall(
      NewImage,
    ) as CampaignFormEvent;

    const { partition_key, sort_key } = campaign_event;

    const brand_id = partition_key.replace('brand#', '');
    const campaign_id = sort_key.split('#')[1];

    if (!brand_id || !campaign_id) return;

    const campaign_sort_key = `brand-campaign#${campaign_id}`;

    if (sort_key.includes('#form-event'))
      await increment_form_events_count({
        brand_id,
        campaign_sort_key,
        value: 1,
      });
  } catch (err) {
    console.log('handle_campaign_event_creation error: ', err);
  }
};
