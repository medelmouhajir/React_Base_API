using React_Mangati.Server.Models.Series;
using React_Mangati.Server.Models.Studio.Places.Goups;

namespace React_Mangati.Server.Models.Studio.Places
{
    public class Place_Scene
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }


        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }

        public Guid? Places_GroupId { get; set; }
        public virtual Places_Group? Places_Group { get; set; }


        public virtual ICollection<Place_Scene_Image>? Place_Scene_Images { get; set; }
    }
}
