namespace React_Lawyer.DocumentGenerator.Models.Included_Data
{
    public class CaseInfo
    {
        public int Id { get; set; }
        public string CaseNumber { get; set; }
        public string Title { get; set; }
        public string CourtName { get; set; }
        public string CourtCaseNumber { get; set; }
        public DateTime? FilingDate { get; set; }
        public string Status { get; set; }
        public string Type { get; set; }
        public string Judge { get; set; }
        public string OpposingParty { get; set; }
        public string OpposingCounsel { get; set; }
        public Dictionary<string, object> AdditionalDetails { get; set; } = new Dictionary<string, object>();
    }
}
