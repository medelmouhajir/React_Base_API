using React_Virtuello.Server.Models.Businesses;

namespace React_Virtuello.Server.Models.Tags
{
    public class Business_Tag
    {
        public int Guid { get; set; }

        public Guid BusinessId { get; set; }
        public virtual Business? Business { get; set; }

        public Guid TagId { get; set; }
        public virtual Tag? Tag { get; set; }
    }
}
