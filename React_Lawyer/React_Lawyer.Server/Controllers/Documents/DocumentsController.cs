using Microsoft.AspNetCore.Mvc;

namespace React_Lawyer.Server.Controllers.Documents
{
    public class DocumentsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
