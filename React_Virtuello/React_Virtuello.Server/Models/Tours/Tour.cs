using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Models.Entities;
using React_Virtuello.Server.Models.Users;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Tours
{
    public class Tour : AuditableEntity
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? ImagePath { get; set; }

        // Tour Settings
        public TourSettings Settings { get; set; } = new();

        // Relationships
        public string? OwnerId { get; set; }
        public virtual User? Owner { get; set; }

        // Navigation properties
        public virtual ICollection<Scene> Scenes { get; set; } = new List<Scene>();

        // Computed properties
        public int SceneCount => Scenes?.Count ?? 0;
        public Scene? DefaultScene => Scenes?.OrderBy(s => s.OrderIndex).FirstOrDefault();
    }

    // Value object for tour settings
    public class TourSettings
    {
        public bool IsAutoRotating { get; set; } = false;

        [Range(0.1, 10.0)]
        public float AutoRotateSpeed { get; set; } = 1.5f;

        public bool HdQualityEnabled { get; set; } = true;
        public bool MusicControls { get; set; } = false;
        public bool FullscreenToggle { get; set; } = true;
        public bool AnimateToggleButton { get; set; } = true;
        public bool ScenesGallery { get; set; } = true;

        [Range(50, 500)]
        public int DefaultIconHeight { get; set; } = 150;

        [Range(50, 500)]
        public int DefaultIconWidth { get; set; } = 150;

        [MaxLength(20)]
        public string EnablePreloadScenes { get; set; } = "none";
    }
}
