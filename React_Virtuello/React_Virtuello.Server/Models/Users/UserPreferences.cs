using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Users
{
    public class UserPreferences
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
        public virtual User User { get; set; } = null!;

        public string Language { get; set; } = "en";
        public string Currency { get; set; } = "USD";
        public string Theme { get; set; } = "Light";
        public bool EmailNotifications { get; set; } = true;
        public bool PushNotifications { get; set; } = true;
    }
}
