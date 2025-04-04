using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Invoices;
using Shared_Models.Notifications;
using Shared_Models.TimeEntries;

namespace React_Lawyer.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<InvoicesController> _logger;

        public InvoicesController(ApplicationDbContext context, ILogger<InvoicesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Invoices
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetInvoices()
        {
            return await _context.Invoices
                .Include(i => i.Client)
                .Include(i => i.Case)
                .Select( x=> new
                {
                    InvoiceId = x.InvoiceId,
                    Amount = x.Amount,
                    PaymentReference = x.PaymentReference,
                    PaymentMethod = x.PaymentMethod,
                    CaseId = x.CaseId,
                    ClientId = x.ClientId,
                    DueDate = x.DueDate,
                    InvoiceNumber = x.InvoiceNumber,
                    IssueDate = x.IssueDate,
                    LawFirmId = x.LawFirmId,
                    Notes = x.Notes,
                    PaidAmount = x.PaidAmount,
                    PaidDate = x.PaidDate,
                    Status = x.Status.ToString(),
                    TaxAmount = x.TaxAmount,
                    Client = new Shared_Models.Clients.Client
                    {
                        ClientId = x.ClientId,
                        FirstName = x.Client.FirstName,
                        LastName = x.Client.LastName,
                        Email = x.Client.Email,
                        PhoneNumber = x.Client.PhoneNumber,
                    },
                    Case = x.CaseId == null ? null : new Shared_Models.Cases.Case
                    {
                        CaseId = x.Case.CaseId,
                        CaseNumber = x.Case.CaseNumber,
                        Title = x.Case.Title,
                    },

                } )
                .OrderByDescending(i => i.IssueDate)
                .ToListAsync();
        }

        // GET: api/Invoices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetInvoice(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Client)
                .Include(i => i.Case)
                .Include(i => i.Items)
                .Include(i => i.Payments)
                .Include(i => i.TimeEntries)
                .Select(x => new
                {
                    InvoiceId = x.InvoiceId,
                    Amount = x.Amount,
                    PaymentReference = x.PaymentReference,
                    PaymentMethod = x.PaymentMethod,
                    CaseId = x.CaseId,
                    ClientId = x.ClientId,
                    DueDate = x.DueDate,
                    InvoiceNumber = x.InvoiceNumber,
                    IssueDate = x.IssueDate,
                    LawFirmId = x.LawFirmId,
                    Notes = x.Notes,
                    PaidAmount = x.PaidAmount,
                    PaidDate = x.PaidDate,
                    Status = x.Status.ToString(),
                    TaxAmount = x.TaxAmount,
                    Client = new Shared_Models.Clients.Client
                    {
                        ClientId = x.ClientId,
                        FirstName = x.Client.FirstName,
                        LastName = x.Client.LastName,
                        Email = x.Client.Email,
                        PhoneNumber = x.Client.PhoneNumber,
                    },
                    Case = x.CaseId == null ? null : new Shared_Models.Cases.Case
                    {
                        CaseId = x.Case.CaseId,
                        CaseNumber = x.Case.CaseNumber,
                        Title = x.Case.Title,
                    },
                    Items = x.Items.Select( z=> new
                    {
                        InvoiceItemId = z.InvoiceItemId,
                        InvoiceId = z.InvoiceId,
                        Description = z.Description,
                        ItemCode = z.ItemCode,
                        ItemType = z.ItemType.ToString(),
                        Quantity = z.Quantity,
                        TaxRate = z.TaxRate,
                        TimeEntryId = z.TimeEntryId,
                        UnitPrice = z.UnitPrice,
                        TimeEntry = z.TimeEntry == null ? null : new
                        {
                            TimeEntryId = z.TimeEntry.TimeEntryId,
                            CaseId = z.TimeEntry.CaseId,
                            CreatedAt = z.TimeEntry.CreatedAt,
                            Date = z.TimeEntry.Date,
                            Hours = z.TimeEntry.Hours,
                            Category = z.TimeEntry.Category.ToString(),
                            HourlyRate = z.TimeEntry.HourlyRate,
                            IsBillable = z.TimeEntry.IsBillable,
                            Description = z.Description,
                            LastModified = z.TimeEntry.LastModified,
                            Notes = z.TimeEntry.Notes,
                            
                        }
                    }).ToList(),
                    Payments = x.Payments.Select( p => new
                    {
                        InvoiceId = p.InvoiceId,
                        CreatedAt = p.CreatedAt,
                        Amount = p.Amount,
                        ClientId = p.ClientId,
                        Method = p.Method.ToString(),
                        Notes = p.Notes,
                        ReceivedBy = new
                        {
                            FirstName = p.ReceivedBy.FirstName,
                            LastName = p.ReceivedBy.LastName,
                            Email = p.ReceivedBy.Email,
                            PhoneNumber = p.ReceivedBy.PhoneNumber,
                        },
                        PaymentDate = p.PaymentDate,
                        ReferenceNumber = p.ReferenceNumber,
                        Status = p.Status.ToString(),
                    } )
                })
                .FirstOrDefaultAsync(i => i.InvoiceId == id);

            if (invoice == null)
            {
                return NotFound();
            }

            return invoice;
        }

        // GET: api/Invoices/ByFirm/{firmId}
        [HttpGet("ByFirm/{firmId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetInvoicesByFirm(int firmId)
        {
            return await _context.Invoices
                .Include(i => i.Client)
                .Include(i => i.Case)
                .Where(i => i.LawFirmId == firmId)
                .Select(x => new
                {
                    InvoiceId = x.InvoiceId,
                    Amount = x.Amount,
                    PaymentReference = x.PaymentReference,
                    PaymentMethod = x.PaymentMethod,
                    CaseId = x.CaseId,
                    ClientId = x.ClientId,
                    DueDate = x.DueDate,
                    InvoiceNumber = x.InvoiceNumber,
                    IssueDate = x.IssueDate,
                    LawFirmId = x.LawFirmId,
                    Notes = x.Notes,
                    PaidAmount = x.PaidAmount,
                    PaidDate = x.PaidDate,
                    Status = x.Status.ToString(),
                    TaxAmount = x.TaxAmount,
                    Client = new Shared_Models.Clients.Client
                    {
                        ClientId = x.ClientId,
                        FirstName = x.Client.FirstName,
                        LastName = x.Client.LastName,
                        Email = x.Client.Email,
                        PhoneNumber = x.Client.PhoneNumber,
                    },
                    Case = x.CaseId == null ? null : new Shared_Models.Cases.Case
                    {
                        CaseId = x.Case.CaseId,
                        CaseNumber = x.Case.CaseNumber,
                        Title = x.Case.Title,
                    },

                })
                .OrderByDescending(i => i.IssueDate)
                .ToListAsync();
        }

        // GET: api/Invoices/ByClient/{clientId}
        [HttpGet("ByClient/{clientId}")]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoicesByClient(int clientId)
        {
            return await _context.Invoices
                .Include(i => i.Case)
                .Where(i => i.ClientId == clientId)
                .OrderByDescending(i => i.IssueDate)
                .ToListAsync();
        }

        // GET: api/Invoices/ByCase/{caseId}
        [HttpGet("ByCase/{caseId}")]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoicesByCase(int caseId)
        {
            return await _context.Invoices
                .Include(i => i.Client)
                .Where(i => i.CaseId == caseId)
                .OrderByDescending(i => i.IssueDate)
                .ToListAsync();
        }

        // GET: api/Invoices/Outstanding
        [HttpGet("Outstanding")]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetOutstandingInvoices()
        {
            return await _context.Invoices
                .Include(i => i.Client)
                .Include(i => i.Case)
                .Where(i => i.Status != InvoiceStatus.Paid &&
                           i.Status != InvoiceStatus.Cancelled &&
                           i.DueDate < DateTime.UtcNow)
                .OrderBy(i => i.DueDate)
                .ToListAsync();
        }

        // GET: api/Invoices/Overdue
        [HttpGet("Overdue")]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetOverdueInvoices()
        {
            return await _context.Invoices
                .Include(i => i.Client)
                .Include(i => i.Case)
                .Where(i => i.Status == InvoiceStatus.Overdue)
                .OrderBy(i => i.DueDate)
                .ToListAsync();
        }

        // POST: api/Invoices
        [HttpPost]
        public async Task<ActionResult<object>> CreateInvoice(InvoiceCreationModel model)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Verify client exists
                var clientExists = await _context.Clients.AnyAsync(c => c.ClientId == model.ClientId);
                if (!clientExists)
                {
                    return BadRequest("Client not found");
                }

                // Generate invoice number
                string invoiceNumber = $"INV-{DateTime.UtcNow.ToString("yyyyMMdd")}-{await GetNextInvoiceNumber()}";

                // Create invoice
                var invoice = new Invoice
                {
                    InvoiceNumber = invoiceNumber,
                    LawFirmId = model.LawFirmId,
                    ClientId = model.ClientId,
                    CaseId = model.CaseId,
                    IssueDate = DateTime.UtcNow,
                    DueDate = DateTime.UtcNow.AddDays(model.PaymentTermDays), // e.g., 30 days from now
                    Amount = 0, // Will be calculated from items
                    TaxAmount = 0, // Will be calculated from items
                    Status = InvoiceStatus.Draft,
                    Notes = model.Notes,
                    PaymentMethod = "",
                    PaymentReference = "",
                    
                };

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                // Add invoice items
                decimal totalAmount = 0;
                decimal totalTax = 0;

                if (model.TimeEntryIds != null && model.TimeEntryIds.Any())
                {
                    // Add time entries as invoice items
                    var timeEntries = await _context.TimeEntries
                        .Where(te => model.TimeEntryIds.Contains(te.TimeEntryId) && te.InvoiceId == null)
                        .ToListAsync();

                    foreach (var entry in timeEntries)
                    {
                        // Calculate amount
                        decimal rate = entry.HourlyRate ?? 0;
                        decimal lineAmount = entry.Hours * rate;

                        // Create invoice item
                        var invoiceItem = new InvoiceItem
                        {
                            InvoiceId = invoice.InvoiceId,
                            Description = $"{entry.Description} ({entry.Date.ToString("d")})",
                            Quantity = entry.Hours,
                            UnitPrice = rate,
                            TaxRate = model.TaxRate,
                            TimeEntryId = entry.TimeEntryId,
                            ItemType = InvoiceItemType.Service,
                            ItemCode = "TIME"
                        };

                        _context.InvoiceItems.Add(invoiceItem);

                        // Update time entry to link to invoice
                        entry.InvoiceId = invoice.InvoiceId;
                        _context.Entry(entry).State = EntityState.Modified;

                        // Calculate totals
                        totalAmount += lineAmount;
                        totalTax += lineAmount * (model.TaxRate / 100);
                    }
                }

                // Add additional items
                if (model.AdditionalItems != null)
                {
                    foreach (var item in model.AdditionalItems)
                    {
                        var invoiceItem = new InvoiceItem
                        {
                            InvoiceId = invoice.InvoiceId,
                            Description = item.Description,
                            Quantity = item.Quantity,
                            UnitPrice = item.UnitPrice,
                            TaxRate = item.TaxRate,
                            ItemType = item.ItemType,
                            ItemCode = item.ItemCode
                        };

                        _context.InvoiceItems.Add(invoiceItem);

                        // Calculate totals
                        var lineAmount = item.Quantity * item.UnitPrice;
                        totalAmount += lineAmount;
                        totalTax += lineAmount * (item.TaxRate / 100);
                    }
                }

                // Update invoice totals
                invoice.Amount = totalAmount;
                invoice.TaxAmount = totalTax;
                _context.Entry(invoice).State = EntityState.Modified;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return RedirectToAction(nameof(GetInvoice), new { id = invoice.InvoiceId });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating invoice");
                return StatusCode(500, "An error occurred while creating the invoice.");
            }
        }

        // PUT: api/Invoices/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInvoice(int id, Invoice invoice)
        {
            if (id != invoice.InvoiceId)
            {
                return BadRequest();
            }

            _context.Entry(invoice).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!InvoiceExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // PATCH: api/Invoices/5/Status
        [HttpPatch("{id}/Status")]
        public async Task<IActionResult> UpdateInvoiceStatus(int id, [FromBody] InvoiceStatusUpdateModel model)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Client)
                .FirstOrDefaultAsync(i => i.InvoiceId == id);

            if (invoice == null)
            {
                return NotFound();
            }

            // Update status
            invoice.Status = model.NewStatus;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // If moving to "Sent" status, record the date
                if (model.NewStatus == InvoiceStatus.Sent)
                {
                    // Check to make sure we're moving from Draft to Sent
                    if (invoice.Status != InvoiceStatus.Draft)
                    {
                        // Create notification for client (would be sent via email in a real app)
                        var notification = new Notification
                        {
                            UserId = model.UserId, // For now, notify the user who sent it
                            Title = "Invoice Sent",
                            Message = $"Invoice {invoice.InvoiceNumber} for {invoice.Amount:C} has been sent to {invoice.Client.FirstName} {invoice.Client.LastName}",
                            Type = NotificationType.InvoiceIssued,
                            CreatedAt = DateTime.UtcNow,
                            //InvoiceId = invoice.InvoiceId,
                            ClientId = invoice.ClientId,
                            ActionUrl = $"/invoices/{invoice.InvoiceId}"
                        };

                        _context.Notifications.Add(notification);
                    }
                }
                // If moving to "Paid" status, record payment date
                else if (model.NewStatus == InvoiceStatus.Paid)
                {
                    invoice.PaidDate = DateTime.UtcNow;
                    invoice.PaidAmount = invoice.Amount + invoice.TaxAmount;
                    invoice.PaymentMethod = model.PaymentMethod;
                    invoice.PaymentReference = model.PaymentReference;

                    // Create payment record
                    var payment = new Payment
                    {
                        InvoiceId = invoice.InvoiceId,
                        ClientId = invoice.ClientId,
                        LawFirmId = invoice.LawFirmId,
                        PaymentDate = DateTime.UtcNow,
                        Amount = invoice.PaidAmount,
                        Method = model.PaymentMethodEnum.Value,
                        ReferenceNumber = model.PaymentReference,
                        Notes = model.Notes,
                        ReceivedById = model.UserId,
                        Status = PaymentStatus.Completed,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Payments.Add(payment);

                    // Create notification
                    var notification = new Notification
                    {
                        UserId = model.UserId,
                        Title = "Payment Received",
                        Message = $"Payment of {invoice.PaidAmount:C} received for invoice {invoice.InvoiceNumber}",
                        Type = NotificationType.PaymentReceived,
                        CreatedAt = DateTime.UtcNow,
                        //InvoiceId = invoice.InvoiceId,
                        ClientId = invoice.ClientId,
                        ActionUrl = $"/invoices/{invoice.InvoiceId}"
                    };

                    _context.Notifications.Add(notification);
                }

                _context.Entry(invoice).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating invoice status");
                return StatusCode(500, "An error occurred while updating the invoice status.");
            }
        }

        // DELETE: api/Invoices/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            // Check if there are payments
            var hasPayments = await _context.Payments.AnyAsync(p => p.InvoiceId == id);
            if (hasPayments)
            {
                return BadRequest("Cannot delete an invoice with payments. Cancel it instead.");
            }

            // For draft invoices, we can delete them
            if (invoice.Status == InvoiceStatus.Draft)
            {
                // Release any time entries
                var timeEntries = await _context.TimeEntries.Where(te => te.InvoiceId == id).ToListAsync();
                foreach (var entry in timeEntries)
                {
                    entry.InvoiceId = null;
                    _context.Entry(entry).State = EntityState.Modified;
                }

                // Delete invoice items
                var items = await _context.InvoiceItems.Where(ii => ii.InvoiceId == id).ToListAsync();
                _context.InvoiceItems.RemoveRange(items);

                // Delete invoice
                _context.Invoices.Remove(invoice);
            }
            else
            {
                // For other statuses, mark as cancelled
                invoice.Status = InvoiceStatus.Cancelled;
                _context.Entry(invoice).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Invoices/5/Items
        [HttpPost("{id}/Items")]
        public async Task<ActionResult<InvoiceItem>> AddInvoiceItem(int id, InvoiceItem item)
        {
            if (id != item.InvoiceId)
            {
                return BadRequest();
            }

            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            // Don't allow adding items to non-draft invoices
            if (invoice.Status != InvoiceStatus.Draft)
            {
                return BadRequest("Can only add items to draft invoices.");
            }

            _context.InvoiceItems.Add(item);

            // Update invoice totals
            decimal lineAmount = item.Quantity * item.UnitPrice;
            decimal taxAmount = lineAmount * (item.TaxRate / 100);

            invoice.Amount += lineAmount;
            invoice.TaxAmount += taxAmount;
            _context.Entry(invoice).State = EntityState.Modified;

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInvoice), new { id = item.InvoiceId }, item);
        }

        // DELETE: api/Invoices/5/Items/10
        [HttpDelete("{invoiceId}/Items/{itemId}")]
        public async Task<IActionResult> DeleteInvoiceItem(int invoiceId, int itemId)
        {
            var invoice = await _context.Invoices.FindAsync(invoiceId);
            if (invoice == null)
            {
                return NotFound();
            }

            // Don't allow deleting items from non-draft invoices
            if (invoice.Status != InvoiceStatus.Draft)
            {
                return BadRequest("Can only delete items from draft invoices.");
            }

            var item = await _context.InvoiceItems.FindAsync(itemId);
            if (item == null || item.InvoiceId != invoiceId)
            {
                return NotFound();
            }

            // If this item is linked to a time entry, update the time entry
            if (item.TimeEntryId.HasValue)
            {
                var timeEntry = await _context.TimeEntries.FindAsync(item.TimeEntryId.Value);
                if (timeEntry != null)
                {
                    timeEntry.InvoiceId = null;
                    _context.Entry(timeEntry).State = EntityState.Modified;
                }
            }

            // Update invoice totals
            decimal lineAmount = item.Quantity * item.UnitPrice;
            decimal taxAmount = lineAmount * (item.TaxRate / 100);

            invoice.Amount -= lineAmount;
            invoice.TaxAmount -= taxAmount;
            _context.Entry(invoice).State = EntityState.Modified;

            _context.InvoiceItems.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Invoices/5/Payments
        [HttpPost("{id}/Payments")]
        public async Task<ActionResult<Payment>> AddPayment(int id, PaymentCreationModel model)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Create payment
                var payment = new Payment
                {
                    InvoiceId = id,
                    ClientId = invoice.ClientId,
                    LawFirmId = invoice.LawFirmId,
                    PaymentDate = model.PaymentDate,
                    Amount = model.Amount,
                    Method = model.Method,
                    ReferenceNumber = model.ReferenceNumber,
                    Notes = model.Notes,
                    ReceivedById = model.ReceivedById,
                    Status = PaymentStatus.Completed,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Payments.Add(payment);

                // Update invoice paid amount and status
                invoice.PaidAmount += model.Amount;

                // Update status based on payment amount
                decimal totalDue = invoice.Amount + invoice.TaxAmount;
                if (invoice.PaidAmount >= totalDue)
                {
                    invoice.Status = InvoiceStatus.Paid;
                    invoice.PaidDate = model.PaymentDate;
                    invoice.PaymentMethod = model.Method.ToString();
                    invoice.PaymentReference = model.ReferenceNumber;
                }
                else if (invoice.PaidAmount > 0)
                {
                    invoice.Status = InvoiceStatus.PartiallyPaid;
                }

                _context.Entry(invoice).State = EntityState.Modified;

                // Create notification
                var notification = new Notification
                {
                    UserId = model.ReceivedById,
                    Title = "Payment Received",
                    Message = $"Payment of {model.Amount:C} received for invoice {invoice.InvoiceNumber}",
                    Type = NotificationType.PaymentReceived,
                    CreatedAt = DateTime.UtcNow,
                    //InvoiceId = invoice.InvoiceId,
                    ClientId = invoice.ClientId,
                    ActionUrl = $"/invoices/{invoice.InvoiceId}"
                };

                _context.Notifications.Add(notification);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return RedirectToAction("GetInvoice", new { id = invoice.InvoiceId });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error adding payment");
                return StatusCode(500, "An error occurred while adding the payment.");
            }
        }

        // GET: api/Invoices/UnbilledTimeEntries/{clientId}
        [HttpGet("UnbilledTimeEntries/{clientId}")]
        public async Task<ActionResult<IEnumerable<TimeEntry>>> GetUnbilledTimeEntries(int clientId)
        {
            var timeEntries = await _context.TimeEntries
                .Where(te => te.ClientId == clientId &&
                           te.IsBillable &&
                           te.InvoiceId == null)
                .OrderByDescending(te => te.Date)
                .ToListAsync();

            return timeEntries;
        }

        // GET: api/Invoices/UnbilledTimeEntriesByCase/{caseId}
        [HttpGet("UnbilledTimeEntriesByCase/{caseId}")]
        public async Task<ActionResult<IEnumerable<TimeEntry>>> GetUnbilledTimeEntriesByCase(int caseId)
        {
            var timeEntries = await _context.TimeEntries
                .Where(te => te.CaseId == caseId &&
                           te.IsBillable &&
                           te.InvoiceId == null)
                .OrderByDescending(te => te.Date)
                .ToListAsync();

            return timeEntries;
        }

        // Helper methods
        private async Task<int> GetNextInvoiceNumber()
        {
            // Find the highest invoice number for today
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var prefix = $"INV-{today.ToString("yyyyMMdd")}";

            var lastInvoice = await _context.Invoices
                .Where(i => i.InvoiceNumber.StartsWith(prefix))
                .OrderByDescending(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            if (lastInvoice == null)
            {
                return 1; // First invoice of the day
            }

            // Extract the number part and increment
            var lastNumberPart = lastInvoice.InvoiceNumber.Substring(prefix.Length + 1);
            if (int.TryParse(lastNumberPart, out int lastNumber))
            {
                return lastNumber + 1;
            }

            return 1; // Default if parsing fails
        }

        private bool InvoiceExists(int id)
        {
            return _context.Invoices.Any(e => e.InvoiceId == id);
        }
    }

    // Models
    public class InvoiceCreationModel
    {
        public int LawFirmId { get; set; }
        public int ClientId { get; set; }
        public int? CaseId { get; set; }
        public int PaymentTermDays { get; set; } = 30;
        public decimal TaxRate { get; set; } = 0;
        public string Notes { get; set; }
        public List<int>? TimeEntryIds { get; set; }
        public List<AdditionalInvoiceItemModel>? AdditionalItems { get; set; }
    }

    public class AdditionalInvoiceItemModel
    {
        public string Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TaxRate { get; set; }
        public InvoiceItemType ItemType { get; set; }
        public string ItemCode { get; set; }
    }

    public class InvoiceStatusUpdateModel
    {
        public InvoiceStatus NewStatus { get; set; }
        public int UserId { get; set; }
        public string? PaymentMethod { get; set; }
        public PaymentMethod? PaymentMethodEnum { get; set; }
        public string? PaymentReference { get; set; }
        public string? Notes { get; set; }
    }

    public class PaymentCreationModel
    {
        public DateTime PaymentDate { get; set; }
        public decimal Amount { get; set; }
        public PaymentMethod Method { get; set; }
        public string ReferenceNumber { get; set; }
        public string Notes { get; set; }
        public int ReceivedById { get; set; }
    }
}