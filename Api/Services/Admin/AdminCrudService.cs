using System.Data;
using System.Text.Json;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using VicRound.Api.Common;
using VicRound.Api.Data;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Admin;

public interface IAdminCrudService
{
    Task<PagedResult<Dictionary<string, object?>>> ListAsync(AdminResource resource, IQueryCollection query, CancellationToken ct);
    Task<Dictionary<string, object?>?> GetAsync(AdminResource resource, string id, CancellationToken ct);
    Task<Dictionary<string, object?>> CreateAsync(AdminResource resource, JsonElement body, CancellationToken ct);
    Task<Dictionary<string, object?>> UpdateAsync(AdminResource resource, string id, JsonElement body, CancellationToken ct);
    Task<Dictionary<string, object?>> SaveTranslationAsync(AdminResource resource, string id, string culture, JsonElement body, CancellationToken ct);
    Task DeleteAsync(AdminResource resource, string id, CancellationToken ct);
    Task<Dictionary<string, object?>> SetStatusAsync(AdminResource resource, string id, ContentStatus status, CancellationToken ct);
    Task ReorderAsync(AdminResource resource, string[] ids, CancellationToken ct);
}

/// <summary>
/// 後台 27 個單元共用的 CRUD。
///
/// <para>
/// <b>讀走 Dapper、寫走 EF Core</b>（與公開 API 同一條規矩）：讀取要的是任意欄位組合與分頁，
/// 寫入要的是時間戳攔截器、約束轉譯與交易。允許的資料表與欄位<b>全部來自 EF 的模型中繼資料</b>，
/// 不是請求字串，所以動態 SQL 沒有注入面。
/// </para>
///
/// <para>
/// 子項與關聯（規格列、版塊、產業關聯…）一律**整組換掉**：後台的 UI 就是「編一整組再存」，
/// 逐筆 diff 只會多出中間狀態，而它們沒有獨立的生命週期。
/// </para>
/// </summary>
public sealed class AdminCrudService(
    VicRoundDbContext db,
    IDbConnection connection,
    IRevalidationService revalidation,
    IPasswordHasher passwordHasher) : IAdminCrudService
{
    private const int MaxPageSize = 200;

    /// <summary>與 <c>AdminAuthService.ChangePasswordAsync</c> 同一個下限。</summary>
    private const int MinPasswordLength = 12;

    // ── 讀 ──────────────────────────────────────────────────────────────────

    public async Task<PagedResult<Dictionary<string, object?>>> ListAsync(
        AdminResource resource, IQueryCollection query, CancellationToken ct)
    {
        var entity = Meta(resource.Entity);
        var args = new DynamicParameters();
        var where = BuildFilters(resource, entity, query, args);

        var page = int.TryParse(query["page"], out var p) && p > 0 ? p : 1;
        var pageSize = Math.Min(int.TryParse(query["pageSize"], out var s) && s > 0 ? s : 20, MaxPageSize);

        args.Add("Skip", (page - 1) * pageSize);
        args.Add("Take", pageSize);

        var total = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition($"SELECT COUNT(*) FROM {Table(entity)} e {where}", args, cancellationToken: ct));

        var rows = (await connection.QueryAsync(new CommandDefinition(
            $"""
             SELECT {Columns(entity)}
             FROM {Table(entity)} e
             {where}
             ORDER BY {OrderBy(resource, entity)}
             OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY
             """, args, cancellationToken: ct)))
            .Cast<IDictionary<string, object?>>()
            .Select(row => AdminMapper.ToRow(row, entity))
            .ToList();

        await AttachTranslationsAsync(resource, rows, ct);

        return new PagedResult<Dictionary<string, object?>>(
            rows, total, page, pageSize, (int)Math.Ceiling(total / (double)pageSize));
    }

    public async Task<Dictionary<string, object?>?> GetAsync(AdminResource resource, string id, CancellationToken ct)
    {
        var entity = Meta(resource.Entity);
        var key = KeyValue(entity, id);

        var raw = await connection.QuerySingleOrDefaultAsync(new CommandDefinition(
            $"SELECT {Columns(entity)} FROM {Table(entity)} e WHERE e.{KeyColumn(entity)} = @Id",
            new { Id = key }, cancellationToken: ct));

        if (raw is null)
        {
            return null;
        }

        var row = AdminMapper.ToRow((IDictionary<string, object?>)raw, entity);
        var rows = new List<Dictionary<string, object?>> { row };

        await AttachTranslationsAsync(resource, rows, ct);
        await AttachLinksAsync(resource, row, key, ct);
        await AttachChildrenAsync(resource, row, key, ct);

        return row;
    }

    // ── 寫 ──────────────────────────────────────────────────────────────────

    public async Task<Dictionary<string, object?>> CreateAsync(AdminResource resource, JsonElement body, CancellationToken ct)
    {
        var entity = Meta(resource.Entity);
        var instance = Activator.CreateInstance(resource.Entity)
            ?? throw new InvalidOperationException($"無法建立 {resource.Entity.Name}。");

        object id = 0;

        // 母體 + 關聯 + 子項是一次存檔。沒有交易的話，關聯「先刪後寫」中途失敗
        // 會把既有的關聯刪掉卻寫不進新的——那是真的資料遺失，不是暫時的錯誤畫面。
        //
        // 連線設了 EnableRetryOnFailure，因此交易必須包在 execution strategy 裡：
        // 重試的單位得是「整個交易」，不能是交易中的某一句。
        await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(ct);

            AdminMapper.Apply(instance, entity, body);
            ApplyIdentityRules(instance, body, isNew: true);

            db.Add(instance);
            await db.SaveChangesAsync(ct);

            id = KeyOf(instance, entity);
            await SaveLinksAndChildrenAsync(resource, id, body, ct);

            await transaction.CommitAsync(ct);
        });

        await RevalidateAsync(resource, instance, ct);

        // 讀取走 Dapper 的另一條連線，因此一定要在 commit 之後才讀得到。
        return await GetAsync(resource, id.ToString()!, ct)
            ?? throw new InvalidOperationException("剛建立的資料讀不回來。");
    }

    public async Task<Dictionary<string, object?>> UpdateAsync(
        AdminResource resource, string id, JsonElement body, CancellationToken ct)
    {
        var entity = Meta(resource.Entity);
        var key = KeyValue(entity, id);

        var instance = await FindTrackedAsync(resource.Entity, key, ct)
            ?? throw AppException.NotFound($"{resource.Slug} {id}");

        // 改 slug 等於改網址：舊路徑要在同一個交易裡變成 301，否則既有連結會直接 404
        // （database.md §0.5、docs/sitemap.md）。
        var previousPath = await PublicPathAsync(resource, instance, ct);

        await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(ct);

            AdminMapper.Apply(instance, entity, body);
            ApplyIdentityRules(instance, body, isNew: false);
            await db.SaveChangesAsync(ct);

            await SaveLinksAndChildrenAsync(resource, key, body, ct);

            var currentPath = await PublicPathAsync(resource, instance, ct);

            if (previousPath is not null && currentPath is not null && previousPath != currentPath)
            {
                await WriteRedirectAsync(previousPath, currentPath, 301, ct);
                await db.SaveChangesAsync(ct);
            }

            await transaction.CommitAsync(ct);
        });

        await RevalidateAsync(resource, instance, ct);

        return await GetAsync(resource, id, ct) ?? throw AppException.NotFound($"{resource.Slug} {id}");
    }

    /// <summary>
    /// 一個語系一列（database.md §0.2）。upsert：沒有就建，有就覆蓋送來的欄位——
    /// 後台的語系分頁就是「這一語系的完整內容」，部分更新沒有意義。
    /// </summary>
    public async Task<Dictionary<string, object?>> SaveTranslationAsync(
        AdminResource resource, string id, string culture, JsonElement body, CancellationToken ct)
    {
        if (resource.Translation is null || resource.TranslationFk is null)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, $"{resource.Slug} 沒有翻譯列。");
        }

        if (!CultureCodes.All.Contains(culture))
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, $"不支援的語系 {culture}。");
        }

        var owner = Meta(resource.Entity);
        var key = KeyValue(owner, id);
        var translationType = Meta(resource.Translation);

        var existing = await db.FindAsync(resource.Translation, [key, culture], ct);

        if (existing is not null && db.Entry(existing).State == EntityState.Detached)
        {
            db.Attach(existing);
        }

        if (existing is null)
        {
            var created = Activator.CreateInstance(resource.Translation)!;
            SetProperty(created, resource.TranslationFk, key);
            SetProperty(created, nameof(Translation.Culture), culture);
            AdminMapper.Apply(created, translationType, body);
            db.Add(created);
        }
        else
        {
            AdminMapper.Apply(existing, translationType, body);
        }

        await db.SaveChangesAsync(ct);

        if (await db.FindAsync(resource.Entity, [key], ct) is { } saved)
        {
            await RevalidateAsync(resource, saved, ct);
        }

        return await GetAsync(resource, id, ct) ?? throw AppException.NotFound($"{resource.Slug} {id}");
    }

    /// <summary>
    /// 刪除。有 <c>Status</c> 的一律**封存而不是真刪**（內容可能被別的頁面引用），
    /// 沒有狀態的小表（關聯規則、轉址）才真的刪掉。
    /// </summary>
    public async Task DeleteAsync(AdminResource resource, string id, CancellationToken ct)
    {
        var entity = Meta(resource.Entity);
        var key = KeyValue(entity, id);

        var instance = await FindTrackedAsync(resource.Entity, key, ct)
            ?? throw AppException.NotFound($"{resource.Slug} {id}");

        if (instance is ContentEntity content)
        {
            // 封存的內容不再有替代頁：寫 410 讓搜尋引擎下架，而不是留一個 404
            // 讓它一直回訪（docs/sitemap.md）。
            var path = await PublicPathAsync(resource, instance, ct);

            content.Status = ContentStatus.Archived;

            if (path is not null)
            {
                await WriteRedirectAsync(path, path, 410, ct);
            }
        }
        else
        {
            db.Remove(instance);
        }

        await db.SaveChangesAsync(ct);
        await RevalidateAsync(resource, instance, ct);
    }

    public async Task<Dictionary<string, object?>> SetStatusAsync(
        AdminResource resource, string id, ContentStatus status, CancellationToken ct)
    {
        var entity = Meta(resource.Entity);
        var key = KeyValue(entity, id);

        if (await FindTrackedAsync(resource.Entity, key, ct) is not ContentEntity content)
        {
            throw AppException.BadRequest(ErrorCodes.ConflictState, $"{resource.Slug} 沒有發布狀態。");
        }

        content.Status = status;

        // 首次發布才記時間；重新發布不覆蓋原始發布日（排序與 sitemap 都看它）。
        if (status == ContentStatus.Published)
        {
            content.PublishedAt ??= Clock.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        await RevalidateAsync(resource, content, ct);

        return await GetAsync(resource, id, ct) ?? throw AppException.NotFound($"{resource.Slug} {id}");
    }

    /// <summary>批次排序。以 10 為間距，之後插入不必整批重排。</summary>
    public async Task ReorderAsync(AdminResource resource, string[] ids, CancellationToken ct)
    {
        var entity = Meta(resource.Entity);
        var order = 0;

        foreach (var id in ids)
        {
            if (await FindTrackedAsync(resource.Entity, KeyValue(entity, id), ct) is ContentEntity content)
            {
                content.SortOrder = order;
            }

            order += 10;
        }

        await db.SaveChangesAsync(ct);
    }


    /// <summary>
    /// 取一筆<b>被追蹤的</b>實體。
    /// <para>
    /// DbContext 的預設是 <c>NoTracking</c>（公開 API 全是讀取，那是對的預設），
    /// 所以 <c>Find</c> 回來的東西改了也不會被寫回去 —— 後台的每一個寫入都得先 Attach，
    /// 之後的屬性變更才會被 <c>SaveChanges</c> 看見。
    /// </para>
    /// </summary>
    /// <summary>
    /// 後台帳號的兩件事，泛型對映做不到：帳號格式，以及<b>設定密碼</b>。
    /// <para>
    /// <c>PasswordHash</c> 永遠不接受從請求直接寫入（<c>AdminMapper</c> 的 read-only 清單），
    /// 所以密碼只能從這裡進來——後台沒有寄信管道，新帳號的密碼就是由管理員當面給，
    /// 沒有這條路徑，從後台開的帳號會是一個誰都登不進去的空殼。
    /// </para>
    /// </summary>
    private void ApplyIdentityRules(object instance, JsonElement body, bool isNew)
    {
        if (instance is not User user)
        {
            return;
        }

        user.Username = Usernames.Require(user.Username);

        var password = body.ValueKind == JsonValueKind.Object
            && body.TryGetProperty("password", out var value)
            && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;

        if (!string.IsNullOrEmpty(password))
        {
            if (password.Length < MinPasswordLength)
            {
                throw AppException.BadRequest(
                    ErrorCodes.ValidationFormat, $"密碼至少 {MinPasswordLength} 個字元。");
            }

            user.PasswordHash = passwordHasher.Hash(password);
            user.PasswordChangedAt = Clock.UtcNow;

            // 換密碼＝輪替 SecurityStamp：對方在別處的工作階段跟著失效，
            // 「幫某人重設密碼」才真的把他登出，而不是多一組能用的密碼。
            user.SecurityStamp = Guid.NewGuid();
        }
        else if (isNew)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "新帳號必須設定密碼。");
        }
    }

    private async Task<object?> FindTrackedAsync(Type type, object key, CancellationToken ct)
    {
        var instance = await db.FindAsync(type, [key], ct);

        if (instance is not null && db.Entry(instance).State == EntityState.Detached)
        {
            db.Attach(instance);
        }

        return instance;
    }


    // ── 內部：轉址與快取失效 ────────────────────────────────────────────────

    /// <summary>
    /// 這一筆內容的公開路徑（不含語系前綴）。沒有自己網址的實體回 <c>null</c>——
    /// 錨點型的（下載）不算，替它寫轉址只會produce 一條永遠不會命中的規則。
    /// </summary>
    private async Task<string?> PublicPathAsync(AdminResource resource, object instance, CancellationToken ct)
    {
        if (!resource.IsRoutable || instance is not SluggedEntity slugged || slugged.Slug.Length == 0)
        {
            return null;
        }

        return resource.Slug switch
        {
            "categories" => PublicPaths.Category(slugged.Slug),
            "solutions" => PublicPaths.Solution(slugged.Slug),
            "articles" => instance is Article article ? PublicPaths.Article(article.Type, article.Slug) : null,
            "pages" => instance is Page page ? PublicPaths.Page(page.Slug, page.PathPrefix) : null,
            "products" => await ProductPathAsync((Product)instance, ct),
            _ => null,
        };
    }

    private async Task<string?> ProductPathAsync(Product product, CancellationToken ct)
    {
        var category = await connection.ExecuteScalarAsync<string?>(new CommandDefinition(
            "SELECT Slug FROM Categories WHERE Id = @Id", new { Id = product.CategoryId }, cancellationToken: ct));

        return category is null ? null : PublicPaths.Product(category, product.Slug);
    }

    /// <summary>
    /// 寫一條轉址，並且<b>不留下鏈與環</b>（database.md §10）：
    /// 原本指向舊路徑的規則直接改指新路徑，指向自己的規則刪掉。
    /// </summary>
    private async Task WriteRedirectAsync(string from, string to, short statusCode, CancellationToken ct)
    {
        var normalized = Normalize(from);
        var target = Normalize(to);

        var existing = await db.Redirects.AsTracking().Where(r => r.FromPath == normalized || r.ToPath == normalized)
            .ToListAsync(ct);

        foreach (var rule in existing)
        {
            if (rule.FromPath == normalized)
            {
                rule.ToPath = target;
                rule.StatusCode = statusCode;
                rule.IsEnabled = true;
            }
            else if (statusCode != 410)
            {
                // 舊路徑成了別人的目標 → 把鏈壓平，改指最終目標。
                rule.ToPath = target;
            }
        }

        if (existing.All(rule => rule.FromPath != normalized))
        {
            db.Redirects.Add(new Redirect
            {
                FromPath = normalized,
                ToPath = target,
                StatusCode = statusCode,
                IsEnabled = true,
                Notes = statusCode == 410 ? "內容已封存" : "slug 變更",
            });
        }
    }

    /// <summary>比對前一律小寫、去尾斜線（與前台的 middleware 同一條規則）。</summary>
    private static string Normalize(string path) =>
        path.Length > 1 ? path.ToLowerInvariant().TrimEnd('/') : path.ToLowerInvariant();

    private async Task RevalidateAsync(AdminResource resource, object instance, CancellationToken ct)
    {
        var slug = instance is SluggedEntity slugged ? slugged.Slug : null;
        await revalidation.RevalidateAsync(RevalidationTags.For(resource.Slug, slug), ct);
    }

    // ── 內部：關聯與子項 ────────────────────────────────────────────────────

    private async Task SaveLinksAndChildrenAsync(AdminResource resource, object key, JsonElement body, CancellationToken ct)
    {
        var touched = false;

        foreach (var link in resource.LinkFields)
        {
            if (!body.TryGetProperty(link.Field, out var value) || value.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            await ReplaceLinksAsync(link, key, value, ct);
            touched = true;
        }

        foreach (var child in resource.ChildFields)
        {
            if (!body.TryGetProperty(child.Field, out var value) || value.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            await ReplaceChildrenAsync(child, key, value, ct);
            touched = true;
        }

        if (touched)
        {
            await db.SaveChangesAsync(ct);
        }
    }

    private async Task ReplaceLinksAsync(AdminLink link, object ownerKey, JsonElement ids, CancellationToken ct)
    {
        var linkType = Meta(link.LinkEntity);
        await DeleteWhereAsync(linkType, link.OwnerFk, ownerKey, ct);

        var otherProperty = linkType.ClrType.GetProperty(link.OtherFk)
            ?? throw new InvalidOperationException($"{link.LinkEntity.Name} 沒有 {link.OtherFk}。");

        var order = 0;

        foreach (var id in ids.EnumerateArray())
        {
            var row = Activator.CreateInstance(link.LinkEntity)!;
            SetProperty(row, link.OwnerFk, ownerKey);
            otherProperty.SetValue(row, AdminMapper.ToClrValue(id, otherProperty.PropertyType, link.Field));

            if (link.HasSortOrder)
            {
                SetProperty(row, "SortOrder", order);
            }

            db.Add(row);
            order++;
        }
    }

    private async Task ReplaceChildrenAsync(AdminChild child, object ownerKey, JsonElement items, CancellationToken ct)
    {
        var childType = Meta(child.Entity);
        await DeleteWhereAsync(childType, child.OwnerFk, ownerKey, ct);

        var order = 0;

        foreach (var item in items.EnumerateArray())
        {
            var row = Activator.CreateInstance(child.Entity)!;
            AdminMapper.Apply(row, childType, item);
            SetProperty(row, child.OwnerFk, ownerKey);

            if (row is ContentEntity content)
            {
                content.SortOrder = order;

                // 子項跟著母體走：母體發布、子項就該看得見，否則版塊會平白少幾列。
                if (content.Status == ContentStatus.Draft)
                {
                    content.Status = ContentStatus.Published;
                    content.PublishedAt ??= Clock.UtcNow;
                }
            }

            db.Add(row);
            order++;

            if (child.Translation is null || child.TranslationFk is null
                || !item.TryGetProperty("translations", out var translations)
                || translations.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            // 子項存檔後才有 id，因此翻譯列先掛在導覽屬性上，交給 EF 一起寫。
            var collection = child.Entity.GetProperty("Translations")?.GetValue(row) as System.Collections.IList
                ?? throw new InvalidOperationException($"{child.Entity.Name} 沒有 Translations 集合。");

            foreach (var translation in translations.EnumerateObject())
            {
                if (!CultureCodes.All.Contains(translation.Name))
                {
                    continue;
                }

                var line = Activator.CreateInstance(child.Translation)!;
                SetProperty(line, nameof(Translation.Culture), translation.Name);
                AdminMapper.Apply(line, Meta(child.Translation), translation.Value);
                collection.Add(line);
            }
        }
    }

    /// <summary>
    /// 整組換掉的第一步。走 EF 的連線，因此與後面的 <c>SaveChanges</c> 在同一個工作階段。
    /// <para>
    /// 表名與欄名來自 EF 的模型中繼資料（不是請求字串），值才是參數 ——
    /// 因此這裡的 raw SQL 沒有注入面。
    /// </para>
    /// </summary>
#pragma warning disable EF1002 // 見上方註解：識別字全部來自模型中繼資料
    private Task DeleteWhereAsync(IEntityType entity, string foreignKey, object value, CancellationToken ct) =>
        db.Database.ExecuteSqlRawAsync(
            $"DELETE FROM {Table(entity)} WHERE [{ColumnOf(entity, foreignKey)}] = {{0}}", [value], ct);
#pragma warning restore EF1002

    // ── 內部：讀取的組裝 ────────────────────────────────────────────────────

    private async Task AttachTranslationsAsync(
        AdminResource resource, List<Dictionary<string, object?>> rows, CancellationToken ct)
    {
        if (resource.Translation is null || resource.TranslationFk is null || rows.Count == 0)
        {
            return;
        }

        var translationType = Meta(resource.Translation);
        var fkColumn = ColumnOf(translationType, resource.TranslationFk);
        var ids = rows.Select(row => row["id"]).ToArray();

        var lines = (await connection.QueryAsync(new CommandDefinition(
            $"SELECT {Columns(translationType)} FROM {Table(translationType)} e WHERE e.[{fkColumn}] IN @Ids",
            new { Ids = ids }, cancellationToken: ct)))
            .Cast<IDictionary<string, object?>>()
            .ToList();

        var byOwner = lines.ToLookup(line => line[fkColumn]?.ToString());

        foreach (var row in rows)
        {
            var translations = new Dictionary<string, object?>(StringComparer.Ordinal);

            foreach (var line in byOwner[row["id"]?.ToString()])
            {
                var mapped = AdminMapper.ToRow(line, translationType);
                var culture = mapped.GetValueOrDefault("culture")?.ToString();

                if (culture is not null)
                {
                    translations[culture] = mapped;
                }
            }

            row["translations"] = translations;
        }
    }

    private async Task AttachLinksAsync(
        AdminResource resource, Dictionary<string, object?> row, object key, CancellationToken ct)
    {
        foreach (var link in resource.LinkFields)
        {
            var linkType = Meta(link.LinkEntity);
            var order = link.HasSortOrder ? "SortOrder" : ColumnOf(linkType, link.OtherFk);

            // 只選一欄，因此逐列取第一個值就是 id；用泛型 QueryAsync<object> 會拿到 DapperRow。
            var ids = (await connection.QueryAsync(new CommandDefinition(
                $"""
                 SELECT [{ColumnOf(linkType, link.OtherFk)}]
                 FROM {Table(linkType)}
                 WHERE [{ColumnOf(linkType, link.OwnerFk)}] = @Id
                 ORDER BY [{order}]
                 """, new { Id = key }, cancellationToken: ct)))
                .Cast<IDictionary<string, object?>>()
                .Select(item => item.Values.FirstOrDefault()?.ToString())
                .ToArray();

            row[link.Field] = ids;
        }
    }

    private async Task AttachChildrenAsync(
        AdminResource resource, Dictionary<string, object?> row, object key, CancellationToken ct)
    {
        foreach (var child in resource.ChildFields)
        {
            var childType = Meta(child.Entity);

            var rows = (await connection.QueryAsync(new CommandDefinition(
                $"""
                 SELECT {Columns(childType)}
                 FROM {Table(childType)} e
                 WHERE e.[{ColumnOf(childType, child.OwnerFk)}] = @Id
                   AND (e.[Status] IS NULL OR e.[Status] <> {(byte)ContentStatus.Archived})
                 ORDER BY {(HasColumn(childType, "SortOrder") ? "e.[SortOrder], " : string.Empty)}e.[{KeyColumn(childType)}]
                 """, new { Id = key }, cancellationToken: ct)))
                .Cast<IDictionary<string, object?>>()
                .Select(item => AdminMapper.ToRow(item, childType))
                .ToList();

            if (child.Translation is not null && child.TranslationFk is not null && rows.Count > 0)
            {
                await AttachTranslationsAsync(
                    new AdminResource(child.Field, child.Entity, child.Translation, child.TranslationFk), rows, ct);
            }

            row[child.Field] = rows;
        }
    }

    // ── 內部：中繼資料 ──────────────────────────────────────────────────────

    private IEntityType Meta(Type type) =>
        db.Model.FindEntityType(type) ?? throw new InvalidOperationException($"{type.Name} 不在 EF 模型裡。");

    private static string Table(IEntityType entity) => $"[{entity.GetTableName()}]";

    private static string Columns(IEntityType entity) =>
        string.Join(", ", entity.GetProperties().Select(property => $"e.[{ColumnName(property, entity)}]"));

    private static string ColumnName(IProperty property, IEntityType entity) =>
        property.GetColumnName(StoreObjectIdentifier.Create(entity, StoreObjectType.Table)!.Value) ?? property.Name;

    private static string ColumnOf(IEntityType entity, string propertyName) =>
        entity.FindProperty(propertyName) is { } property
            ? ColumnName(property, entity)
            : throw new InvalidOperationException($"{entity.ClrType.Name} 沒有屬性 {propertyName}。");

    private static bool HasColumn(IEntityType entity, string propertyName) => entity.FindProperty(propertyName) is not null;

    private static string KeyColumn(IEntityType entity) =>
        ColumnName(entity.FindPrimaryKey()!.Properties[0], entity);

    private static string OrderBy(AdminResource resource, IEntityType entity)
    {
        // 登記表寫的是屬性名；沒有那一欄的實體（例如沒有 SortOrder 的表）退回主鍵。
        var parts = resource.OrderBy.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        var usable = new List<string>();

        foreach (var part in parts)
        {
            var pieces = part.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var name = pieces[0].Trim('[', ']');

            if (entity.FindProperty(name) is null)
            {
                continue;
            }

            usable.Add($"e.[{ColumnOf(entity, name)}]{(pieces.Length > 1 ? " " + pieces[1] : string.Empty)}");
        }

        return usable.Count > 0 ? string.Join(", ", usable) : $"e.[{KeyColumn(entity)}]";
    }

    /// <summary>後台一律以字串傳 id；實體的鍵可能是 int / Guid / string。</summary>
    private static object KeyValue(IEntityType entity, string id)
    {
        var type = entity.FindPrimaryKey()!.Properties[0].ClrType;

        try
        {
            if (type == typeof(Guid)) return Guid.Parse(id);
            if (type == typeof(int)) return int.Parse(id);
            return id;
        }
        catch (FormatException)
        {
            throw AppException.NotFound($"識別碼 {id}");
        }
    }

    private static object KeyOf(object entity, IEntityType meta) =>
        meta.ClrType.GetProperty(meta.FindPrimaryKey()!.Properties[0].Name)!.GetValue(entity)!;

    private static void SetProperty(object target, string name, object? value) =>
        target.GetType().GetProperty(name)?.SetValue(target, value);

    /// <summary>
    /// 清單的篩選。<b>只認得模型裡真的有的欄位</b>，其餘查詢參數一律忽略——
    /// 前端多送一個參數不會變成 SQL 的一部分。
    /// </summary>
    private string BuildFilters(
        AdminResource resource, IEntityType entity, IQueryCollection query, DynamicParameters args)
    {
        var clauses = new List<string>();

        if (query["search"].ToString() is { Length: > 0 } search)
        {
            var columns = (resource.SearchColumns ?? [])
                .Where(name => entity.FindProperty(name) is not null)
                .Select(name => $"e.[{ColumnOf(entity, name)}] LIKE @Search")
                .ToList();

            if (resource is { Translation: not null, TranslationFk: not null, TranslationSearchColumns: not null })
            {
                var translationType = Meta(resource.Translation);
                var conditions = string.Join(" OR ", resource.TranslationSearchColumns
                    .Where(name => translationType.FindProperty(name) is not null)
                    .Select(name => $"t.[{ColumnOf(translationType, name)}] LIKE @Search"));

                if (conditions.Length > 0)
                {
                    columns.Add($"""
                        EXISTS (SELECT 1 FROM {Table(translationType)} t
                                WHERE t.[{ColumnOf(translationType, resource.TranslationFk)}] = e.[{KeyColumn(entity)}]
                                  AND ({conditions}))
                        """);
                }
            }

            if (columns.Count > 0)
            {
                clauses.Add($"({string.Join(" OR ", columns)})");
                args.Add("Search", $"%{search}%");
            }
        }

        // 「缺 zh-Hant」篩選：後台用它找還沒翻譯的內容（docs/admin-ui.md）。
        if (query["missingCulture"].ToString() is { Length: > 0 } missing
            && resource is { Translation: not null, TranslationFk: not null })
        {
            var translationType = Meta(resource.Translation);
            clauses.Add($"""
                NOT EXISTS (SELECT 1 FROM {Table(translationType)} t
                            WHERE t.[{ColumnOf(translationType, resource.TranslationFk)}] = e.[{KeyColumn(entity)}]
                              AND t.[Culture] = @MissingCulture)
                """);
            args.Add("MissingCulture", missing);
        }

        var reserved = new[] { "search", "missingCulture", "page", "pageSize", "sort", "culture" };

        foreach (var pair in query)
        {
            if (reserved.Contains(pair.Key) || pair.Value.ToString().Length == 0)
            {
                continue;
            }

            var property = entity.FindProperty(AdminMapper.Pascal(pair.Key));
            if (property is null)
            {
                continue;
            }

            var name = $"F{args.ParameterNames.Count()}";
            clauses.Add($"e.[{ColumnName(property, entity)}] = @{name}");
            args.Add(name, ToFilterValue(pair.Value.ToString(), property.ClrType, pair.Key));
        }

        return clauses.Count == 0 ? string.Empty : "WHERE " + string.Join(" AND ", clauses);
    }

    private static object? ToFilterValue(string raw, Type clrType, string field)
    {
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(raw));
        var value = AdminMapper.ToClrValue(document.RootElement, clrType, field);

        // enum 在 DB 裡是 tinyint，參數也要送數字。
        var target = Nullable.GetUnderlyingType(clrType) ?? clrType;
        return value is not null && target.IsEnum
            ? Convert.ChangeType(value, Enum.GetUnderlyingType(target))
            : value;
    }
}
