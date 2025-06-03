namespace React_Rentify.Server.Models.Agencies
{
    public class Agency_Attachment
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

        public Guid? AgencyId { get; set; }
        public virtual Agency? Agency { get; set; }
    }
}
