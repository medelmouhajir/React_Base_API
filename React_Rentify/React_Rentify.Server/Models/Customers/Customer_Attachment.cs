
namespace React_Rentify.Server.Models.Customers
{
    public class Customer_Attachment
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

        // Polymorphic link: only ONE of these should be non-null.

        public Guid? CustomerId { get; set; }
        public virtual Customer? Customer { get; set; }

    }
}
