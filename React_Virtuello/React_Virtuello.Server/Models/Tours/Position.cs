using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Tours
{
    public class Position
    {
        [Range(-float.MaxValue, float.MaxValue)]
        public float X { get; set; }

        [Range(-float.MaxValue, float.MaxValue)]
        public float Y { get; set; }

        [Range(-float.MaxValue, float.MaxValue)]
        public float Z { get; set; }

        // Helper methods
        public double DistanceTo(Position other)
        {
            return Math.Sqrt(
                Math.Pow(X - other.X, 2) +
                Math.Pow(Y - other.Y, 2) +
                Math.Pow(Z - other.Z, 2)
            );
        }

        public override string ToString() => $"({X}, {Y}, {Z})";
    }
}
