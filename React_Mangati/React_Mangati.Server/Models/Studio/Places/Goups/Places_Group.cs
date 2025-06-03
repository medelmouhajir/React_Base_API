using React_Mangati.Server.Models.Series;

namespace React_Mangati.Server.Models.Studio.Places.Goups
{
    public class Places_Group
    {
        public Guid Id { get; set; }
        public string Name { get; set; }


        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }

        public virtual ICollection<Place_Scene>? Place_Scenes { get; set; }
    }
}
