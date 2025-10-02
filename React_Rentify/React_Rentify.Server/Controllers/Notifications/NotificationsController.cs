using Microsoft.AspNetCore.Mvc;

namespace React_Rentify.Server.Controllers.Notifications
{
    public class NotificationsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
