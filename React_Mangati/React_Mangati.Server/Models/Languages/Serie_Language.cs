using React_Mangati.Server.Models.Series;
using System.ComponentModel.DataAnnotations;

namespace React_Mangati.Server.Models.Languages
{
    public class Serie_Language
    {
        [Key]
        public int Id { get; set; }


        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }

        public int LanguageId { get; set; }
        public virtual Language? Language { get; set; }
    }
}
