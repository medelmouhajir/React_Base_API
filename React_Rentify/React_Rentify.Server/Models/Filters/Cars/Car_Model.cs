using React_Rentify.Server.Models.Cars;

namespace React_Rentify.Server.Models.Filters.Cars
{
    public class Car_Model
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public string ManufacturerId { get; set; }
        public virtual Manufacturer? Manufacturer { get; set; }

        // Navigation: all cars of this model
        public virtual ICollection<Car>? Cars { get; set; }
    }
}
