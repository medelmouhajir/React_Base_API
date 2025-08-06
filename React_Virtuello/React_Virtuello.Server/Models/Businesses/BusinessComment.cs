using React_Virtuello.Server.Models.Entities;
using React_Virtuello.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Businesses
{
    public class BusinessComment : CommentEntity<Business>
    {
        public Guid BusinessId { get; set; }
        public virtual Business Business { get; set; } = null!;
    }
}
