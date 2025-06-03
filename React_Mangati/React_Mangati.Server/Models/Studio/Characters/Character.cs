
using React_Mangati.Server.Models.Series;
using React_Mangati.Server.Models.Studio.Characters.Groups;

namespace React_Mangati.Server.Models.Studio.Characters
{
    public class Character
    {
        public Guid Id { get; set; }
        public string Name { get; set; }

        public string Description { get; set; }

        public int Height { get; set; }
        public int Weight { get; set; }

        public Guid? Characters_GroupId { get; set; }
        public virtual Characters_Group? Characters_Group { get; set; }

        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }

        public virtual ICollection<Character_Image>? Character_Images { get; set; }
    }
}
