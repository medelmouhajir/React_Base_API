using React_Lawyer.DocumentGenerator.Models.Included_Data;

namespace React_Lawyer.DocumentGenerator.Services
{
    public class ClientService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ClientService> _logger;
        private readonly string _mainApiUrl;

        public ClientService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<ClientService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;

            _mainApiUrl = _configuration["MainApi:Url"] ?? "http://react_lawyer.server:8080";
        }

        /// <summary>
        /// Get client information
        /// </summary>
        /// <param name="clientId">ID of the client</param>
        /// <returns>Client information</returns>
        public async Task<ClientInfo> GetClientInfoAsync(int clientId)
        {
            try
            {
                _logger.LogInformation("Fetching client information for client ID: {ClientId}", clientId);

                var response = await _httpClient.GetAsync($"{_mainApiUrl}/api/clients/{clientId}");
                response.EnsureSuccessStatusCode();

                var clientData = await response.Content.ReadFromJsonAsync<dynamic>();

                // Map the data from the main API to our ClientInfo model
                var clientInfo = new ClientInfo
                {
                    Id = clientId,
                    FirstName = clientData.firstName,
                    LastName = clientData.lastName,
                    Email = clientData.email,
                    Phone = clientData.phoneNumber,
                    CompanyName = clientData.companyName,
                    IsCompany = !string.IsNullOrEmpty(clientData.companyName),
                    TaxId = clientData.taxId,
                    IdNumber = clientData.idNumber,
                    Address = new AddressInfo
                    {
                        Street = clientData.address?.street,
                        City = clientData.address?.city,
                        State = clientData.address?.state,
                        ZipCode = clientData.address?.zipCode,
                        Country = clientData.address?.country
                    }
                };

                return clientInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching client information for client ID: {ClientId}", clientId);
                throw new InvalidOperationException($"Failed to retrieve client information: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Get case information
        /// </summary>
        /// <param name="caseId">ID of the case</param>
        /// <returns>Case information</returns>
        public async Task<CaseInfo> GetCaseInfoAsync(int caseId)
        {
            try
            {
                _logger.LogInformation("Fetching case information for case ID: {CaseId}", caseId);

                var response = await _httpClient.GetAsync($"{_mainApiUrl}/api/cases/{caseId}");
                response.EnsureSuccessStatusCode();

                var caseData = await response.Content.ReadFromJsonAsync<dynamic>();

                // Map the data from the main API to our CaseInfo model
                var caseInfo = new CaseInfo
                {
                    Id = caseId,
                    CaseNumber = caseData.caseNumber,
                    Title = caseData.title,
                    CourtName = caseData.courtName,
                    CourtCaseNumber = caseData.courtCaseNumber,
                    Status = caseData.status.ToString(),
                    Type = caseData.type.ToString(),
                    OpposingParty = caseData.opposingParty,
                    OpposingCounsel = caseData.opposingCounsel,
                    Judge = caseData.judge
                };

                if (caseData.filingDate != null)
                {
                    caseInfo.FilingDate = caseData.filingDate;
                }

                return caseInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching case information for case ID: {CaseId}", caseId);
                throw new InvalidOperationException($"Failed to retrieve case information: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Get law firm information
        /// </summary>
        /// <param name="firmId">ID of the law firm</param>
        /// <returns>Firm information</returns>
        public async Task<FirmInfo> GetFirmInfoAsync(int firmId)
        {
            try
            {
                _logger.LogInformation("Fetching firm information for firm ID: {FirmId}", firmId);

                var response = await _httpClient.GetAsync($"{_mainApiUrl}/api/lawfirms/{firmId}");
                response.EnsureSuccessStatusCode();

                var firmData = await response.Content.ReadFromJsonAsync<dynamic>();

                // Map the data from the main API to our FirmInfo model
                var firmInfo = new FirmInfo
                {
                    Id = firmId,
                    Name = firmData.name,
                    TaxId = firmData.taxId,
                    Phone = firmData.phone,
                    Email = firmData.email,
                    Website = firmData.website,
                    Address = new AddressInfo
                    {
                        Street = firmData.address?.street,
                        City = firmData.address?.city,
                        State = firmData.address?.state,
                        ZipCode = firmData.address?.zipCode,
                        Country = firmData.address?.country
                    }
                };

                return firmInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching firm information for firm ID: {FirmId}", firmId);
                throw new InvalidOperationException($"Failed to retrieve firm information: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Get user/lawyer information
        /// </summary>
        /// <param name="userId">ID of the user</param>
        /// <returns>User information</returns>
        public async Task<UserInfo> GetUserInfoAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Fetching user information for user ID: {UserId}", userId);

                var response = await _httpClient.GetAsync($"{_mainApiUrl}/api/users/{userId}");
                response.EnsureSuccessStatusCode();

                var userData = await response.Content.ReadFromJsonAsync<dynamic>();

                // Map the data from the main API to our UserInfo model
                var userInfo = new UserInfo
                {
                    Id = userId,
                    FirstName = userData.firstName,
                    LastName = userData.lastName,
                    Email = userData.email,
                    Role = userData.role
                };

                // If it's a lawyer, get additional information
                if (userData.role == "Lawyer")
                {
                    var lawyerResponse = await _httpClient.GetAsync($"{_mainApiUrl}/api/lawyers/byuser/{userId}");
                    if (lawyerResponse.IsSuccessStatusCode)
                    {
                        var lawyerData = await lawyerResponse.Content.ReadFromJsonAsync<dynamic>();
                        userInfo.Title = lawyerData.title;
                        userInfo.BarNumber = lawyerData.barNumber;
                    }
                }

                return userInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user information for user ID: {UserId}", userId);
                throw new InvalidOperationException($"Failed to retrieve user information: {ex.Message}", ex);
            }
        }
    }
}
