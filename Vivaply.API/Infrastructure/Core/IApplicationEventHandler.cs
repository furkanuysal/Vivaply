namespace Vivaply.API.Infrastructure.Core
{
    public interface IApplicationEventHandler<in TEvent>
        where TEvent : IApplicationEvent
    {
        Task HandleAsync(TEvent appEvent, CancellationToken cancellationToken = default);
    }
}
