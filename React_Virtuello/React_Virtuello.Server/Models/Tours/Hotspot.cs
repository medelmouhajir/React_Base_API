namespace React_Virtuello.Server.Models.Tours
{
    public class Hotspot
    {
        public int Id { get; set; }
        public string Type { get; set; } // e.g., 'info', 'youtube', 'image', 'website'
        public string? Text { get; set; }
        public string? Message { get; set; }


        public Position Position { get; set; } // { x, y, z }
        public int? TargetSceneId { get; set; }

        public string? Icon { get; set; }
        public int IconHeight { get; set; } = 150;
        public int IconWidth { get; set; } = 150;
        public string IconEffect { get; set; } = "RollUp"; // e.g., 'RollUp', 'Glow', 'Turning'
        public string Rotation_mode { get; set; } = "none"; // e.g., 'none', 'floor', 'wall'
        public int IconColor { get; set; } = 0xffffff;

        public string? ImagePath { get; set; }
        public string? InnerHtml { get; set; }
        public string? YoutubeVideoId { get; set; }
        public string? WebsiteUrl { get; set; }


        public int SceneId { get; set; }
        //public Scene? Scene { get; set; }
    }
}
