using React_Virtuello.Server.Models.Businesses;

namespace React_Virtuello.Server.Models.Tags
{
    public class Business_Tag
    {
        public int Id { get; set; }

        public string BusinessId { get; set; }
        public virtual Business? Business { get; set; }

        public string TagId { get; set; }
        public virtual Tag? Tag { get; set; }
    }
}
