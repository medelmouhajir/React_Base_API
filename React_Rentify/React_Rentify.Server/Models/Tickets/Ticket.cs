using System.ComponentModel;

namespace React_Rentify.Server.Models.Tickets
{
    public class Ticket
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Object { get; set; }
        public string Message { get; set; }

        public DateTime Created_At { get; set; }

        [DefaultValue(Ticket_Status.Created)]
        public Ticket_Status Status { get; set; }
    }

    public enum Ticket_Status
    {
        Created = 0,
        Ongoing = 1,
        Completed = 2,
        Canceled = 3,
    }
}
