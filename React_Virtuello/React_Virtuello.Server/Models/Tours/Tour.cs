using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Models.Entities;
using React_Virtuello.Server.Models.Users;
using System.ComponentModel;

namespace React_Virtuello.Server.Models.Tours
{
    public class Tour : BaseEntity
    {
        public string Name { get; set; }

        public string? Description { get; set; }


        public string? Image_Path { get; set; }


        [DefaultValue(false)]
        public bool IsAutoRotating { get; set; }
        [DefaultValue(1.5)]
        public float AutoRotateSpeed { get; set; }

        [DefaultValue(true)]
        public bool HdQualityEnabled { get; set; }

        [DefaultValue(false)]
        public bool MusicControls { get; set; }
        [DefaultValue(true)]
        public bool FullscreenToggle { get; set; }
        [DefaultValue(true)]
        public bool AnimateToggleButton { get; set; }
        [DefaultValue(true)]
        public bool ScenesGallery { get; set; }

        [DefaultValue(150)]
        public int DefaultIconHeight { get; set; }
        [DefaultValue(150)]
        public int DefaultIconWidth { get; set; }

        [DefaultValue("none")]
        public string? EnablePreloadScenes { get; set; }


        public string? OwnerId { get; set; }
        public virtual User? Owner { get; set; }

        public virtual ICollection<Scene>? Scenes { get; set; }
    }
}
