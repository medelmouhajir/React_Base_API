using React_Mangati.Server.Models.Series;
using React_Mangati.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Mangati.Server.Models.Favorites
{
    public class UserFavorite
    {
        [Key]
        public int Id { get; set; }
        public string UserId { get; set; }
        public virtual User? User { get; set; }

        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }

        public DateTime AddedAt { get; set; }
    }
}
