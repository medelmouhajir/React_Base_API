using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared_Models._Templates
{
    public class Portal_DossiersAttache_Response
    {
        public int Code { get; set; }
        public bool Status { get; set; }
        public string? Message { get; set; }
        public List<PortalDossiersAttache> Data { get; set; } = new();
    }

    public class PortalDossiersAttache
    {
        public string natureRelation { get; set; }
        public string nomJuridiction { get; set; }
        public string numeroDossier { get; set; }
    }

    public class Portal_Parties_Response
    {
        public int Code { get; set; }
        public bool Status { get; set; }
        public string? Message { get; set; }
        public List<PortalPartie> Data { get; set; } = new();
    }

    public class PortalPartie
    {
        public int IdPartie { get; set; }
        public string CodeTypePersonne { get; set; }
        public string RolePartie { get; set; }
        public string NomPrenomPartie { get; set; }
        public int CountAvocatsPartie { get; set; }
        public int CountHuissiersPartie { get; set; }
        public int CountMandatairesPartie { get; set; }
        public int CountRepresentantsPartie { get; set; }
    }

    public class Portal_Decisions_Response
    {
        public int Code { get; set; }
        public bool Status { get; set; }
        public string? Message { get; set; }
        public List<PortalDecision> Data { get; set; } = new();
    }

    public class PortalDecision
    {
        public int IdDecision { get; set; }
        public string? DateDe { get; set; }
        public string? DateNA { get; set; }
        public string DateTimeDecision { get; set; }
        public string TypeDecision { get; set; }
        public string ContenuDecision { get; set; }
        public string? NumeroJugement { get; set; }
        public string? DateTimeNextAudience { get; set; }
    }

    public class Portal_Data_Response
    {
        public int Code { get; set; }
        public bool Status { get; set; }
        public string? Message { get; set; }
        public PortalData Data { get; set; } = new();
    }

    public class PortalData
    {
        public int IdDossierCivil { get; set; }
        public int IdDossierTF { get; set; }
        public string LibEntite { get; set; }
        public string? TypeDossier { get; set; }
        public string JugeRapporteur { get; set; }
        public string DateEnregistrementDossierDansRegistre { get; set; }
        public string TypeRequette { get; set; }
        public string NumeroCompletNationalDossier1Instance { get; set; }
        public string NumeroCompletDossier1Instance { get; set; }
        public string Juridiction1Instance { get; set; }
        public string NumeroCompletNationalDossier2Instance { get; set; }
        public string NumeroCompletDossier2Instance { get; set; }
        public string Juridiction2Instance { get; set; }
        public string ObjetDossier { get; set; }
        public string? LibelleDernierJugement { get; set; }
        public string? EtatDernierJugement { get; set; }
        public string? DateEtatJugementPret { get; set; }
        public string? DateDernierJugement { get; set; }
        public int IdDecisionDernierJugement { get; set; }
        public string Affaire { get; set; }
    }



}
