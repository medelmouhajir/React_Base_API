using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared_Models.Juridictions
{
    public class Juridiction
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
        public int Portal_Identifier { get; set; }
    }
}
