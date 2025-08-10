namespace React_Virtuello.Server.DTOs.Common
{
    public class FileUploadResult
    {
        public bool Success { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}