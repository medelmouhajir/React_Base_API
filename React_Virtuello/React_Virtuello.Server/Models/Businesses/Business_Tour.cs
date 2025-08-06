using React_Virtuello.Server.Models.Tours;

namespace React_Virtuello.Server.Models.Businesses
{
    public class Business_Tour
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Name { get; set; }

        public Guid TourId { get; set; }
        public virtual Tour? Tour { get; set; }

        public Guid? BusinessId { get; set; }
        public virtual Business? Business { get; set; }
    }
}
