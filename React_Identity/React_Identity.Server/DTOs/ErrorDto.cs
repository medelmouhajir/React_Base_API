namespace React_Identity.Server.DTOs
{
    public class ErrorResponseDto
    {
        public string ErrorCode { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? Details { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? TraceId { get; set; }
    }

    public class ValidationErrorDto : ErrorResponseDto
    {
        public Dictionary<string, string[]> ValidationErrors { get; set; } = new();
    }
}
