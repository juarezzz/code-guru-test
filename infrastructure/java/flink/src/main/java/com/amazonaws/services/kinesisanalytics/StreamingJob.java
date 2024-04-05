/* ----------
 * Amazon imports
 * ---------- */
package com.amazonaws.services.kinesisanalytics;

import com.amazonaws.services.kinesisanalytics.operators.JsonToTimestreamPayloadFn;
import com.amazonaws.services.kinesisanalytics.operators.OffsetFutureTimestreamPoints;
import com.amazonaws.services.kinesisanalytics.utils.ParameterToolUtils;
import com.amazonaws.services.timestream.TimestreamSink;

/* ----------
 * Flink imports
 * ---------- */
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.java.utils.ParameterTool;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kinesis.config.AWSConfigConstants;
import org.apache.flink.streaming.connectors.kinesis.config.ConsumerConfigConstants;
import org.apache.flink.streaming.connectors.kinesis.FlinkKinesisConsumer;

/* ----------
 * Java imports
 * ---------- */
import java.util.Properties;

public class StreamingJob {
    private static final String DEFAULT_STREAM_NAME = "Analytics-DataStream-DEV";
    private static final String DEFAULT_REGION_NAME = "eu-west-1";
    private static final String DEFAULT_DB_NAME = "Polytag-DEV";
    private static final String DEFAULT_TABLE_NAME = "Polytag-DEV";

    public static DataStream<String> createKinesisSource(StreamExecutionEnvironment env, ParameterTool parameter) {
        Properties kinesis_consumer_configuration = new Properties();
        String adaptative_read_settings_string =
            parameter.get("SHARD_USE_ADAPTIVE_READS", "false");


        kinesis_consumer_configuration
            .setProperty(
                AWSConfigConstants.AWS_REGION,
                parameter.get("Region", DEFAULT_REGION_NAME));

        kinesis_consumer_configuration
            .setProperty(AWSConfigConstants.AWS_CREDENTIALS_PROVIDER, "AUTO");


        if (adaptative_read_settings_string.equals("true")) {
            kinesis_consumer_configuration
                .setProperty(ConsumerConfigConstants.SHARD_USE_ADAPTIVE_READS, "true");
        } else {
            kinesis_consumer_configuration
                .setProperty(
                    ConsumerConfigConstants.SHARD_GETRECORDS_INTERVAL_MILLIS,
                    parameter.get("SHARD_GETRECORDS_INTERVAL_MILLIS", "1000"));

            kinesis_consumer_configuration
                .setProperty(
                    ConsumerConfigConstants.SHARD_GETRECORDS_MAX,
                    parameter.get("SHARD_GETRECORDS_MAX", "10000"));
        }

        return env
            .addSource(
                new FlinkKinesisConsumer<>(
                    parameter.get("stream_name", DEFAULT_STREAM_NAME),
                    new SimpleStringSchema(),
                    kinesis_consumer_configuration
                )
            )
            .name("KinesisSource")
            .rebalance();
    }

    public static void main(String[] args) throws Exception {
        final ParameterTool parameter = ParameterToolUtils.fromArgsAndApplicationProperties(args);

        final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        final String region = parameter.get("region", DEFAULT_REGION_NAME);
        final String database_name = parameter.get("timestream_database_name", DEFAULT_DB_NAME);
        final String table_name = parameter.get("timestream_table_name", DEFAULT_TABLE_NAME);
        final int batch_size = Integer.parseInt(parameter.get("timestream_ingest_batch_size", "75"));

        env.getConfig().setAutoWatermarkInterval(1000L);

        createKinesisSource(env, parameter)
            .map(new JsonToTimestreamPayloadFn())
            .name("MapToTimestreamPayload")
            .process(new OffsetFutureTimestreamPoints())
            .name("UpdateFutureOffsetTimestreamPoints")
            .addSink(new TimestreamSink(region, database_name, table_name, batch_size))
            .name("TimeSeries<" + database_name + ", " + table_name + ">");

        env.execute("Polytag Analytics Streaming API");
    }
}
