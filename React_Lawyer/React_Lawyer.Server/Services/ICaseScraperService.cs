using System.Buffers.Text;
using System.Dynamic;
using System.Net.Http;
using HtmlAgilityPack;
using Shared_Models._Templates;

namespace React_Lawyer.Server.Services
{
    public interface ICaseScraperService
    {
        Task<Portal_Data_Response> GetCaseDataAsync(string caseNumber, int juridiction);
        Task<Portal_Decisions_Response> GetCaseListDicisionsAsync(string caseNumber, string affaire);
        Task<Portal_Parties_Response> GetCaseListPartiesAsync(string caseNumber, string affaire);
    }


    public class CaseScraperService : ICaseScraperService
    {
        private readonly HttpClient _httpClient;
        private const string BaseUrl = "https://www.mahakim.ma/middleware/api/SuiviDossiers/CarteDossier?numeroCompletDossier={0}&idjuridiction={1}";
        private const string BaseUrl_ListDicisions = "https://www.mahakim.ma/middleware/api/SuiviDossiers/ListeDicisions?idDossier={0}&typeaffaire={1}";
        private const string BaseUrl_ListParties = "https://www.mahakim.ma/middleware/api/SuiviDossiers/ListeParties?idDossier={0}&typeaffaire={1}";
        private const string BaseUrl_ListExpertises = "https://www.mahakim.ma/middleware/api/SuiviDossiers/ListeExpertisesJudiciaire?idDossier={0}&typeaffaire={1}";
        private const string BaseUrl_ListDepotsDossier = "https://www.mahakim.ma/middleware/api/SuiviDossiers/ListeDepotsDossier?idDossier={0}&typeaffaire={1}";
        private const string BaseUrl_ListDossiersAttache = "https://www.mahakim.ma/middleware/api/SuiviDossiers/ListeDossiersAttache?idDossier={0}&typeaffaire={1}";

        public CaseScraperService(HttpClient httpClient)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        }


        public async Task<Portal_Data_Response> GetCaseDataAsync(string caseNumber , int juridiction)
        {
            if (string.IsNullOrWhiteSpace(caseNumber))
                throw new ArgumentException("Case number must be specified", nameof(caseNumber));

            // 1. Build the request URL
            var url = string.Format(BaseUrl, Uri.EscapeDataString(caseNumber.Trim()), Uri.EscapeDataString(juridiction.ToString().Trim()));

            // 2. Fetch the JSON data
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            // 3. Deserialize JSON response to CaseInfo object
            var caseInfo = await response.Content.ReadFromJsonAsync<Portal_Data_Response>();

            if (caseInfo == null)
                throw new InvalidOperationException("Failed to parse case information from response.");

            return caseInfo;
        }


        public async Task<Portal_Decisions_Response> GetCaseListDicisionsAsync(string caseNumber , string affaire)
        {
            if (string.IsNullOrWhiteSpace(caseNumber))
                throw new ArgumentException("Case number must be specified", nameof(caseNumber));

            // 1. Build the request URL
            var url = string.Format(BaseUrl_ListDicisions, Uri.EscapeDataString(caseNumber.Trim()), Uri.EscapeDataString(affaire.Trim()));

            // 2. Fetch the JSON data
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            // 3. Deserialize JSON response to CaseInfo object
            var caseInfo = await response.Content.ReadFromJsonAsync<Portal_Decisions_Response>();

            if (caseInfo == null)
                throw new InvalidOperationException("Failed to parse case information from response.");

            return caseInfo;
        }

        public async Task<Portal_Parties_Response> GetCaseListPartiesAsync(string caseNumber, string affaire)
        {
            if (string.IsNullOrWhiteSpace(caseNumber))
                throw new ArgumentException("Case number must be specified", nameof(caseNumber));

            // 1. Build the request URL
            var url = string.Format(BaseUrl_ListParties, Uri.EscapeDataString(caseNumber.Trim()), Uri.EscapeDataString(affaire.Trim()));

            // 2. Fetch the JSON data
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            // 3. Deserialize JSON response to CaseInfo object
            var caseInfo = await response.Content.ReadFromJsonAsync<Portal_Parties_Response>();

            if (caseInfo == null)
                throw new InvalidOperationException("Failed to parse case information from response.");

            return caseInfo;
        }

        public async Task<Portal_Parties_Response> GetCaseListExpertisesAsync(string caseNumber, string affaire)
        {
            if (string.IsNullOrWhiteSpace(caseNumber))
                throw new ArgumentException("Case number must be specified", nameof(caseNumber));

            // 1. Build the request URL
            var url = string.Format(BaseUrl_ListExpertises, Uri.EscapeDataString(caseNumber.Trim()), Uri.EscapeDataString(affaire.Trim()));

            // 2. Fetch the JSON data
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            // 3. Deserialize JSON response to CaseInfo object
            var caseInfo = await response.Content.ReadFromJsonAsync<Portal_Parties_Response>();

            if (caseInfo == null)
                throw new InvalidOperationException("Failed to parse case information from response.");

            return caseInfo;
        }
        public async Task<Portal_Parties_Response> GetCaseListDepotsDossierAsync(string caseNumber, string affaire)
        {
            if (string.IsNullOrWhiteSpace(caseNumber))
                throw new ArgumentException("Case number must be specified", nameof(caseNumber));

            // 1. Build the request URL
            var url = string.Format(BaseUrl_ListDepotsDossier, Uri.EscapeDataString(caseNumber.Trim()), Uri.EscapeDataString(affaire.Trim()));

            // 2. Fetch the JSON data
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            // 3. Deserialize JSON response to CaseInfo object
            var caseInfo = await response.Content.ReadFromJsonAsync<Portal_Parties_Response>();

            if (caseInfo == null)
                throw new InvalidOperationException("Failed to parse case information from response.");

            return caseInfo;
        }
        public async Task<Portal_DossiersAttache_Response> GetCaseListDossiersAttacheAsync(string caseNumber, string affaire)
        {
            if (string.IsNullOrWhiteSpace(caseNumber))
                throw new ArgumentException("Case number must be specified", nameof(caseNumber));

            // 1. Build the request URL
            var url = string.Format(BaseUrl_ListDossiersAttache, Uri.EscapeDataString(caseNumber.Trim()), Uri.EscapeDataString(affaire.Trim()));

            // 2. Fetch the JSON data
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            // 3. Deserialize JSON response to CaseInfo object
            var caseInfo = await response.Content.ReadFromJsonAsync<Portal_DossiersAttache_Response>();

            if (caseInfo == null)
                throw new InvalidOperationException("Failed to parse case information from response.");

            return caseInfo;
        }

    }

    public class CaseInfo
    {
        public string CaseNumber { get; set; }
        public string Status { get; set; }
        public string LastHearingDate { get; set; }
        public string NextHearingDate { get; set; }
        public string Judge { get; set; }
        public string Notes { get; set; }
    }

}
