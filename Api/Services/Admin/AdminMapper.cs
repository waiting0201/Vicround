using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using VicRound.Api.Common;

namespace VicRound.Api.Services.Admin;

/// <summary>
/// 後台的 JSON ↔ 實體對映。
///
/// <para>
/// 欄位名一律 camelCase（對外）↔ PascalCase（實體），enum 一律字串（database.md §16）。
/// 允許寫入的欄位<b>只來自 EF 的模型中繼資料</b>——請求送來的鍵若不在模型裡就直接忽略，
/// 所以前端多送一個欄位不會變成 SQL 注入或意外寫入。
/// </para>
/// </summary>
public static class AdminMapper
{
    /// <summary>不接受從外部寫入的欄位：主鍵與時間戳由系統決定。</summary>
    private static readonly HashSet<string> ReadOnlyProperties =
        new(StringComparer.OrdinalIgnoreCase) { "Id", "CreatedAt", "UpdatedAt", "PasswordHash", "SecurityStamp" };

    /// <summary>
    /// <b>永遠不回給前端的欄位</b>。密碼雜湊與 token 雜湊即使只在後台畫面上，
    /// 也沒有任何理由離開資料庫——它們一旦出現在回應裡，就會躺在瀏覽器的快取與記錄裡。
    /// </summary>
    private static readonly HashSet<string> HiddenProperties =
        new(StringComparer.OrdinalIgnoreCase) { "PasswordHash", "SecurityStamp", "TokenHash", "ReplacedByTokenHash" };

    public static string Camel(string name) => char.ToLowerInvariant(name[0]) + name[1..];

    public static string Pascal(string name) => char.ToUpperInvariant(name[0]) + name[1..];

    /// <summary>DB 讀回來的一列 → 對外的 JSON 物件。</summary>
    public static Dictionary<string, object?> ToRow(IDictionary<string, object?> source, IEntityType entityType)
    {
        var row = new Dictionary<string, object?>(StringComparer.Ordinal);

        foreach (var property in entityType.GetProperties())
        {
            if (HiddenProperties.Contains(property.Name))
            {
                continue;
            }

            // EF 10 的欄位名要透過 StoreObject 取；多數欄位與屬性同名，但 owned／改名的不是。
            var column = property.GetColumnName(StoreObjectIdentifier.Create(entityType, StoreObjectType.Table)!.Value)
                ?? property.Name;

            if (!source.TryGetValue(column, out var value))
            {
                continue;
            }

            row[Camel(property.Name)] = ToJsonValue(value, property.ClrType);
        }

        // 後台一律以字串當 id，而且**每一列都要有**：實體的鍵有 int / Guid / string 三種，
        // 名字也不見得叫 Id（SiteSettings 的鍵是 Key）。前端的清單、路由與快取鍵都靠它。
        var key = entityType.FindPrimaryKey()?.Properties[0];

        if (key is not null && row.TryGetValue(Camel(key.Name), out var keyValue))
        {
            row["id"] = keyValue?.ToString();
        }

        return row;
    }

    /// <summary>值的對外形狀：enum → camelCase 字串、時間 → ISO 8601、Guid → 字串。</summary>
    public static object? ToJsonValue(object? value, Type clrType)
    {
        if (value is null or DBNull)
        {
            return null;
        }

        var target = Nullable.GetUnderlyingType(clrType) ?? clrType;

        if (target.IsEnum)
        {
            // DB 存 tinyint，讀回來是 byte
            var name = Enum.GetName(target, Convert.ChangeType(value, Enum.GetUnderlyingType(target), CultureInfo.InvariantCulture));
            return name is null ? value : Camel(name);
        }

        return value switch
        {
            DateTime time => time.ToString("O", CultureInfo.InvariantCulture),
            DateOnly date => date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            Guid guid => guid.ToString(),
            _ => value,
        };
    }

    /// <summary>把請求裡的一個欄位值轉成實體屬性的型別。</summary>
    public static object? ToClrValue(JsonElement value, Type clrType, string field)
    {
        var target = Nullable.GetUnderlyingType(clrType) ?? clrType;
        var nullable = Nullable.GetUnderlyingType(clrType) is not null || !clrType.IsValueType;

        if (value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
        {
            return nullable ? null : throw Invalid(field, "不可為空");
        }

        // 空字串當成「清空」——後台的文字欄位清空時送的是 ""。
        if (value.ValueKind == JsonValueKind.String && value.GetString()!.Length == 0 && target != typeof(string))
        {
            return nullable ? null : throw Invalid(field, "不可為空");
        }

        try
        {
            if (target.IsEnum)
            {
                return value.ValueKind == JsonValueKind.Number
                    ? Enum.ToObject(target, value.GetInt32())
                    : Enum.Parse(target, Pascal(value.GetString()!), ignoreCase: true);
            }

            if (target == typeof(string))
            {
                return value.ValueKind == JsonValueKind.String ? value.GetString() : value.ToString();
            }

            if (target == typeof(bool))
            {
                return value.ValueKind switch
                {
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.String => bool.Parse(value.GetString()!),
                    _ => throw Invalid(field, "必須是 true / false"),
                };
            }

            if (target == typeof(Guid))
            {
                return Guid.Parse(value.GetString()!);
            }

            if (target == typeof(DateOnly))
            {
                return DateOnly.Parse(value.GetString()!, CultureInfo.InvariantCulture);
            }

            if (target == typeof(DateTime))
            {
                return DateTime.Parse(
                    value.GetString()!, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal);
            }

            var raw = value.ValueKind == JsonValueKind.String ? value.GetString()! : value.ToString();
            return Convert.ChangeType(raw, target, CultureInfo.InvariantCulture);
        }
        catch (Exception e) when (e is FormatException or ArgumentException or OverflowException or InvalidOperationException)
        {
            throw Invalid(field, $"格式不正確（需要 {target.Name}）");
        }
    }

    /// <summary>把請求的欄位寫進實體。回傳實際有被改到的屬性名（PascalCase）。</summary>
    public static List<string> Apply(object entity, IEntityType entityType, JsonElement body)
    {
        var changed = new List<string>();

        foreach (var property in entityType.GetProperties())
        {
            if (ReadOnlyProperties.Contains(property.Name) || property.IsShadowProperty())
            {
                continue;
            }

            if (!body.TryGetProperty(Camel(property.Name), out var value))
            {
                continue;
            }

            var info = entityType.ClrType.GetProperty(property.Name);
            if (info is null || !info.CanWrite)
            {
                continue;
            }

            info.SetValue(entity, ToClrValue(value, info.PropertyType, Camel(property.Name)));
            changed.Add(property.Name);
        }

        return changed;
    }

    public static AppException Invalid(string field, string reason) =>
        AppException.BadRequest(ErrorCodes.ValidationFormat, $"{field}：{reason}。");
}
