using React_Mangati.Server.Models.Series.Chapters;
using React_Mangati.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Mangati.Server.Models.Viewer
{
    public class Reading_Progress
    {
        [Key]
        public int Id { get; set; }


        public string UserId { get; set; }
        public virtual User? User { get; set; }

        public int ChapterId { get; set; }
        public virtual Chapter? Chapter { get; set; }

        public int LastReadPage { get; set; }
        public DateTime LastReadAt { get; set; }
    }
}
