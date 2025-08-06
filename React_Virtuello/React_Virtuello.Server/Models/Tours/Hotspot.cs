using React_Virtuello.Server.Models.Entities;

namespace React_Virtuello.Server.Models.Tours
{
    public class Hotspot : BaseEntity
    {
        public HotspotType Type { get; set; }
        public string? Text { get; set; }
        public string? Message { get; set; }


        public virtual Position? Position { get; set; } // { x, y, z }
        public Guid? TargetSceneId { get; set; }

        public string? Icon { get; set; }
        public int IconHeight { get; set; } = 150;
        public int IconWidth { get; set; } = 150;
        public IconEffect IconEffect { get; set; }
        public RotationMode RotationMode { get; set; }
        public int IconColor { get; set; } = 0xffffff;

        public string? ImagePath { get; set; }
        public string? InnerHtml { get; set; }
        public string? YoutubeVideoId { get; set; }
        public string? WebsiteUrl { get; set; }


        public Guid SceneId { get; set; }
        public Scene? Scene { get; set; }
    }
    public enum HotspotType
    {
        Info = 0,
        Youtube = 1,
        Image = 2,
        Website = 3,
        Navigation = 4
    }
    public enum RotationMode
    {
        None = 0,
        Floor = 1,
        Wall = 2
    }
    public enum IconEffect
    {
        None = 0,
        RollUp = 1,
        Glow = 2,
        Turning = 3
    }
}
