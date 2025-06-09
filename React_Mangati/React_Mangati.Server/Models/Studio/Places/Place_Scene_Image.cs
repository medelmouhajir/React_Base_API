namespace React_Mangati.Server.Models.Studio.Places
{
    public class Place_Scene_Image
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public Guid Place_SceneId { get; set; }
        public virtual Place_Scene? Place_Scene { get; set; }
    }
}
