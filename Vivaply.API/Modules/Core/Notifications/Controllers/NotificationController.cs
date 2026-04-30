using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Modules.Core.Notifications.DTOs.Queries;
using Vivaply.API.Modules.Core.Notifications.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Notifications.Controllers
{
    [Authorize]
    public class NotificationController(INotificationService notificationService) : BaseApiController
    {
        private readonly INotificationService _notificationService = notificationService;

        [HttpGet("api/notifications")]
        public async Task<IActionResult> Get([FromQuery] NotificationQuery query, CancellationToken cancellationToken)
        {
            var result = await _notificationService.GetAsync(CurrentUserId, query, cancellationToken);
            return Ok(result);
        }

        [HttpGet("api/notifications/unread-count")]
        public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
        {
            var result = await _notificationService.GetUnreadCountAsync(CurrentUserId, cancellationToken);
            return Ok(result);
        }

        [HttpPost("api/notifications/{id:guid}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
        {
            var success = await _notificationService.MarkAsReadAsync(CurrentUserId, id, cancellationToken);
            return success ? NoContent() : NotFound();
        }

        [HttpPost("api/notifications/mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
        {
            var updatedCount = await _notificationService.MarkAllAsReadAsync(CurrentUserId, cancellationToken);
            return Ok(new { updatedCount });
        }
    }
}
