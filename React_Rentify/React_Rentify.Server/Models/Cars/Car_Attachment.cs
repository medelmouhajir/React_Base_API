namespace React_Rentify.Server.Models.Cars
{
    public class Car_Attachment
    {
        public Guid Id { get; set; }

        /// <summary>
        /// Original filename (e.g. “registration.pdf”).
        /// </summary>
        public string FileName { get; set; }

        /// <summary>
        /// Path or URL where the file is stored (e.g. “/uploads/agency/4/doc123.pdf”).
        /// </summary>
        public string FilePath { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;


        public Guid? CarId { get; set; }
        public virtual Car? Car { get; set; }
    }
}
