using React_Virtuello.Server.Models.Entities;

namespace React_Virtuello.Server.Models.Icons
{
    public class Icon : BaseEntity
    {
        public string Name { get; set; }

        public string Path { get; set; }

        public Guid Icon_CategoryId { get; set; }
        public virtual Icon_Category? Icon_Category { get; set; }
    }
}
