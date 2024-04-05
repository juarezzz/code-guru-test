/* ----------
 * Amazon imports
 * ---------- */
package com.amazonaws.services.timestream;

import com.amazonaws.services.timestreamwrite.model.MeasureValueType;

/* ----------
 * Java imports
 * ---------- */
import java.util.HashMap;
import java.util.Map;

public class TimestreamPoint {
    private final Map<String, String> dimensions;

    private long time;

    private MeasureValueType measure_value_type;

    private String measure_name;
    private String measure_value;
    private String time_unit;

    public TimestreamPoint() {
      this.dimensions = new HashMap<>();
    }

    public TimestreamPoint(
      TimestreamPoint another_point,
      String measure_name,
      String measure_value,
      MeasureValueType measure_value_type
    ) {
        this.dimensions = new HashMap<>(another_point.dimensions);
        this.measure_name = measure_name;
        this.measure_value = measure_value;
        this.measure_value_type = measure_value_type;
        this.time = another_point.time;
        this.time_unit = another_point.time_unit;
    }

    public String getMeasureName() {
        return measure_name;
    }

    public String getMeasureValue() {
        return measure_value;
    }

    public MeasureValueType getMeasureValueType() {
        return measure_value_type;
    }

    public long getTime() {
        return time;
    }

    public void setTime(long time) {
        this.time = time;
    }

    public String getTimeUnit() {
        return time_unit;
    }

    public void setTimeUnit(String time_unit) {
        this.time_unit = time_unit;
    }

    public Map<String, String> getDimensions() {
        return dimensions;
    }

    public void addDimension(String dimension_name, String dimension_value) {
        dimensions.put(dimension_name, dimension_value);
    }
}
