using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models
{
    public class TemplateVariable
    {
        /// <summary>
        /// Name of the variable as it appears in the template (e.g., "{{ClientName}}")
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        /// <summary>
        /// Display name for the variable
        /// </summary>
        [StringLength(100)]
        public string DisplayName { get; set; }

        /// <summary>
        /// Description of what the variable is used for
        /// </summary>
        [StringLength(255)]
        public string Description { get; set; }

        /// <summary>
        /// Data type of the variable
        /// </summary>
        [Required]
        public VariableType Type { get; set; } = VariableType.String;

        /// <summary>
        /// Whether this variable is required
        /// </summary>
        public bool IsRequired { get; set; } = true;

        /// <summary>
        /// Default value for the variable
        /// </summary>
        public string DefaultValue { get; set; }

        /// <summary>
        /// Validation rules for the variable (e.g., regex pattern)
        /// </summary>
        public string ValidationRule { get; set; }

        /// <summary>
        /// Sample values for this variable (useful for testing)
        /// </summary>
        public string[] SampleValues { get; set; }

        /// <summary>
        /// Order/position of the variable when collecting inputs
        /// </summary>
        public int Order { get; set; }

        /// <summary>
        /// Category or group this variable belongs to
        /// </summary>
        [StringLength(50)]
        public string Group { get; set; }
    }

    /// <summary>
    /// Data types for template variables
    /// </summary>
    public enum VariableType
    {
        String,
        Number,
        Date,
        Boolean,
        Money,
        Address,
        Email,
        Phone,
        Select,
        MultiSelect,
        Text
    }
}
