using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Invoices;
using React_Rentify.Server.Models.Reservations;
using React_Rentify.Server.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InvoicesController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<InvoicesController> _logger;
        private readonly IAgencyAuthorizationService _authService;

        public InvoicesController(MainDbContext context, ILogger<InvoicesController> logger, IAgencyAuthorizationService authService)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
        }

        /// <summary>
        /// GET: api/Invoices
        /// Returns all invoices (DTO), including payments.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllInvoices()
        {
            _logger.LogInformation("Retrieving all invoices");
            var invoices = await _context.Set<Invoice>()
                .Include(i => i.Payments)
                .ToListAsync();

            var dtoList = invoices.Select(i => new InvoiceDto
            {
                Id = i.Id,
                ReservationId = i.ReservationId,
                IssuedAt = i.IssuedAt,
                Amount = i.Amount,
                IsPaid = i.IsPaid,
                Currency = i.Currency,
                PaymentMethod = i.PaymentMethod,
                Payments = i.Payments?
                    .Select(p => new PaymentDto
                    {
                        Id = p.Id,
                        InvoiceId = p.InvoiceId,
                        PaidAt = p.PaidAt,
                        Amount = p.Amount,
                        Method = p.Method,
                        TransactionId = p.TransactionId
                    })
                    .ToList()
            }).ToList();

            _logger.LogInformation("Retrieved {Count} invoices", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/Invoices/{id}
        /// Returns a single invoice by Id (DTO), including payments.
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetInvoiceById(Guid id)
        {
            _logger.LogInformation("Retrieving invoice with Id {InvoiceId}", id);
            var invoice = await _context.Set<Invoice>()
                .Include(i => i.Payments)
                .Include(x => x.Reservation)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                _logger.LogWarning("Invoice with Id {InvoiceId} not found", id);
                return NotFound(new { message = $"Invoice with Id '{id}' not found." });
            }



            if (!await _authService.HasAccessToAgencyAsync(invoice.Reservation.AgencyId))
                return Unauthorized();

            var dto = new InvoiceDto
            {
                Id = invoice.Id,
                ReservationId = invoice.ReservationId,
                IssuedAt = invoice.IssuedAt,
                Amount = invoice.Amount,
                IsPaid = invoice.IsPaid,
                Currency = invoice.Currency,
                PaymentMethod = invoice.PaymentMethod,
                Payments = invoice.Payments?
                    .Select(p => new PaymentDto
                    {
                        Id = p.Id,
                        InvoiceId = p.InvoiceId,
                        PaidAt = p.PaidAt,
                        Amount = p.Amount,
                        Method = p.Method,
                        TransactionId = p.TransactionId
                    })
                    .ToList()
            };

            _logger.LogInformation("Retrieved invoice {InvoiceId}", id);
            return Ok(dto);
        }

        /// <summary>
        /// GET: api/Invoices/reservation/{reservationId}
        /// Returns the invoice for a given reservation (DTO), including payments.
        /// </summary>
        [HttpGet("reservation/{reservationId:guid}")]
        public async Task<IActionResult> GetInvoiceByReservationId(Guid reservationId)
        {
            _logger.LogInformation("Retrieving invoice for Reservation {ReservationId}", reservationId);

            var reservationExists = await _context.Set<Reservation>()
                .FirstOrDefaultAsync(r => r.Id == reservationId);

            if (reservationExists == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} not found", reservationId);
                return NotFound(new { message = $"Reservation with Id '{reservationId}' does not exist." });
            }

            if (!await _authService.HasAccessToAgencyAsync(reservationExists.AgencyId))
                return Unauthorized();

            var invoice = await _context.Set<Invoice>()
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.ReservationId == reservationId);

            if (invoice == null)
            {
                _logger.LogWarning("Invoice for Reservation {ReservationId} not found", reservationId);
                return NotFound(new { message = $"No invoice found for Reservation '{reservationId}'." });
            }

            var dto = new InvoiceDto
            {
                Id = invoice.Id,
                ReservationId = invoice.ReservationId,
                IssuedAt = invoice.IssuedAt,
                Amount = invoice.Amount,
                IsPaid = invoice.IsPaid,
                Currency = invoice.Currency,
                PaymentMethod = invoice.PaymentMethod,
                Payments = invoice.Payments?
                    .Select(p => new PaymentDto
                    {
                        Id = p.Id,
                        InvoiceId = p.InvoiceId,
                        PaidAt = p.PaidAt,
                        Amount = p.Amount,
                        Method = p.Method,
                        TransactionId = p.TransactionId
                    })
                    .ToList()
            };

            _logger.LogInformation("Retrieved invoice for Reservation {ReservationId}", reservationId);
            return Ok(dto);
        }
        [HttpGet("agency/{agencyId:guid}")]
        public async Task<IActionResult> GetInvoicesByAgencyId(Guid agencyId)
        {
            _logger.LogInformation("Retrieving invoice for agency {agencyId}", agencyId);


            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            _logger.LogInformation("Retrieving all invoices");
            var invoices = await _context.Set<Invoice>()
                .Include(i => i.Payments)
                .Include(i => i.Reservation)
                .Where(x => x.Reservation.AgencyId == agencyId)
                .ToListAsync();

            var dtoList = invoices.Select(i => new InvoiceDto
            {
                Id = i.Id,
                ReservationId = i.ReservationId,
                IssuedAt = i.IssuedAt,
                Amount = i.Amount,
                IsPaid = i.IsPaid,
                Currency = i.Currency,
                PaymentMethod = i.PaymentMethod,
                Payments = i.Payments?
                    .Select(p => new PaymentDto
                    {
                        Id = p.Id,
                        InvoiceId = p.InvoiceId,
                        PaidAt = p.PaidAt,
                        Amount = p.Amount,
                        Method = p.Method,
                        TransactionId = p.TransactionId
                    })
                    .ToList()
            }).ToList();

            _logger.LogInformation("Retrieved {Count} invoices", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/Invoices
        /// Creates a new invoice. Accepts CreateInvoiceDto.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto dto)
        {
            _logger.LogInformation("Creating new invoice for Reservation {ReservationId}", dto.ReservationId);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateInvoiceDto received");
                return BadRequest(ModelState);
            }

            // Verify Reservation exists
            var reservationExists = await _context.Set<Reservation>()
                .FirstOrDefaultAsync(r => r.Id == dto.ReservationId);
            if (reservationExists == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} does not exist", dto.ReservationId);
                return BadRequest(new { message = $"Reservation with Id '{dto.ReservationId}' does not exist." });
            }


            if (!await _authService.HasAccessToAgencyAsync(reservationExists.AgencyId))
                return Unauthorized();

            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                ReservationId = dto.ReservationId,
                IssuedAt = dto.IssuedAt.ToUniversalTime(),
                Amount = dto.Amount,
                IsPaid = dto.IsPaid,
                Currency = dto.Currency,
                PaymentMethod = dto.PaymentMethod,
                Payments = new List<Payment>()
            };

            try
            {
                _context.Set<Invoice>().Add(invoice);
                await _context.SaveChangesAsync();
            }
            catch (Exception e)
            {

            }
            ;

            _logger.LogInformation("Created invoice {InvoiceId}", invoice.Id);

            var resultDto = new InvoiceDto
            {
                Id = invoice.Id,
                ReservationId = invoice.ReservationId,
                IssuedAt = invoice.IssuedAt,
                Amount = invoice.Amount,
                IsPaid = invoice.IsPaid,
                Currency = invoice.Currency,
                PaymentMethod = invoice.PaymentMethod,
                Payments = new List<PaymentDto>()
            };

            return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, resultDto);
        }

        /// <summary>
        /// PUT: api/Invoices/{id}
        /// Updates an existing invoice. Accepts UpdateInvoiceDto.
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateInvoice(Guid id, [FromBody] UpdateInvoiceDto dto)
        {
            _logger.LogInformation("Updating invoice {InvoiceId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateInvoiceDto for Invoice {InvoiceId}", id);
                return BadRequest(ModelState);
            }

            if (id != dto.Id)
            {
                _logger.LogWarning("URL Id {UrlId} does not match DTO Id {DtoId}", id, dto.Id);
                return BadRequest(new { message = "The Id in the URL does not match the Id in the payload." });
            }

            var existingInvoice = await _context.Set<Invoice>()
                .Include(i => i.Payments)
                .Include(i => i.Reservation)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (existingInvoice == null)
            {
                _logger.LogWarning("Invoice with Id {InvoiceId} not found", id);
                return NotFound(new { message = $"Invoice with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(existingInvoice.Reservation.AgencyId))
                return Unauthorized();

            // If Reservation changed, verify it
            if (existingInvoice.ReservationId != dto.ReservationId)
            {
                var reservationExists = await _context.Set<Reservation>()
                    .AnyAsync(r => r.Id == dto.ReservationId);
                if (!reservationExists)
                {
                    _logger.LogWarning("Reservation with Id {ReservationId} does not exist", dto.ReservationId);
                    return BadRequest(new { message = $"Reservation with Id '{dto.ReservationId}' does not exist." });
                }
            }

            // Update scalar properties
            existingInvoice.ReservationId = dto.ReservationId;
            existingInvoice.IssuedAt = dto.IssuedAt;
            existingInvoice.Amount = dto.Amount;
            existingInvoice.IsPaid = dto.IsPaid;
            existingInvoice.Currency = dto.Currency;
            existingInvoice.PaymentMethod = dto.PaymentMethod;

            _context.Entry(existingInvoice).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated invoice {InvoiceId}", id);

            var resultDto = new InvoiceDto
            {
                Id = existingInvoice.Id,
                ReservationId = existingInvoice.ReservationId,
                IssuedAt = existingInvoice.IssuedAt,
                Amount = existingInvoice.Amount,
                IsPaid = existingInvoice.IsPaid,
                Currency = existingInvoice.Currency,
                PaymentMethod = existingInvoice.PaymentMethod,
                Payments = existingInvoice.Payments?
                    .Select(p => new PaymentDto
                    {
                        Id = p.Id,
                        InvoiceId = p.InvoiceId,
                        PaidAt = p.PaidAt,
                        Amount = p.Amount,
                        Method = p.Method,
                        TransactionId = p.TransactionId
                    })
                    .ToList()
            };

            return Ok(resultDto);
        }

        /// <summary>
        /// DELETE: api/Invoices/{id}
        /// Deletes an invoice and its payments.
        /// </summary>
        [Authorize(Roles = "Owner")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteInvoice(Guid id)
        {
            _logger.LogInformation("Deleting invoice {InvoiceId}", id);

            var invoice = await _context.Set<Invoice>()
                .Include(i => i.Payments)
                .Include(i => i.Reservation)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                _logger.LogWarning("Invoice with Id {InvoiceId} not found", id);
                return NotFound(new { message = $"Invoice with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(invoice.Reservation.AgencyId))
                return Unauthorized();

            if (invoice.Payments != null && invoice.Payments.Any())
            {
                _logger.LogInformation("Removing {Count} payments for Invoice {InvoiceId}", invoice.Payments.Count, id);
                _context.Set<Payment>().RemoveRange(invoice.Payments);
            }

            _context.Set<Invoice>().Remove(invoice);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted invoice {InvoiceId}", id);
            return NoContent();
        }

        /// <summary>
        /// POST: api/Invoices/{id}/payments
        /// Adds a payment to an existing invoice.
        /// </summary>
        [HttpPost("{id:guid}/payments")]
        public async Task<IActionResult> AddPaymentToInvoice(Guid id, [FromBody] CreatePaymentDto dto)
        {
            _logger.LogInformation("Adding payment to Invoice {InvoiceId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreatePaymentDto for Invoice {InvoiceId}", id);
                return BadRequest(ModelState);
            }

            var invoice = await _context.Set<Invoice>()
                .Include(i => i.Payments)
                .Include(i => i.Reservation)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                _logger.LogWarning("Invoice with Id {InvoiceId} not found", id);
                return NotFound(new { message = $"Invoice with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(invoice.Reservation.AgencyId))
                return Unauthorized();

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                InvoiceId = id,
                PaidAt = dto.PaidAt,
                Amount = dto.Amount,
                Method = dto.Method,
                TransactionId = dto.TransactionId
            };

            _context.Set<Payment>().Add(payment);
            await _context.SaveChangesAsync();

            // If full amount paid, update IsPaid
            var totalPaid = await _context.Set<Payment>()
                .Where(p => p.InvoiceId == id)
                .SumAsync(p => p.Amount);

            if (totalPaid >= invoice.Amount)
            {
                invoice.IsPaid = true;
                _context.Entry(invoice).State = EntityState.Modified;
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Added payment {PaymentId} to Invoice {InvoiceId}", payment.Id, id);

            var paymentDto = new PaymentDto
            {
                Id = payment.Id,
                InvoiceId = payment.InvoiceId,
                PaidAt = payment.PaidAt,
                Amount = payment.Amount,
                Method = payment.Method,
                TransactionId = payment.TransactionId
            };

            return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, paymentDto);
        }


        /// <summary>
        /// DELETE: api/Invoices/{invoiceId}/payments/{paymentId}
        /// Removes a payment from an invoice.
        /// </summary>
        [Authorize(Roles = "Owner")]
        [HttpDelete("{invoiceId:guid}/payments/{paymentId:guid}")]
        public async Task<IActionResult> RemovePaymentFromInvoice(Guid invoiceId, Guid paymentId)
        {
            _logger.LogInformation("Removing payment {PaymentId} from Invoice {InvoiceId}", paymentId, invoiceId);

            var invoice = await _context.Set<Invoice>()
                .Include(i => i.Payments)
                .Include(i => i.Reservation)
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            if (invoice == null)
            {
                _logger.LogWarning("Invoice with Id {InvoiceId} not found when attempting to remove payment {PaymentId}", invoiceId, paymentId);
                return NotFound(new { message = $"Invoice with Id '{invoiceId}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(invoice.Reservation.AgencyId))
                return Unauthorized();

            var payment = invoice.Payments?.FirstOrDefault(p => p.Id == paymentId);

            if (payment == null)
            {
                _logger.LogWarning("Payment {PaymentId} not found for Invoice {InvoiceId}", paymentId, invoiceId);
                return NotFound(new { message = $"Payment with Id '{paymentId}' not found for invoice '{invoiceId}'." });
            }

            _context.Set<Payment>().Remove(payment);
            await _context.SaveChangesAsync();

            var totalPaid = await _context.Set<Payment>()
                .Where(p => p.InvoiceId == invoiceId)
                .SumAsync(p => p.Amount);

            var shouldBePaid = totalPaid >= invoice.Amount;

            if (invoice.IsPaid != shouldBePaid)
            {
                invoice.IsPaid = shouldBePaid;
                _context.Entry(invoice).State = EntityState.Modified;
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Removed payment {PaymentId} from Invoice {InvoiceId}", paymentId, invoiceId);

            return NoContent();
        }
    }

    #region DTOs

    public class InvoiceDto
    {
        public Guid Id { get; set; }
        public Guid ReservationId { get; set; }
        public DateTime IssuedAt { get; set; }
        public decimal Amount { get; set; }
        public bool IsPaid { get; set; }
        public string Currency { get; set; }
        public string PaymentMethod { get; set; }
        public List<PaymentDto>? Payments { get; set; }
    }

    public class CreateInvoiceDto
    {
        public Guid ReservationId { get; set; }
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public decimal Amount { get; set; }
        public bool IsPaid { get; set; } = false;
        public string Currency { get; set; } = "MAD";
        public string PaymentMethod { get; set; }
    }

    public class UpdateInvoiceDto
    {
        public Guid Id { get; set; }
        public Guid ReservationId { get; set; }
        public DateTime IssuedAt { get; set; }
        public decimal Amount { get; set; }
        public bool IsPaid { get; set; }
        public string Currency { get; set; }
        public string PaymentMethod { get; set; }
    }

    public class PaymentDto
    {
        public Guid Id { get; set; }
        public Guid InvoiceId { get; set; }
        public DateTime PaidAt { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; }
        public string TransactionId { get; set; }
    }

    public class CreatePaymentDto
    {
        public DateTime PaidAt { get; set; } = DateTime.UtcNow;
        public decimal Amount { get; set; }
        public string Method { get; set; }
        public string TransactionId { get; set; }
    }

    #endregion
}
