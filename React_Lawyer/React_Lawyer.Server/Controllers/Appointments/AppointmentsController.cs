using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Appointments;
using Shared_Models.Cases;
using Shared_Models.Clients;
using Shared_Models.Firms;
using Shared_Models.Notifications;
using Shared_Models.Users;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace React_Lawyer.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppointmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AppointmentsController> _logger;


        public AppointmentsController(ApplicationDbContext context, ILogger<AppointmentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Appointments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments()
        {
            try
            {
                return await _context.Appointments
                    .Include(a => a.Lawyer)
                        .ThenInclude(l => l.User)
                    .Include(a => a.Client)
                    .Include(a => a.Case)
                    .OrderBy(a => a.StartTime)
                    .Select(x => new Appointment
                    {
                        AppointmentId = x.AppointmentId,
                        LawFirmId = x.LawFirmId,
                        LawyerId = x.LawyerId,
                        Lawyer = new Lawyer
                        {
                            LawyerId = x.Lawyer.LawyerId,
                            UserId = x.Lawyer.UserId,
                            User = new User
                            {
                                FirstName = x.Lawyer.User.FirstName,
                                LastName = x.Lawyer.User.LastName,
                                Email = x.Lawyer.User.Email,
                                PhoneNumber = x.Lawyer.User.PhoneNumber
                            }
                        },
                        ClientId = x.ClientId,
                        Client = new Client
                        {
                            ClientId = x.Client.ClientId,
                            FirstName = x.Client.FirstName,
                            LastName = x.Client.LastName,
                            Email = x.Client.Email,
                            PhoneNumber = x.Client.PhoneNumber,
                            Type = x.Client.Type
                        },
                        CaseId = x.CaseId,
                        ScheduledById = x.ScheduledById,
                        ScheduledBy = new User
                        {
                            FirstName = x.ScheduledBy.FirstName,
                            LastName = x.ScheduledBy.LastName,
                            Email = x.ScheduledBy.Email,
                            PhoneNumber = x.ScheduledBy.PhoneNumber
                        },
                        Title = x.Title,
                        Description = x.Description,
                        StartTime = x.StartTime,
                        EndTime = x.EndTime,
                        Location = x.Location,
                        IsVirtual = x.IsVirtual,
                        MeetingLink = x.MeetingLink,
                        Type = x.Type,
                        Notes = x.Notes,
                        Status = x.Status,
                        IsBillable = x.IsBillable,
                        ReminderSent = x.ReminderSent,
                        ReminderSentAt = x.ReminderSentAt,
                        BillableAmount = x.BillableAmount,

                    })
                    .ToListAsync();
            }
            catch (Exception e)
            {

                return BadRequest();
            }
        }

        // GET: api/Appointments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Appointment>> GetAppointment(int id)
        {
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var appointment = await _context.Appointments
                .Include(a => a.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(a => a.Client)
                .Include(a => a.Case)
                .Include(a => a.ScheduledBy)
                .Select(x=> new Appointment
                {
                    AppointmentId = x.AppointmentId,
                    LawFirmId = x.LawFirmId,
                    LawyerId = x.LawyerId,
                    Lawyer = new Lawyer
                    {
                        LawyerId = x.Lawyer.LawyerId,
                        UserId = x.Lawyer.UserId,
                        User = new User
                        {
                            FirstName = x.Lawyer.User.FirstName,
                            LastName = x.Lawyer.User.LastName,
                            Email = x.Lawyer.User.Email,
                            PhoneNumber = x.Lawyer.User.PhoneNumber
                        }
                    },
                    ClientId = x.ClientId,
                    Client = new Client
                    {
                        ClientId = x.Client.ClientId,
                        FirstName = x.Client.FirstName,
                        LastName = x.Client.LastName,
                        Email = x.Client.Email,
                        PhoneNumber = x.Client.PhoneNumber,
                        Type = x.Client.Type
                    },
                    CaseId = x.CaseId,
                    ScheduledById = x.ScheduledById,
                    ScheduledBy = new User
                    {
                        FirstName = x.ScheduledBy.FirstName,
                        LastName = x.ScheduledBy.LastName,
                        Email = x.ScheduledBy.Email,
                        PhoneNumber = x.ScheduledBy.PhoneNumber
                    },
                    Title = x.Title,
                    Description = x.Description,
                    StartTime = x.StartTime,
                    EndTime = x.EndTime,
                    Location = x.Location,
                    IsVirtual = x.IsVirtual,
                    MeetingLink = x.MeetingLink,
                    Type = x.Type,
                    Notes = x.Notes,
                    Status = x.Status,
                    IsBillable = x.IsBillable,
                    ReminderSent = x.ReminderSent,
                    ReminderSentAt = x.ReminderSentAt,
                    BillableAmount = x.BillableAmount,
                    
                })
                .FirstOrDefaultAsync(a => a.AppointmentId == id);

            if (appointment == null)
            {
                return NotFound();
            }

            return appointment;
        }

        // GET: api/Appointments/ByFirm/{firmId}
        [HttpGet("ByFirm/{firmId}")]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointmentsByFirm(int firmId)
        {
            return await _context.Appointments
                .Include(a => a.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(a => a.Client)
                .Where(a => a.LawFirmId == firmId)
                .OrderBy(a => a.StartTime)
                .ToListAsync();
        }

        // GET: api/Appointments/ByLawyer/{lawyerId}
        [HttpGet("ByLawyer/{lawyerId}")]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointmentsByLawyer(int lawyerId)
        {
            return await _context.Appointments
                .Include(a => a.Client)
                .Include(a => a.Case)
                .Where(a => a.LawyerId == lawyerId)
                .OrderBy(a => a.StartTime)
                .ToListAsync();
        }

        // GET: api/Appointments/ByClient/{clientId}
        [HttpGet("ByClient/{clientId}")]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointmentsByClient(int clientId)
        {
            return await _context.Appointments
                .Include(a => a.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(a => a.Case)
                .Where(a => a.ClientId == clientId)
                .OrderBy(a => a.StartTime)
                .ToListAsync();
        }

        // GET: api/Appointments/ByCase/{caseId}
        [HttpGet("ByCase/{caseId}")]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointmentsByCase(int caseId)
        {
            return await _context.Appointments
                .Include(a => a.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(a => a.Client)
                .Where(a => a.CaseId == caseId)
                .OrderBy(a => a.StartTime)
                .ToListAsync();
        }

        // GET: api/Appointments/Upcoming
        [HttpGet("Upcoming")]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetUpcomingAppointments()
        {
            var now = DateTime.UtcNow;
            return await _context.Appointments
                .Include(a => a.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(a => a.Client)
                .Include(a => a.Case)
                .Where(a => a.StartTime > now && a.Status != AppointmentStatus.Cancelled)
                .OrderBy(a => a.StartTime)
                    .Select(x => new Appointment
                    {
                        AppointmentId = x.AppointmentId,
                        LawFirmId = x.LawFirmId,
                        LawyerId = x.LawyerId,
                        Lawyer = new Lawyer
                        {
                            LawyerId = x.Lawyer.LawyerId,
                            UserId = x.Lawyer.UserId,
                            User = new User
                            {
                                FirstName = x.Lawyer.User.FirstName,
                                LastName = x.Lawyer.User.LastName,
                                Email = x.Lawyer.User.Email,
                                PhoneNumber = x.Lawyer.User.PhoneNumber
                            }
                        },
                        ClientId = x.ClientId,
                        Client = new Client
                        {
                            ClientId = x.Client.ClientId,
                            FirstName = x.Client.FirstName,
                            LastName = x.Client.LastName,
                            Email = x.Client.Email,
                            PhoneNumber = x.Client.PhoneNumber,
                            Type = x.Client.Type
                        },
                        CaseId = x.CaseId,
                        ScheduledById = x.ScheduledById,
                        ScheduledBy = new User
                        {
                            FirstName = x.ScheduledBy.FirstName,
                            LastName = x.ScheduledBy.LastName,
                            Email = x.ScheduledBy.Email,
                            PhoneNumber = x.ScheduledBy.PhoneNumber
                        },
                        Title = x.Title,
                        Description = x.Description,
                        StartTime = x.StartTime,
                        EndTime = x.EndTime,
                        Location = x.Location,
                        IsVirtual = x.IsVirtual,
                        MeetingLink = x.MeetingLink,
                        Type = x.Type,
                        Notes = x.Notes,
                        Status = x.Status,
                        IsBillable = x.IsBillable,
                        ReminderSent = x.ReminderSent,
                        ReminderSentAt = x.ReminderSentAt,
                        BillableAmount = x.BillableAmount,

                    })
                .ToListAsync();
        }

        // GET: api/Appointments/UpcomingByFirm/{firmId}
        [HttpGet("UpcomingByFirm/{firmId}")]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetUpcomingAppointmentsByFirm(int firmId)
        {
            var now = DateTime.UtcNow;
            return await _context.Appointments
                .Include(a => a.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(a => a.Client)
                .Include(a => a.Case)
                .Where(a => a.LawFirmId == firmId && a.StartTime > now && a.Status != AppointmentStatus.Cancelled)
                .OrderBy(a => a.StartTime)
                    .Select(x => new Appointment
                    {
                        AppointmentId = x.AppointmentId,
                        LawFirmId = x.LawFirmId,
                        LawyerId = x.LawyerId,
                        Lawyer = new Lawyer
                        {
                            LawyerId = x.Lawyer.LawyerId,
                            UserId = x.Lawyer.UserId,
                            User = new User
                            {
                                FirstName = x.Lawyer.User.FirstName,
                                LastName = x.Lawyer.User.LastName,
                                Email = x.Lawyer.User.Email,
                                PhoneNumber = x.Lawyer.User.PhoneNumber
                            }
                        },
                        ClientId = x.ClientId,
                        Client = new Client
                        {
                            ClientId = x.Client.ClientId,
                            FirstName = x.Client.FirstName,
                            LastName = x.Client.LastName,
                            Email = x.Client.Email,
                            PhoneNumber = x.Client.PhoneNumber,
                            Type = x.Client.Type
                        },
                        CaseId = x.CaseId,
                        ScheduledById = x.ScheduledById,
                        ScheduledBy = new User
                        {
                            FirstName = x.ScheduledBy.FirstName,
                            LastName = x.ScheduledBy.LastName,
                            Email = x.ScheduledBy.Email,
                            PhoneNumber = x.ScheduledBy.PhoneNumber
                        },
                        Title = x.Title,
                        Description = x.Description,
                        StartTime = x.StartTime,
                        EndTime = x.EndTime,
                        Location = x.Location,
                        IsVirtual = x.IsVirtual,
                        MeetingLink = x.MeetingLink,
                        Type = x.Type,
                        Notes = x.Notes,
                        Status = x.Status,
                        IsBillable = x.IsBillable,
                        ReminderSent = x.ReminderSent,
                        ReminderSentAt = x.ReminderSentAt,
                        BillableAmount = x.BillableAmount,

                    })
                .ToListAsync();
        }

        // GET: api/Appointments/Date/{date}
        [HttpGet("Date/{date}")]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointmentsByDate(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            return await _context.Appointments
                .Include(a => a.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(a => a.Client)
                .Include(a => a.Case)
                .Where(a => a.StartTime >= startDate && a.StartTime < endDate)
                .OrderBy(a => a.StartTime)
                    .Select(x => new Appointment
                    {
                        AppointmentId = x.AppointmentId,
                        LawFirmId = x.LawFirmId,
                        LawyerId = x.LawyerId,
                        Lawyer = new Lawyer
                        {
                            LawyerId = x.Lawyer.LawyerId,
                            UserId = x.Lawyer.UserId,
                            User = new User
                            {
                                FirstName = x.Lawyer.User.FirstName,
                                LastName = x.Lawyer.User.LastName,
                                Email = x.Lawyer.User.Email,
                                PhoneNumber = x.Lawyer.User.PhoneNumber
                            }
                        },
                        ClientId = x.ClientId,
                        Client = new Client
                        {
                            ClientId = x.Client.ClientId,
                            FirstName = x.Client.FirstName,
                            LastName = x.Client.LastName,
                            Email = x.Client.Email,
                            PhoneNumber = x.Client.PhoneNumber,
                            Type = x.Client.Type
                        },
                        CaseId = x.CaseId,
                        ScheduledById = x.ScheduledById,
                        ScheduledBy = new User
                        {
                            FirstName = x.ScheduledBy.FirstName,
                            LastName = x.ScheduledBy.LastName,
                            Email = x.ScheduledBy.Email,
                            PhoneNumber = x.ScheduledBy.PhoneNumber
                        },
                        Title = x.Title,
                        Description = x.Description,
                        StartTime = x.StartTime,
                        EndTime = x.EndTime,
                        Location = x.Location,
                        IsVirtual = x.IsVirtual,
                        MeetingLink = x.MeetingLink,
                        Type = x.Type,
                        Notes = x.Notes,
                        Status = x.Status,
                        IsBillable = x.IsBillable,
                        ReminderSent = x.ReminderSent,
                        ReminderSentAt = x.ReminderSentAt,
                        BillableAmount = x.BillableAmount,

                    })
                .ToListAsync();
        }


    // POST: api/Appointments
    [HttpPost]
    public async Task<ActionResult<Appointment>> CreateAppointment(Appointment_Create_Template template)
    {
        string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId == null)
        {
            return Unauthorized();
        }

        var appointment = new Appointment
        {
            Title = template.Title,
            Description = template.Description,
            StartTime = template.StartTime,
            EndTime = template.EndTime,
            ClientId = template.ClientId,
            LawyerId = template.LawyerId,
            CaseId = template.CaseId,
            IsVirtual = template.IsVirtual,
            LawFirmId = template.LawFirmId,
            Location = string.IsNullOrEmpty(template.Location) ? "" : template.Location,
            MeetingLink = string.IsNullOrEmpty(template.MeetingLink) ? "" : template.MeetingLink,
            Type = template.Type,
            Notes = string.IsNullOrEmpty(template.Notes) ? "" : template.Notes,
            ReminderSent = false,
            ReminderSentAt = null,
            Status = AppointmentStatus.Scheduled,
            ScheduledById = int.Parse(userId)
        };

        appointment.Status = AppointmentStatus.Scheduled;
        _context.Appointments.Add(appointment);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.SaveChangesAsync();

            // Create notifications for the lawyer and client
            if (appointment.LawyerId.HasValue)
            {
                var lawyerUser = await _context.Lawyers
                    .Where(l => l.LawyerId == appointment.LawyerId)
                    .Select(l => l.UserId)
                    .FirstOrDefaultAsync();

                if (lawyerUser != 0)
                {
                    var notification = new Notification
                    {
                        UserId = lawyerUser,
                        Title = "New Appointment Scheduled",
                        Message = $"New appointment: {appointment.Title} on {appointment.StartTime.ToString("g")}",
                        Type = NotificationType.AppointmentReminder,
                        CreatedAt = DateTime.UtcNow,
                        AppointmentId = appointment.AppointmentId,
                        ActionUrl = $"/appointments/{appointment.AppointmentId}"
                    };

                    _context.Notifications.Add(notification);
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return CreatedAtAction(nameof(GetAppointment), new { id = appointment.AppointmentId }, appointment);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error creating appointment");
            return StatusCode(500, "An error occurred while creating the appointment.");
        }
    }

        // PUT: api/Appointments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAppointment(int id, Appointment appointment)
        {
            if (id != appointment.AppointmentId)
            {
                return BadRequest();
            }

            _context.Entry(appointment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AppointmentExists(id))
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

        // PATCH: api/Appointments/5/Status
        [HttpPatch("{id}/Status")]
        public async Task<IActionResult> UpdateAppointmentStatus(int id, [FromBody] AppointmentStatusUpdateModel model)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
            {
                return NotFound();
            }

            appointment.Status = model.NewStatus;

            if (model.NewStatus == AppointmentStatus.Cancelled)
            {
                // Create notifications for cancelled appointments
                if (appointment.LawyerId.HasValue)
                {
                    var lawyerUser = await _context.Lawyers
                        .Where(l => l.LawyerId == appointment.LawyerId)
                        .Select(l => l.UserId)
                        .FirstOrDefaultAsync();

                    if (lawyerUser != 0)
                    {
                        var notification = new Notification
                        {
                            UserId = lawyerUser,
                            Title = "Appointment Cancelled",
                            Message = $"Appointment cancelled: {appointment.Title} on {appointment.StartTime.ToString("g")}",
                            Type = NotificationType.AppointmentReminder,
                            CreatedAt = DateTime.UtcNow,
                            AppointmentId = appointment.AppointmentId,
                            ActionUrl = $"/appointments/{appointment.AppointmentId}"
                        };

                        _context.Notifications.Add(notification);
                    }
                }
            }

            _context.Entry(appointment).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Appointments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
            {
                return NotFound();
            }

            // Instead of deleting, update status to cancelled
            appointment.Status = AppointmentStatus.Cancelled;
            _context.Entry(appointment).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Appointments/CheckAvailability
        [HttpGet("CheckAvailability")]
        public async Task<ActionResult<bool>> CheckLawyerAvailability([FromQuery] int lawyerId, [FromQuery] DateTime startTime, [FromQuery] DateTime endTime, [FromQuery] int? excludeAppointmentId = null)
        {
            var query = _context.Appointments
                .Where(a => a.LawyerId == lawyerId &&
                           a.Status != AppointmentStatus.Cancelled &&
                           ((a.StartTime <= startTime && a.EndTime > startTime) ||
                            (a.StartTime < endTime && a.EndTime >= endTime) ||
                            (a.StartTime >= startTime && a.EndTime <= endTime)));

            if (excludeAppointmentId.HasValue)
            {
                query = query.Where(a => a.AppointmentId != excludeAppointmentId.Value);
            }

            var conflictingAppointments = await query.ToListAsync();
            return !conflictingAppointments.Any();
        }

        private bool AppointmentExists(int id)
        {
            return _context.Appointments.Any(a => a.AppointmentId == id);
        }
    }

    public class AppointmentStatusUpdateModel
    {
        public AppointmentStatus NewStatus { get; set; }
    }


    public class Appointment_Create_Template
    {

        public int LawFirmId { get; set; }


        public int? LawyerId { get; set; }


        public int? ClientId { get; set; }


        public int? CaseId { get; set; }


        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        public string? Location { get; set; }

        public bool IsVirtual { get; set; } = false;

        public string? MeetingLink { get; set; }

        public AppointmentType Type { get; set; } = AppointmentType.ClientMeeting;


        public string? Notes { get; set; }
    }
}