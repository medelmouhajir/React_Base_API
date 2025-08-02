namespace React_Virtuello.Server.Models.Icons
{
    public class Icon_Category
    {
        public Guid Id { get; set; }
        public string Name { get; set; }

        public virtual ICollection<Icon>? Icons { get; set; }
    }
}
