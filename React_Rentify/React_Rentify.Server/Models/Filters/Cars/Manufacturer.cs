namespace React_Rentify.Server.Models.Filters.Cars
{
    public class Manufacturer
    {
        public string Id { get; set; }
        public string Name { get; set; }

        // Navigation: all models under this manufacturer
        public virtual ICollection<Car_Model>? Car_Models { get; set; }
    }

}
