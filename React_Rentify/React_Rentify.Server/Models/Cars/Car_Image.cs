namespace React_Rentify.Server.Models.Cars
{
    public class Car_Image
    {
        public Guid Id { get; set; }

        public string Path { get; set; }

        public bool IsMainImage { get; set; }


        public Guid? CarId { get; set; }
        public virtual Car? Car { get; set; }
    }
}
