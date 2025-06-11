using React_Mangati.Server.Models.Series;

namespace React_Mangati.Server.Models.Studio.Uploads
{
    public class Serie_Upload
    {
        public Guid Id { get; set; }

        public string Path { get; set; }

        public DateTime Date_Uploaded { get; set; }

        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }
    }
}
