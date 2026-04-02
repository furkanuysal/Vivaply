namespace Vivaply.API.Infrastructure.Core
{
    public interface IApplicationEventPublisher
    {
        Task PublishAsync<TEvent>(TEvent appEvent, CancellationToken cancellationToken = default)
            where TEvent : class, IApplicationEvent;
    }
}
