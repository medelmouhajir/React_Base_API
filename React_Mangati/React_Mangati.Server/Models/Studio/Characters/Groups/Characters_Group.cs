using React_Mangati.Server.Models.Series;

namespace React_Mangati.Server.Models.Studio.Characters.Groups
{
    public class Characters_Group
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }


        public virtual ICollection<Character>? Characters { get; set; }
    }
}
