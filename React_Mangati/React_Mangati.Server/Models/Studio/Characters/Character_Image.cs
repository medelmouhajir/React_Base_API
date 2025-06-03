using System.ComponentModel;

namespace React_Mangati.Server.Models.Studio.Characters
{
    public class Character_Image
    {
        public Guid Id { get; set; }
        public string Title { get; set; }

        public string Image_Path { get; set; }

        [DefaultValue(false)]
        public bool Is_Main { get; set; }

        public Guid CharacterId { get; set; }
        public virtual Character? Character { get; set; }

    }
}
