using React_Virtuello.Server.Models.Entities;

namespace React_Virtuello.Server.Models.Icons
{
    public class Icon_Category : BaseEntity
    {
        public string Name { get; set; }

        public virtual ICollection<Icon>? Icons { get; set; }
    }
}
