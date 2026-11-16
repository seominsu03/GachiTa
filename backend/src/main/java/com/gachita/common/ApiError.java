package com.gachita.common;

public record ApiError(boolean success, ErrorDetail error) {
    public static ApiError of(String code, String message) {
        return new ApiError(false, new ErrorDetail(code, message));
    }
    public record ErrorDetail(String code, String message) {}
}
