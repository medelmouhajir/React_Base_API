using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Models.Entities;

namespace React_Virtuello.Server.Models.Tags
{
    public class Business_Tag : BaseEntity
    {
        public Guid BusinessId { get; set; }
        public virtual Business? Business { get; set; }

        public Guid TagId { get; set; }
        public virtual Tag? Tag { get; set; }
    }
}
