using React_Mangati.Server.Models.Series;
using React_Mangati.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Mangati.Server.Models.Viewer
{
    public class Reading_Settings
    {
        [Key]
        public int Id { get; set; }


        public string UserId { get; set; }
        public virtual User? User { get; set; }

        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }


        public Theme_Mode Theme { get; set; }            // Light, Dark
        public Reading_Mode Reading_Mode { get; set; }    // PageFlip, VerticalScroll
        public bool FitToWidth { get; set; }
    }


    public enum Theme_Mode
    {
        Light = 0,
        Dark = 1,
    }

    public enum Reading_Mode
    {
        PageFlip = 0,
        VerticalScroll = 1,
        HorizontalScroll = 2,

    }
}
