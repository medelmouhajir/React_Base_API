using React_Mangati.Server.Models.Series;

namespace React_Mangati.Server.Models.Studio.Generations
{
    public class Image_Generation
    {
        public Guid Id { get; set; }

        public DateTime Date_Created { get; set; }

        public DateTime? Date_Completed { get; set; }

        public string Prompt { get; set; }

        public string? Result_Path { get; set; }

        public int Tokens { get; set; } = 0;


        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }


        public virtual ICollection<Image_Generation_Reference>? Image_Generation_References { get; set; }

    }

    public class Image_Generation_Reference
    {
        public Guid Id { get; set; }

        public Image_Generation_Reference_Type Type { get; set; }

        public int Extra_Id_1 { get; set; }

        public Guid Extra_Id_2 { get; set; }


        public Guid Image_GenerationId { get; set; }
        public virtual Image_Generation? Image_Generation { get; set; }

    }

    public enum Image_Generation_Reference_Type
    {
        Upload = 0,
        Character = 1,
        Scene = 2,
        Chapter = 3,
        Other = 10
    }
}
