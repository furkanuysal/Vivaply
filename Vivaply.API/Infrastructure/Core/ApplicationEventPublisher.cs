namespace Vivaply.API.Infrastructure.Core
{
    public class ApplicationEventPublisher(IServiceProvider serviceProvider) : IApplicationEventPublisher
    {
        private readonly IServiceProvider _serviceProvider = serviceProvider;

        public async Task PublishAsync<TEvent>(
            TEvent appEvent,
            CancellationToken cancellationToken = default)
            where TEvent : class, IApplicationEvent
        {
            ArgumentNullException.ThrowIfNull(appEvent);

            var handlers = _serviceProvider.GetServices<IApplicationEventHandler<TEvent>>();

            foreach (var handler in handlers)
            {
                await handler.HandleAsync(appEvent, cancellationToken);
            }
        }
    }
}
