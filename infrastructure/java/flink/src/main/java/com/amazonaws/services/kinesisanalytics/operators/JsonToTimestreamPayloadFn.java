/* ----------
 * Amazon imports
 * ---------- */
package com.amazonaws.services.kinesisanalytics.operators;

import com.amazonaws.services.timestream.TimestreamPoint;
import com.amazonaws.services.timestreamwrite.model.MeasureValueType;

/* ----------
 * Google imports
 * ---------- */
import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;

/* ----------
 * Flink imports
 * ---------- */
import org.apache.flink.api.common.functions.RichMapFunction;

/* ----------
 * Logs imports
 * ---------- */
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/* ----------
 * Java imports
 * ---------- */
import java.util.*;
import java.util.stream.Collectors;

public class JsonToTimestreamPayloadFn extends RichMapFunction<String, Collection<TimestreamPoint>> {
    private static final Logger logger = LoggerFactory.getLogger(JsonToTimestreamPayloadFn.class);

    private static final String MILLISECONDS = "MILLISECONDS";

    @Override
    public Collection<TimestreamPoint> map(String incoming_data_json) {
        logger.info("xINFOx xJsonToTimestreamPayloadx Data received: {}", incoming_data_json);

        boolean default_mapping = true;

        HashMap<String, String> map = new Gson()
            .fromJson(
              incoming_data_json,
              new TypeToken<HashMap<String, String>>() {}.getType()
            );

        TimestreamPoint base_point = new TimestreamPoint();

        logger.info("xINFOx xJsonToTimestreamPayloadx Data received <map> {}", map);

        Map<String, String> measures = new HashMap<>(map.size());

        try{
          if(map.containsKey("data_type") ) {
            String data_type = map.get("data_type");
            Date date = new Date();

            long milliseconds = date.getTime();

            if(data_type.equals("mrf_scans") ) {
              default_mapping = false;

              measures.put("count_measure", map.get("count"));

              base_point.setTime(milliseconds);
              base_point.setTimeUnit(MILLISECONDS);
              
              base_point.addDimension("mrf_id", map.get("mrf_id"));
              base_point.addDimension("gtin", map.get("gtin"));
              base_point.addDimension("data_type", "mrf_scans");
            }

            if(data_type.equals("label_scan")) {
              default_mapping = false;

              measures.put("label_measure", map.get("request_id"));

              if(map.get("received_at") != null) {
                milliseconds = Long.parseLong(map.get("received_at"));
              }

              base_point.setTime(milliseconds);
              base_point.setTimeUnit(MILLISECONDS);

              base_point.addDimension("city", map.get("city"));
              base_point.addDimension("country", map.get("country"));
              base_point.addDimension("ip", map.get("ip"));
              base_point.addDimension("latitude", map.get("latitude"));
              base_point.addDimension("longitude", map.get("longitude"));
              base_point.addDimension("postal_code", map.get("postal_code"));
              base_point.addDimension("time_spent_away", "0");
              base_point.addDimension("time_zone", map.get("time_zone"));
              base_point.addDimension("data_type", "label_scan");

              if(map.get("is_ios").equals("true")) {
                base_point.addDimension("phone_os", "ios");
              } else {
                base_point.addDimension("phone_os", "android");
              }
            }

            if(data_type.equals("label_scan_ping")) {
              default_mapping = false;

              measures.put("label_measure", map.get("request_id"));

              if(map.get("received_at") != null) {
                milliseconds = Long.parseLong(map.get("received_at"));
              }

              base_point.setTime(milliseconds);
              base_point.setTimeUnit(MILLISECONDS);
              base_point.addDimension("time_spent_away", map.get("time_spent_away"));
              base_point.addDimension("data_type", "label_scan_ping");
            }

            if(data_type.equals("label_scan_navigator")) {
              default_mapping = false;

              measures.put("label_measure", map.get("request_id"));

              if(map.get("received_at") != null) {
                milliseconds = Long.parseLong(map.get("received_at"));
              }

              base_point.setTime(milliseconds);
              base_point.setTimeUnit(MILLISECONDS);

              base_point.addDimension("data_type", "label_scan_navigator");

              String gtin = map.get("gtin");
              String hardware_concurrency = map.get("hardware_concurrency");
              String languages = map.get("languages");
              String max_touch_points = map.get("max_touch_points");
              String phone_current_language = map.get("phone_current_language");
              String screen_size = map.get("screen_size");
              String time_spent_away = map.get("time_spent_away");
              String user_agent = map.get("user_agent");

              String campaign_id = map.get("campaign_id");
              String landing_page_id = map.get("landing_page_id");
              String product_group_id = map.get("product_group_id");

              if(!product_group_id.equals("")) {
                base_point.addDimension("product_group_id", product_group_id);
              }

              if(!campaign_id.equals("")) {
                base_point.addDimension("campaign_id", campaign_id);
              }

              if(!landing_page_id.equals("")) {
                base_point.addDimension("landing_page_id", landing_page_id);
              }

              if(!hardware_concurrency.equals("")) {
                base_point.addDimension("hardware_concurrency", hardware_concurrency);
              }

              if(!max_touch_points.equals("")) {
                base_point.addDimension("max_touch_points", max_touch_points);
              }

              if(!user_agent.equals("")) {
                base_point.addDimension("user_agent", user_agent);
              }

              if(!phone_current_language.equals("")) {
                base_point.addDimension("phone_current_language", phone_current_language);
              }

              if(!gtin.equals("")) {
                base_point.addDimension("gtin", gtin);
              }

              if(!time_spent_away.equals("")) {
                base_point.addDimension("time_spent_away", time_spent_away);
              }

              if(!languages.equals("")) {
                base_point.addDimension("languages", languages);
              }

              if(!screen_size.equals("")) {
                base_point.addDimension("screen_size", screen_size);
              }
            }
          }
        } catch (Exception err) {
          logger.error("xERRORx xJsonToTimestreamPayloadx: {}", err.getMessage());

          default_mapping = true;
        }

        if(default_mapping) {
            for (Map.Entry<String, String> entry : map.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue();

                if (key.toLowerCase().endsWith("_measure")) {
                    measures.put(key, value);

                    continue;
                }

                switch (key.toLowerCase()) {
                    case "time":
                        base_point.setTime(Long.parseLong(value));
                        break;
                    case "timeunit":
                        base_point.setTimeUnit(value);
                        break;
                    default:
                        base_point.addDimension(key, value);
                }
            }
        }

        logger.info("xINFOx xJsonToTimestreamPayloadx base_point {}", base_point);

        return measures
            .entrySet()
            .stream()
            .map(measure -> new TimestreamPoint(
              base_point,
              measure.getKey(),
              measure.getValue(),
              MeasureValueType.VARCHAR)
            )
            .collect(Collectors.toList());
    }
}
