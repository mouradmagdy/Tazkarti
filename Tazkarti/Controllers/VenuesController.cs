using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tazkarti.Dtos.Venues;
using Tazkarti.Services;

namespace Tazkarti.Controllers;

[ApiController]
[Route("api/venues")]
public class VenuesController(VenueService venueService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await venueService.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
        => Ok(await venueService.GetByIdAsync(id));

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] CreateVenueDto dto)
        => StatusCode(201, await venueService.CreateVenueAsync(dto));
}
