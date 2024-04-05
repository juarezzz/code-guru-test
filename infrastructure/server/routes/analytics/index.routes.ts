import { product_stats } from '__server/routes/analytics/routes/product-stats.routes';
import { reach_average_time } from '__server/routes/analytics/routes/reach-average-time.routes';
import { reach_engagement_rate } from '__server/routes/analytics/routes/reach-engagement-rate.routes';
import { reach_landing_pages_open } from '__server/routes/analytics/routes/reach-landing-pages-open.routes';
import { reach_qr_scans_location } from '__server/routes/analytics/routes/reach-qr-scans-location.routes';
import { reach_qr_scans } from '__server/routes/analytics/routes/reach-qr-scans.routes';
import { reach_recent_activity } from '__server/routes/analytics/routes/reach-recent-activity.routes';
import { reach_top_campaigns } from '__server/routes/analytics/routes/reach-top-campaigns.routes';
import { reach_top_locations_by_usage_time } from '__server/routes/analytics/routes/reach-top-locations-by-usage-time.routes';
import { reach_top_products } from '__server/routes/analytics/routes/reach-top-products.routes';
import { reach_unique_users } from '__server/routes/analytics/routes/reach-unique-users.routes';
import { sustainability_location_mrfs } from '__server/routes/analytics/routes/sustainability-location-mrfs.routes';
import { sustainability_tags_printed } from '__server/routes/analytics/routes/sustainability-tags-printed.routes';
import { sustainability_uv_scans } from '__server/routes/analytics/routes/sustainability-uv-scans.routes';
import { sustainability_recent_activity } from '__server/routes/analytics/routes/sustainability-recent-activity.routes';
import { disposal_qr_scans } from '__server/routes/analytics/routes/disposal-qr-scans.routes';
import { disposal_top_campaigns } from '__server/routes/analytics/routes/disposal-top-campaigns.routes';
import { disposal_top_products } from '__server/routes/analytics/routes/disposal-top-products.routes';
import { disposal_top_locations } from '__server/routes/analytics/routes/disposal-top-locations.routes';
import { disposal_qr_scans_locations } from '__server/routes/analytics/routes/disposal-qr-scans-locations.routes';
import { disposal_recent_activity } from '__server/routes/analytics/routes/disposal-recent-activity.routes';

export const analytics_routes = [
  ...product_stats,
  ...reach_average_time,
  ...reach_engagement_rate,
  ...reach_landing_pages_open,
  ...reach_qr_scans_location,
  ...reach_qr_scans,
  ...reach_recent_activity,
  ...reach_top_campaigns,
  ...reach_top_locations_by_usage_time,
  ...reach_top_products,
  ...reach_unique_users,
  ...sustainability_location_mrfs,
  ...sustainability_tags_printed,
  ...sustainability_uv_scans,
  ...sustainability_recent_activity,
  ...disposal_qr_scans,
  ...disposal_top_campaigns,
  ...disposal_top_products,
  ...disposal_top_locations,
  ...disposal_qr_scans_locations,
  ...disposal_recent_activity,
];
