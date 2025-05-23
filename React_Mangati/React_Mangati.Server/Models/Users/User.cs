﻿using Microsoft.AspNetCore.Identity;
using React_Mangati.Server.Models.Favorites;
using React_Mangati.Server.Models.Series;

namespace React_Mangati.Server.Models.Users
{
    public class User : IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? Address { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Role { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;


        public virtual ICollection<Serie>? Series { get; set; }
        public virtual ICollection<UserFavorite>? UserFavorites { get; set; }
    }
}
