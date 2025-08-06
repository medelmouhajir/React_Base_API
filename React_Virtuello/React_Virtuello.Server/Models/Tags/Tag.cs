using React_Virtuello.Server.Models.Entities;

namespace React_Virtuello.Server.Models.Tags
{
    public class Tag : BaseEntity
    {
        public string Name { get; set; }

        public string? IconPath { get; set; }

        public List<Business_Tag>? Businesses { get; set; }
    }
}
