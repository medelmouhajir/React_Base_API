using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Lawyer.Server.Data;
using Shared_Models.Cases;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Threading.Tasks;

namespace React_Lawyer.Server.Controllers.Documents
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DocumentsController> _logger;
        private readonly IWebHostEnvironment _env;

        public DocumentsController(
            ApplicationDbContext context,
            ILogger<DocumentsController> logger,
            IWebHostEnvironment env)
        {
            _context = context;
            _logger = logger;
            _env = env;
        }

        // GET: api/Documents
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocuments()
        {
            try
            {
                int userId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );


                // Check if user is associated with a law firm
                var userFirmId = await _context.Users.Include(x => x.Lawyer).Include(x => x.Secretary).Include(x => x.Admin)
                    .Where(u => u.UserId == userId)
                    .Select(u => u.GetLawFirmId())
                    .FirstOrDefaultAsync();

                if (userFirmId == null || userFirmId == 0)
                {
                    return NotFound("User is not associated with a law firm");
                }

                // Get documents visible to the user
                var documents = await _context.Documents
                    .Include(d => d.UploadedBy)
                    .Include(d => d.Case)
                    .Where(d => d.Case.LawFirmId == userFirmId)
                    .Select(d => new
                    {
                        d.DocumentId,
                        d.CaseId,
                        d.UploadedById,
                        d.Title,
                        d.Description,
                        d.FilePath,
                        d.FileType,
                        d.FileSize,
                        d.UploadDate,
                        d.LastModified,
                        Category = d.Category.ToString(),
                        Type = d.Type.ToString(),
                        d.IsConfidential,
                        d.IsTemplate,
                        d.IsSharedWithClient,
                        d.Tags,
                        d.VersionNumber,
                        d.PreviousVersionId,
                        UploadedBy = new
                        {
                            d.UploadedBy.UserId,
                            d.UploadedBy.FirstName,
                            d.UploadedBy.LastName
                        },
                        Case = new
                        {
                            d.Case.CaseId,
                            d.Case.CaseNumber,
                            d.Case.Title
                        }
                    })
                    .ToListAsync();

                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching documents");
                return StatusCode(500, "An error occurred while fetching documents");
            }
        }

        // GET: api/Documents/Regular
        [HttpGet("regular")]
        public async Task<ActionResult<IEnumerable<Document>>> GetRegularDocuments()
        {
            try
            {
                int currentUserId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );

                // Check if user is associated with a law firm
                var userFirmId = await _context.Users
                    .Include(x=> x.Lawyer)
                    .Include(x=> x.Secretary)
                    .Include(x=> x.Admin)
                    .Where(u => u.UserId == currentUserId)
                    .Select(u => u.GetLawFirmId())
                    .FirstOrDefaultAsync();

                if (userFirmId == null || userFirmId == 0)
                {
                    return NotFound("User is not associated with a law firm");
                }

                // Get regular documents (not templates) visible to the user
                var documents = await _context.Documents
                    .Include(d => d.UploadedBy)
                    .Include(d => d.Case)
                    .Where(d => d.Case.LawFirmId == userFirmId && !d.IsTemplate)
                    .Select(d => new
                    {
                        d.DocumentId,
                        d.CaseId,
                        d.UploadedById,
                        d.Title,
                        d.Description,
                        d.FilePath,
                        d.FileType,
                        d.FileSize,
                        d.UploadDate,
                        d.LastModified,
                        d.Category,
                        d.IsConfidential,
                        d.IsTemplate,
                        d.IsSharedWithClient,
                        d.Tags,
                        d.VersionNumber,
                        d.PreviousVersionId,
                        UploadedBy = new
                        {
                            d.UploadedBy.UserId,
                            d.UploadedBy.FirstName,
                            d.UploadedBy.LastName
                        },
                        Case = new
                        {
                            d.Case.CaseId,
                            d.Case.CaseNumber,
                            d.Case.Title
                        }
                    })
                    .ToListAsync();

                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching regular documents");
                return StatusCode(500, "An error occurred while fetching documents");
            }
        }

        // GET: api/Documents/Templates
        [HttpGet("templates")]
        public async Task<ActionResult<IEnumerable<Document>>> GetTemplates()
        {
            try
            {
                int currentUserId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );

                // Check if user is associated with a law firm
                var userFirmId = await _context.Users
                    .Include(x => x.Lawyer)
                    .Include(x => x.Secretary)
                    .Include(x => x.Admin)
                    .Where(u => u.UserId == currentUserId)
                    .Select(u => u.GetLawFirmId())
                    .FirstOrDefaultAsync();

                if (userFirmId == null || userFirmId == 0)
                {
                    return NotFound("User is not associated with a law firm");
                }

                // Get template documents visible to the user
                var templates = await _context.Documents
                    .Include(d => d.UploadedBy)
                    .Include(d => d.Case)
                    .Where(d => d.Case.LawFirmId == userFirmId && d.IsTemplate)
                    .Select(d => new
                    {
                        d.DocumentId,
                        d.CaseId,
                        d.UploadedById,
                        d.Title,
                        d.Description,
                        d.FilePath,
                        d.FileType,
                        d.FileSize,
                        d.UploadDate,
                        d.LastModified,
                        d.Category,
                        d.IsConfidential,
                        d.IsTemplate,
                        d.IsSharedWithClient,
                        d.Tags,
                        d.VersionNumber,
                        d.PreviousVersionId,
                        UploadedBy = new
                        {
                            d.UploadedBy.UserId,
                            d.UploadedBy.FirstName,
                            d.UploadedBy.LastName
                        },
                        Case = new
                        {
                            d.Case.CaseId,
                            d.Case.CaseNumber,
                            d.Case.Title
                        }
                    })
                    .ToListAsync();

                return Ok(templates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching templates");
                return StatusCode(500, "An error occurred while fetching templates");
            }
        }

        // GET: api/Documents/ByCase/{caseId}
        [HttpGet("bycase/{caseId}")]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocumentsByCase(int caseId)
        {
            try
            {
                // First check if the case exists
                var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == caseId);
                if (!caseExists)
                {
                    return NotFound("Case not found");
                }

                var documents = await _context.Documents
                    .Include(d => d.UploadedBy)
                    .Where(d => d.CaseId == caseId)
                    .Select(d => new
                    {
                        d.DocumentId,
                        d.CaseId,
                        d.UploadedById,
                        d.Title,
                        d.Description,
                        d.FilePath,
                        d.FileType,
                        d.FileSize,
                        d.UploadDate,
                        d.LastModified,
                        d.Category,
                        d.IsConfidential,
                        d.IsTemplate,
                        d.IsSharedWithClient,
                        d.Tags,
                        d.VersionNumber,
                        d.PreviousVersionId,
                        UploadedBy = new
                        {
                            d.UploadedBy.UserId,
                            d.UploadedBy.FirstName,
                            d.UploadedBy.LastName
                        }
                    })
                    .ToListAsync();

                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching documents for case {CaseId}", caseId);
                return StatusCode(500, "An error occurred while fetching case documents");
            }
        }

        // GET: api/Documents/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Document>> GetDocument(int id)
        {
            try
            {
                var document = await _context.Documents
                    .Include(d => d.UploadedBy)
                    .Include(d => d.Case)
                    .FirstOrDefaultAsync(d => d.DocumentId == id);

                if (document == null)
                {
                    return NotFound();
                }

                // Check if user has access to this document
                int currentUserId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );
                var userRole = User.FindFirst("Role")?.Value;
                var userFirmId = await _context.Users
                    .Include(x => x.Lawyer)
                    .Include(x => x.Secretary)
                    .Include(x => x.Admin)
                    .Where(u => u.UserId == currentUserId)
                    .Select(u => u.GetLawFirmId())
                    .FirstOrDefaultAsync();

                if (document.Case.LawFirmId != userFirmId)
                {
                    return Forbid();
                }

                // If document is confidential, check if user is admin or lawyer
                if (document.IsConfidential && !(userRole == "Admin" || userRole == "Lawyer"))
                {
                    return Forbid();
                }

                return Ok(new
                {
                    document.DocumentId,
                    document.CaseId,
                    document.UploadedById,
                    document.Title,
                    document.Description,
                    document.FilePath,
                    document.FileType,
                    document.FileSize,
                    document.UploadDate,
                    document.LastModified,
                    Category = document.Category.ToString(),
                    document.IsConfidential,
                    document.IsTemplate,
                    document.IsSharedWithClient,
                    document.Tags,
                    document.VersionNumber,
                    document.PreviousVersionId,
                    UploadedBy = new
                    {
                        document.UploadedBy.UserId,
                        document.UploadedBy.FirstName,
                        document.UploadedBy.LastName
                    },
                    Case = new
                    {
                        document.Case.CaseId,
                        document.Case.CaseNumber,
                        document.Case.Title
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document {DocumentId}", id);
                return StatusCode(500, "An error occurred while fetching the document");
            }
        }

        // GET: api/Documents/{id}/Download
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            try
            {
                var document = await _context.Documents.FindAsync(id);

                if (document == null)
                {
                    return NotFound();
                }

                // Check if user has access to this document
                int currentUserId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );
                var userRole = User.FindFirst("Role")?.Value;
                var userFirmId = await _context.Users
                    .Include(x => x.Lawyer)
                    .Include(x => x.Secretary)
                    .Include(x => x.Admin)
                    .Where(u => u.UserId == currentUserId)
                    .Select(u => u.GetLawFirmId())
                    .FirstOrDefaultAsync();

                //if (document.Case.LawFirmId != userFirmId)
                //{
                //    return Forbid();
                //}

                // If document is confidential, check if user is admin or lawyer
                if (document.IsConfidential && !(userRole == "Admin" || userRole == "Lawyer"))
                {
                    return Forbid();
                }

                // Get the file path
                var filePath = document.FilePath;

                // Check if the file exists
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Document file not found on disk: {FilePath}", filePath);
                    return NotFound("File not found on server");
                }

                // Get file bytes
                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

                // Get content type and file extension
                var contentType = document.FileType;
                if (string.IsNullOrEmpty(contentType))
                {
                    contentType = "application/octet-stream";
                }

                // Get file name from path
                var fileName = Path.GetFileName(filePath);

                // Return file
                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading document {DocumentId}", id);
                return StatusCode(500, "An error occurred while downloading the document");
            }
        }

        // GET: api/Documents/{id}/Versions
        [HttpGet("{id}/versions")]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocumentVersions(int id)
        {
            try
            {
                // Get the current document
                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                {
                    return NotFound();
                }

                // Get all versions of this document
                var versions = new List<Document>();
                var currentDoc = document;

                // Add current document
                versions.Add(currentDoc);

                // Add previous versions
                while (currentDoc.PreviousVersionId != null)
                {
                    var prevVersion = await _context.Documents.FindAsync(currentDoc.PreviousVersionId);
                    if (prevVersion != null)
                    {
                        versions.Add(prevVersion);
                        currentDoc = prevVersion;
                    }
                    else
                    {
                        break;
                    }
                }

                return Ok(versions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document versions for {DocumentId}", id);
                return StatusCode(500, "An error occurred while fetching document versions");
            }
        }

        // POST: api/Documents/Upload
        [HttpPost("upload")]
        public async Task<ActionResult<Document>> UploadDocument([FromForm] DocumentUploadModel model)
        {
            try
            {
                if (model.File == null || model.File.Length == 0)
                {
                    return BadRequest("No file was uploaded");
                }

                // Validate case
                if (model.CaseId.HasValue)
                {
                    var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == model.CaseId);
                    if (!caseExists)
                    {
                        return BadRequest("The specified case does not exist");
                    }
                }
                else
                {
                    return BadRequest("A case ID is required");
                }

                int currentUserId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );

                // Create file storage directory if it doesn't exist
                var uploadsFolder = Path.Combine(_env.ContentRootPath, "Uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Create case directory if it doesn't exist
                var caseFolder = Path.Combine(uploadsFolder, $"Case_{model.CaseId}");
                if (!Directory.Exists(caseFolder))
                {
                    Directory.CreateDirectory(caseFolder);
                }

                // Get original file name and sanitize it
                var originalFileName = ContentDispositionHeaderValue.Parse(model.File.ContentDisposition).FileName.Trim('"');
                var safeFileName = Path.GetFileNameWithoutExtension(originalFileName).Replace(" ", "_");
                var fileExtension = Path.GetExtension(originalFileName);

                // Create unique file name
                var fileName = $"{safeFileName}_{DateTime.UtcNow.ToString("yyyyMMdd_HHmmss")}{fileExtension}";
                var filePath = Path.Combine(caseFolder, fileName);

                // Save file to disk
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await model.File.CopyToAsync(stream);
                }

                // Get file type
                var contentType = model.File.ContentType;

                // Create document entry
                var document = new Document
                {
                    CaseId = model.CaseId.Value,
                    UploadedById = currentUserId,
                    Title = model.Title,
                    Description = model.Description,
                    FilePath = filePath,
                    FileType = contentType,
                    FileSize = model.File.Length,
                    UploadDate = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow,
                    Category = Enum.TryParse<DocumentCategory>(model.Category, out var category) ? category : DocumentCategory.Other,
                    IsConfidential = model.IsConfidential,
                    IsTemplate = model.IsTemplate,
                    IsSharedWithClient = model.IsSharedWithClient,
                    Tags = model.Tags,
                    VersionNumber = 1,
                    LawFirmId = model.LawFirmId,
                    Type = DocumentType.Uploaded
                };

                _context.Documents.Add(document);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Document uploaded: {DocumentId} - {Title} by User {UserId}", document.DocumentId, document.Title, currentUserId);

                return CreatedAtAction(nameof(GetDocument), new { id = document.DocumentId }, document);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading document");
                return StatusCode(500, "An error occurred while uploading the document");
            }
        }

        // POST: api/Documents/{id}/Version
        [HttpPost("{id}/version")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<Document>> UploadNewVersion(int id, [FromForm] VersionUploadModel model)
        {
            try
            {
                if (model.File == null || model.File.Length == 0)
                {
                    return BadRequest("No file was uploaded");
                }

                // Get existing document
                var existingDocument = await _context.Documents.FindAsync(id);
                if (existingDocument == null)
                {
                    return NotFound();
                }

                int currentUserId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );

                // Get directory of existing file
                var existingDirectory = Path.GetDirectoryName(existingDocument.FilePath);

                // Get original file name and sanitize it
                var originalFileName = ContentDispositionHeaderValue.Parse(model.File.ContentDisposition).FileName.Trim('"');
                var safeFileName = Path.GetFileNameWithoutExtension(originalFileName).Replace(" ", "_");
                var fileExtension = Path.GetExtension(originalFileName);

                // Create unique file name (with version)
                var nextVersion = (existingDocument.VersionNumber ?? 0) + 1;
                var fileName = $"{safeFileName}_v{nextVersion}_{DateTime.UtcNow.ToString("yyyyMMdd_HHmmss")}{fileExtension}";
                var filePath = Path.Combine(existingDirectory, fileName);

                // Save file to disk
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await model.File.CopyToAsync(stream);
                }

                // Get file type
                var contentType = model.File.ContentType;

                // Create new document entry as next version
                var newVersionDocument = new Document
                {
                    CaseId = existingDocument.CaseId,
                    UploadedById = currentUserId,
                    Title = existingDocument.Title,
                    Description = existingDocument.Description,
                    FilePath = filePath,
                    FileType = contentType,
                    FileSize = model.File.Length,
                    UploadDate = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow,
                    Category = existingDocument.Category,
                    IsConfidential = existingDocument.IsConfidential,
                    IsTemplate = existingDocument.IsTemplate,
                    IsSharedWithClient = existingDocument.IsSharedWithClient,
                    Tags = existingDocument.Tags,
                    VersionNumber = nextVersion,
                    PreviousVersionId = existingDocument.DocumentId,
                    Type = DocumentType.Uploaded
                };

                _context.Documents.Add(newVersionDocument);
                await _context.SaveChangesAsync();

                _logger.LogInformation("New document version uploaded: {DocumentId} (version {Version}) by User {UserId}",
                    newVersionDocument.DocumentId, nextVersion, currentUserId);

                return CreatedAtAction(nameof(GetDocument), new { id = newVersionDocument.DocumentId }, newVersionDocument);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading new document version");
                return StatusCode(500, "An error occurred while uploading new document version");
            }
        }

        // POST: api/Documents/Template/{id}
        [HttpPost("template/{id}")]
        public async Task<ActionResult<Document>> CreateFromTemplate(int id, DocumentFromTemplateModel model)
        {
            try
            {
                // Get template document
                var templateDocument = await _context.Documents.FindAsync(id);
                if (templateDocument == null)
                {
                    return NotFound("Template document not found");
                }

                if (!templateDocument.IsTemplate)
                {
                    return BadRequest("The specified document is not a template");
                }

                int currentUserId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );

                // Validate case
                if (model.CaseId <= 0)
                {
                    return BadRequest("A valid case ID is required");
                }

                var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == model.CaseId);
                if (!caseExists)
                {
                    return BadRequest("The specified case does not exist");
                }

                // Create case directory if it doesn't exist
                var uploadsFolder = Path.Combine(_env.ContentRootPath, "Uploads");
                var caseFolder = Path.Combine(uploadsFolder, $"Case_{model.CaseId}");
                if (!Directory.Exists(caseFolder))
                {
                    Directory.CreateDirectory(caseFolder);
                }

                // Get template file info
                var templateFileName = Path.GetFileName(templateDocument.FilePath);
                var safeFileName = Path.GetFileNameWithoutExtension(templateFileName).Replace(" ", "_");
                var fileExtension = Path.GetExtension(templateFileName);

                // Create new file name
                var fileName = $"{safeFileName}_{DateTime.UtcNow.ToString("yyyyMMdd_HHmmss")}{fileExtension}";
                var filePath = Path.Combine(caseFolder, fileName);

                // Copy template file to new location
                System.IO.File.Copy(templateDocument.FilePath, filePath);

                // Create document entry
                var document = new Document
                {
                    CaseId = model.CaseId,
                    UploadedById = currentUserId,
                    Title = model.Title ?? templateDocument.Title,
                    Description = model.Description ?? templateDocument.Description,
                    FilePath = filePath,
                    FileType = templateDocument.FileType,
                    FileSize = templateDocument.FileSize,
                    UploadDate = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow,
                    Category = templateDocument.Category,
                    IsConfidential = model.IsConfidential,
                    IsTemplate = false, // New document is not a template
                    IsSharedWithClient = model.IsSharedWithClient,
                    Tags = model.Tags ?? templateDocument.Tags,
                    VersionNumber = 1, // Initial version
                    Type = DocumentType.Generated
                };

                _context.Documents.Add(document);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Document created from template: {DocumentId} - {Title} by User {UserId}",
                    document.DocumentId, document.Title, currentUserId);

                return CreatedAtAction(nameof(GetDocument), new { id = document.DocumentId }, document);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating document from template");
                return StatusCode(500, "An error occurred while creating document from template");
            }
        }

        // PUT: api/Documents/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDocument(int id, DocumentUpdateModel model)
        {
            if (id != model.DocumentId)
            {
                return BadRequest("ID mismatch");
            }

            try
            {
                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                {
                    return NotFound();
                }

                // Update document properties
                document.Title = model.Title;
                document.Description = model.Description;
                document.Category = Enum.TryParse<DocumentCategory>(model.Category, out var category) ? category : document.Category;
                document.IsConfidential = model.IsConfidential;
                document.IsTemplate = model.IsTemplate;
                document.IsSharedWithClient = model.IsSharedWithClient;
                document.Tags = model.Tags;
                document.LastModified = DateTime.UtcNow;

                // Only update CaseId if provided and different
                if (model.CaseId.HasValue && model.CaseId.Value != document.CaseId)
                {
                    // Validate case exists
                    var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == model.CaseId.Value);
                    if (!caseExists)
                    {
                        return BadRequest("The specified case does not exist");
                    }

                    // Update case and move file if needed
                    document.CaseId = model.CaseId.Value;

                    // Move file to new case folder if needed
                    var currentFolder = Path.GetDirectoryName(document.FilePath);
                    var fileName = Path.GetFileName(document.FilePath);
                    var uploadsFolder = Path.Combine(_env.ContentRootPath, "Uploads");
                    var newCaseFolder = Path.Combine(uploadsFolder, $"Case_{model.CaseId.Value}");

                    if (!Directory.Exists(newCaseFolder))
                    {
                        Directory.CreateDirectory(newCaseFolder);
                    }

                    var newFilePath = Path.Combine(newCaseFolder, fileName);

                    // Only move if the paths are different
                    if (document.FilePath != newFilePath)
                    {
                        // Copy file to new location
                        System.IO.File.Copy(document.FilePath, newFilePath, true);

                        // Delete old file
                        System.IO.File.Delete(document.FilePath);

                        // Update file path in document
                        document.FilePath = newFilePath;
                    }
                }

                _context.Entry(document).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                int currentUserId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );
                _logger.LogInformation("Document updated: {DocumentId} by User {UserId}", id, currentUserId);

                return Ok(new object());
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DocumentExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating document {DocumentId}", id);
                return StatusCode(500, "An error occurred while updating the document");
            }
        }

        // PUT: api/Documents/5/Share
        [HttpPut("{id}/share")]
        public async Task<IActionResult> ShareDocument(int id, [FromBody] DocumentShareModel model)
        {
            try
            {
                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                {
                    return NotFound();
                }

                // Update shared state
                document.IsSharedWithClient = model.IsSharedWithClient;
                document.LastModified = DateTime.UtcNow;

                _context.Entry(document).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                int currentUserId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );
                _logger.LogInformation("Document sharing updated: {DocumentId} (Shared: {IsShared}) by User {UserId}",
                    id, model.IsSharedWithClient, currentUserId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating document sharing state {DocumentId}", id);
                return StatusCode(500, "An error occurred while updating document sharing");
            }
        }

        // DELETE: api/Documents/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            try
            {
                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                {
                    return NotFound();
                }

                // Check if this document has versions
                var hasVersions = await _context.Documents.AnyAsync(d => d.PreviousVersionId == id);
                if (hasVersions)
                {
                    return BadRequest("Cannot delete document that has newer versions");
                }

                // Delete the file from disk
                if (System.IO.File.Exists(document.FilePath))
                {
                    System.IO.File.Delete(document.FilePath);
                }

                // Remove from database
                _context.Documents.Remove(document);
                await _context.SaveChangesAsync();

                int currentUserId = int.Parse( User.FindFirst(ClaimTypes.NameIdentifier)?.Value );
                _logger.LogInformation("Document deleted: {DocumentId} by User {UserId}", id, currentUserId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting document {DocumentId}", id);
                return StatusCode(500, "An error occurred while deleting the document");
            }
        }

        private bool DocumentExists(int id)
        {
            return _context.Documents.Any(e => e.DocumentId == id);
        }
    }

    // DTO Models
    public class DocumentUploadModel
    {
        public IFormFile File { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public int? CaseId { get; set; }
        public int LawFirmId { get; set; }
        public string Category { get; set; } = "Other";
        public bool IsConfidential { get; set; } = false;
        public bool IsTemplate { get; set; } = false;
        public bool IsSharedWithClient { get; set; } = false;
        public string Tags { get; set; }
    }

    public class DocumentUpdateModel
    {
        public int DocumentId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public int? CaseId { get; set; }
        public string Category { get; set; }
        public bool IsConfidential { get; set; }
        public bool IsTemplate { get; set; }
        public bool IsSharedWithClient { get; set; }
        public string Tags { get; set; }
    }

    public class DocumentFromTemplateModel
    {
        public int CaseId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsConfidential { get; set; } = false;
        public bool IsSharedWithClient { get; set; } = false;
        public string Tags { get; set; }
    }

    public class DocumentShareModel
    {
        public bool IsSharedWithClient { get; set; }
    }
    public class VersionUploadModel
    {
        public IFormFile File { get; set; }
    }
}