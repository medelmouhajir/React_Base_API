using React_Virtuello.Server.Models.Businesses;

namespace React_Virtuello.Server.Models.Attachments
{
    public class BusinessAttachment : Attachment
    {
        public Guid BusinessId { get; set; }
        public virtual Business? Business { get; set; }
    }
}
