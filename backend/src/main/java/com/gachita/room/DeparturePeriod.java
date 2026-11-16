package com.gachita.room;

import com.gachita.common.ApiException;
import java.util.Locale;
import org.springframework.http.HttpStatus;

public enum DeparturePeriod {
    ALL(0, 24), MORNING(0, 12), AFTERNOON(12, 18), EVENING(18, 24);

    private final int startHour;
    private final int endHour;
    DeparturePeriod(int startHour, int endHour) { this.startHour = startHour; this.endHour = endHour; }
    public int startHour() { return startHour; }
    public int endHour() { return endHour; }
    public static DeparturePeriod parse(String period) {
        if (period == null || period.isBlank()) return ALL;
        try { return valueOf(period.strip().toUpperCase(Locale.ROOT)); }
        catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "시간대는 ALL, MORNING, AFTERNOON, EVENING 중 선택해 주세요.");
        }
    }
}
