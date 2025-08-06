namespace React_Virtuello.Server.ReponseDTOs
{
    public class PagedResponse<T> : ApiResponse<IEnumerable<T>>
    {
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public int TotalCount { get; set; }
    }
}
