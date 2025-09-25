using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;

namespace React_Rentify.Server.Controllers.ThirdParties
{
    [ApiController]
    [Route("api/[controller]")]
    public class SkyscannerController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<CarsController> _logger;

        public SkyscannerController(MainDbContext context, ILogger<CarsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("cars/{agencyId:guid}")]
        public IActionResult GetCars(Guid agencyId)
        {
            var cars = _context.Cars
                .Include(x=> x.Car_Model)
                .ThenInclude(x=> x.Manufacturer)
                .Include(x=> x.Car_YearId)
                .Where(x=> x.AgencyId == agencyId)
                .Select(c => new {
                    id = c.Id,
                    make = c.Car_Model.Manufacturer.Name,
                    model = c.Car_Model.Name,
                    category = "",
                    transmission = "",
                    doors = 4,
                    seats = 5,
                    air_conditioning = true,
                    price_per_day = c.DailyRate,
                    currency = "MAD",
                    //pickup_location = new
                    //{
                    //    id = c.Location.Code,
                    //    name = c.Location.Name,
                    //    latitude = c.Location.Latitude,
                    //    longitude = c.Location.Longitude
                    //},
                    availability = c.IsAvailable,
                    images = "",
                    fuel_policy = "FULL_TO_FULL"
                });

            return Ok(new
            {
                cars,
                last_updated = DateTime.UtcNow
            });
        }
    }
}
