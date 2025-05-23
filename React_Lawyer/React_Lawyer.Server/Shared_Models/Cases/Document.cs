using Shared_Models.Users;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Shared_Models.Firms;
using System.Xml.Linq;

namespace Shared_Models.Cases
{
    public class Document
    {
        [Key]
        public int DocumentId { get; set; }

        [Required]
        public int LawFirmId { get; set; }

        [ForeignKey("LawFirmId")]
        public virtual LawFirm LawFirm { get; set; }

        [Required]
        public int CaseId { get; set; }

        [ForeignKey("CaseId")]
        public virtual Case Case { get; set; }

        public int? UploadedById { get; set; } // UserId of the uploader

        [ForeignKey("UploadedById")]
        public virtual User UploadedBy { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        [Required]
        [StringLength(500)]
        public string FilePath { get; set; }

        [StringLength(100)]
        public string FileType { get; set; }

        public long FileSize { get; set; } // Size in bytes

        public DateTime UploadDate { get; set; } = DateTime.UtcNow;

        public DateTime? LastModified { get; set; }

        public DocumentCategory Category { get; set; } = DocumentCategory.Other;

        public bool IsConfidential { get; set; } = false;

        public bool IsTemplate { get; set; } = false;

        public bool IsSharedWithClient { get; set; } = false;

        [StringLength(500)]
        public string Tags { get; set; } // Comma-separated tags

        public int? VersionNumber { get; set; }

        public int? PreviousVersionId { get; set; }

        [ForeignKey("PreviousVersionId")]
        public virtual Document PreviousVersion { get; set; }


        public DocumentType Type { get; set; }
    }

    public enum DocumentType
    {
        Uploaded = 0,
        Generated = 1,
        SmartEditor = 2
    }

    public enum DocumentCategory
    {
        Pleading,
        Evidence,
        Correspondence,
        Contract,
        CourtFiling,
        ClientDocument,
        InternalMemo,
        Research,
        Financial,
        Other
    }
}
