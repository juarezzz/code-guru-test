/* ----------
 * Amazon imports
 * ---------- */
package com.amazonaws.services.timestream;

import com.amazonaws.ClientConfiguration;
import com.amazonaws.services.timestreamwrite.AmazonTimestreamWrite;
import com.amazonaws.services.timestreamwrite.AmazonTimestreamWriteClientBuilder;
import com.amazonaws.services.timestreamwrite.model.*;

/* ----------
 * Apache imports
 * ---------- */
import org.apache.flink.api.common.state.ListState;
import org.apache.flink.api.common.state.ListStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.runtime.state.FunctionInitializationContext;
import org.apache.flink.runtime.state.FunctionSnapshotContext;
import org.apache.flink.streaming.api.checkpoint.CheckpointedFunction;
import org.apache.flink.streaming.api.functions.sink.RichSinkFunction;

/* ----------
 * Logs imports
 * ---------- */
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/* ----------
 * Java imports
 * ---------- */
import java.util.ArrayList;
import java.util.Collection;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.List;
import java.util.stream.Collectors;

public class TimestreamSink extends RichSinkFunction<Collection<TimestreamPoint>> implements CheckpointedFunction {

    private final BlockingQueue records_already_buffered;
    
    private final Integer batch_size;

    private final String database_name;
    private final String region;
    private final String table_name;

    private static final Logger logger = LoggerFactory.getLogger(TimestreamSink.class);
    
    private static final long RECORDS_FLUSH_INTERVAL_MILLISECONDS = 60L * 1000L;

    private long empty_list_timestamp;

    private transient AmazonTimestreamWrite aws_timestream_write_client;
    
    private transient ListState current_checkpoint_state;

    public TimestreamSink(String region, String database_name, String table_name, int batch_size) {
        this.batch_size = batch_size;

        this.database_name = database_name;

        this.empty_list_timestamp = System.currentTimeMillis();

        this.records_already_buffered = new LinkedBlockingQueue();

        this.region = region;

        this.table_name = table_name;
    }

    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);

        final ClientConfiguration client_configuration = new ClientConfiguration()
                .withMaxConnections(5000)
                .withRequestTimeout(20 * 1000)
                .withMaxErrorRetry(10);

        this.aws_timestream_write_client = AmazonTimestreamWriteClientBuilder
                .standard()
                .withRegion(this.region)
                .withClientConfiguration(client_configuration)
                .build();
    }

    @Override
    public void invoke(Collection<TimestreamPoint> points, Context context) {
      records_already_buffered.addAll(createRecords(points));

        if (shouldPublish()) {
            while (!records_already_buffered.isEmpty()) {
                List<?> recordsToSend = new ArrayList<>(batch_size);
                records_already_buffered.drainTo(recordsToSend, batch_size);

                writeBatch(recordsToSend);
            }
        }
    }

    private void writeBatch(List records_to_send) {
        WriteRecordsRequest write_records_request = new WriteRecordsRequest()
                .withDatabaseName(this.database_name)
                .withTableName(this.table_name)
                .withRecords(records_to_send);

        try {
            WriteRecordsResult write_records_result = this.aws_timestream_write_client.writeRecords(write_records_request);

            logger.info("xINFOx xTimestreamSinkx <write_records_result/status_code> {}", write_records_result.getSdkHttpMetadata().getHttpStatusCode());

            empty_list_timestamp = System.currentTimeMillis();

        } catch (RejectedRecordsException error) {
            List<RejectedRecord> rejected_records = error.getRejectedRecords();

            logger.warn("xWARNx xTimestreamSinkx <rejected_records/size> {}", rejected_records.size());

            for (int i = rejected_records.size() - 1; i >= 0; i--) {
                logger.warn("xWARNx xTimestreamSinkx <rejected_record> {}", rejected_records.get(i));
                logger.warn("xWARNx xTimestreamSinkx <rejected_record/reason {}", rejected_records.get(i).getReason());
            }
        } catch (Exception e) {
            logger.error("xERRORx xTimestreamSinkx {}", e.getMessage(), e);
        }
    }

    private Collection createRecords(Collection<TimestreamPoint> points) {
        return points.stream()
                .map(point -> new com.amazonaws.services.timestreamwrite.model.Record()
                        .withDimensions(point.getDimensions().entrySet().stream()
                                .map(entry -> new Dimension()
                                        .withName(entry.getKey())
                                        .withValue(entry.getValue()))
                                .collect(Collectors.toList()))
                        .withMeasureName(point.getMeasureName())
                        .withMeasureValueType(point.getMeasureValueType())
                        .withMeasureValue(point.getMeasureValue())
                        .withTimeUnit(point.getTimeUnit())
                        .withTime(String.valueOf(point.getTime())))
                .collect(Collectors.toList());
    }

    private boolean shouldPublish() {
        if (records_already_buffered.size() >= batch_size) {
            logger.info("xINFOx xTimestreamSinkx <should_publish> Batch of size {} should get published", records_already_buffered.size());

            return true;
        } else if (System.currentTimeMillis() - empty_list_timestamp >= RECORDS_FLUSH_INTERVAL_MILLISECONDS) {
            logger.info("xINFOx xTimestreamSinkx <should_publish> Records after flush interval should get published");

            return true;
        } else {
            return false;
        }
    }

    @Override
    public void snapshotState(FunctionSnapshotContext functionSnapshotContext) throws Exception {
        current_checkpoint_state.clear();
        for (Object bufferedRecord : records_already_buffered) {
            current_checkpoint_state.add(bufferedRecord);
        }
    }

    @Override
    public void initializeState(FunctionInitializationContext functionInitializationContext) throws Exception {
        ListStateDescriptor<com.amazonaws.services.timestreamwrite.model.Record> descriptor = new ListStateDescriptor<>("recordList", com.amazonaws.services.timestreamwrite.model.Record.class);

        current_checkpoint_state = functionInitializationContext.getOperatorStateStore().getListState(descriptor);

        if (functionInitializationContext.isRestored()) {
          logger.info("xINFOx xTimestreamSinkx ", "InitializeState: Running from inside if statement.");

            /* for (com.amazonaws.services.timestreamwrite.model.Record element : checkPointedState.get()) {
                bufferedRecords.add(element);
            }*/
        }
    }
}
