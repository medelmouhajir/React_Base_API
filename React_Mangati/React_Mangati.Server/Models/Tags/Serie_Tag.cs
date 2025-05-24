using React_Mangati.Server.Models.Series;
using System.ComponentModel.DataAnnotations;

namespace React_Mangati.Server.Models.Tags
{
    public class Serie_Tag
    {
        [Key]
        public int Id { get; set; }

        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }

        public int TagId { get; set; }
        public virtual Tag? Tag { get; set; }
    }
}
