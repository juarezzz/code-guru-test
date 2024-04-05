/* ----------
 * Amazon imports
 * ---------- */
package com.amazonaws.services.kinesisanalytics.operators;

import com.amazonaws.services.timestream.TimestreamPoint;

/* ----------
 * Flink imports
 * ---------- */
import org.apache.flink.streaming.api.functions.ProcessFunction;
import org.apache.flink.util.Collector;
import org.jetbrains.annotations.NotNull;

/* ----------
 * Java imports
 * ---------- */
import java.util.Collection;
import java.util.concurrent.TimeUnit;

public class OffsetFutureTimestreamPoints extends ProcessFunction<Collection<TimestreamPoint>, Collection<TimestreamPoint>> {
    private static final long TIMESTREAM_FUTURE_THRESHOLD = TimeUnit.MINUTES.toMillis(15);

    @Override
    public void processElement(
      @NotNull Collection<TimestreamPoint> timestream_points,
      Context context,
      @NotNull Collector<Collection<TimestreamPoint>> collector
    ) {
        timestream_points
            .stream()
            .filter(p -> timestream_point_timestamp(p) > System.currentTimeMillis() + TIMESTREAM_FUTURE_THRESHOLD)
            .forEach(p -> {
                      p.setTime(context.timestamp());
                      p.setTimeUnit(TimeUnit.MILLISECONDS.name());
                  });
                  
          collector.collect(timestream_points);
    }

    private long timestream_point_timestamp(TimestreamPoint point) {
        String time_unit = TimeUnit.MILLISECONDS.name();

        if (
            "MILLISECONDS".equals(point.getTimeUnit()) ||
            "SECONDS".equals(point.getTimeUnit()) ||
            "MICROSECONDS".equals(point.getTimeUnit()) ||
            "NANOSECONDS".equals(point.getTimeUnit())
        ) {
            time_unit = point.getTimeUnit();
        }

        return TimeUnit.valueOf(time_unit).toMillis(point.getTime());
    }
}
