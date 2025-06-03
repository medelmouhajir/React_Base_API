using React_Rentify.Server.Models.Cars;

namespace React_Rentify.Server.Models.Filters.Cars
{
    public class Car_Year
    {
        public int Id { get; set; }
        /// <summary>
        /// Four-digit year (e.g. 2022, 2023).
        /// </summary>
        public int YearValue { get; set; }

        // Navigation: all cars manufactured in this year
        public virtual ICollection<Car>? Cars { get; set; }
    }
}
