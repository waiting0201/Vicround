using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Models.Entities;
using VicRound.Api.Services.Admin;

namespace VicRound.Api.Handlers;

/// <summary>
/// 後台內容 CRUD 的 HTTP 這一層。**27 個單元共用這一支**——差異全部在
/// <see cref="AdminResources"/> 的登記表裡（docs/cms-api.md 的 `{type}` 白名單）。
/// </summary>
public sealed class AdminContentHandler(IAdminCrudService crud)
{
    public async Task<IActionResult> ListAsync(HttpRequest req, string slug)
    {
        var resource = Resource(slug);
        var page = await crud.ListAsync(resource, req.Query, req.HttpContext.RequestAborted);

        // 後台看的是當下的資料（含草稿），一律不快取。
        CacheControl.NoStore(req.HttpContext.Response);

        return new OkObjectResult(ApiResponse.Ok(new AdminListDto(page.Items, page.Page, page.PageSize, page.TotalCount)));
    }

    public async Task<IActionResult> GetAsync(HttpRequest req, string slug, string id)
    {
        var resource = Resource(slug);
        var row = await crud.GetAsync(resource, id, req.HttpContext.RequestAborted)
            ?? throw AppException.NotFound($"{slug} {id}");

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(row));
    }

    public async Task<IActionResult> CreateAsync(HttpRequest req, string slug)
    {
        var resource = Resource(slug);
        var body = await ReadAsync(req);
        var row = await crud.CreateAsync(resource, body, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new ObjectResult(ApiResponse.Ok(row)) { StatusCode = 201 };
    }

    public async Task<IActionResult> UpdateAsync(HttpRequest req, string slug, string id)
    {
        var resource = Resource(slug);
        var body = await ReadAsync(req);
        var row = await crud.UpdateAsync(resource, id, body, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(row));
    }

    public async Task<IActionResult> SaveTranslationAsync(HttpRequest req, string slug, string id, string culture)
    {
        var resource = Resource(slug);
        var body = await ReadAsync(req);
        var row = await crud.SaveTranslationAsync(resource, id, culture, body, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(row));
    }

    public async Task<IActionResult> DeleteAsync(HttpRequest req, string slug, string id)
    {
        await crud.DeleteAsync(Resource(slug), id, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new NoContentResult();
    }

    public async Task<IActionResult> PublishAsync(HttpRequest req, string slug, string id, bool publish)
    {
        var row = await crud.SetStatusAsync(
            Resource(slug), id, publish ? ContentStatus.Published : ContentStatus.Draft, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(row));
    }

    public async Task<IActionResult> ReorderAsync(HttpRequest req, string slug)
    {
        var body = await ReadAsync(req);

        var ids = body.TryGetProperty("ids", out var value) && value.ValueKind == JsonValueKind.Array
            ? value.EnumerateArray().Select(id => id.GetString()).Where(id => id is not null).Select(id => id!).ToArray()
            : throw AppException.BadRequest(ErrorCodes.ValidationRequired, "缺少 ids。");

        await crud.ReorderAsync(Resource(slug), ids, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new NoContentResult();
    }

    /// <summary>
    /// 未登記的 <c>{type}</c> 直接 404。權限表已經先擋過一層，這裡是第二道：
    /// 兩張表都得有這個單元，端點才存在。
    /// </summary>
    private static AdminResource Resource(string slug) =>
        AdminResources.Find(slug) ?? throw AppException.NotFound($"後台單元 {slug}");

    private static async Task<JsonElement> ReadAsync(HttpRequest req)
    {
        try
        {
            using var document = await JsonDocument.ParseAsync(req.Body, cancellationToken: req.HttpContext.RequestAborted);
            return document.RootElement.Clone();
        }
        catch (JsonException)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, "請求主體必須是合法的 JSON。");
        }
    }
}

/// <summary>後台清單的回傳形狀，與 `apps/admin/src/lib/api.ts` 的 `Paged<T>` 對齊。</summary>
public sealed record AdminListDto(IEnumerable<Dictionary<string, object?>> Items, int Page, int PageSize, int Total);
