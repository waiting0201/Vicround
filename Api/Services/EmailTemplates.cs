using System.Net;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services;

/// <summary>
/// 交易信的外框與共用零件。
///
/// <para>
/// <b>刻意用行內樣式的表格排版</b>：郵件客戶端（尤其 Outlook）對 <c>&lt;style&gt;</c> 區塊與
/// flex/grid 的支援零散，信件排版的規則和網頁不是同一套。這裡只保留最保守的子集，
/// 顏色取自設計系統的主色，寬度固定 600px。
/// </para>
///
/// <para>
/// 文案雙語且**不進翻譯表**：這是系統信，不是編輯者維護的內容
/// （CLAUDE.md 的「i18n via translation tables」講的是內容實體）。兩種語系都只有寥寥數句，
/// 放在這裡讓「信怎麼寫」和「什麼時候寄」留在同一個檔案裡看得完。
/// </para>
/// </summary>
public static class EmailTemplates
{
    private const string Purple = "#6436ef";
    private const string Ink = "#14141f";
    private const string Muted = "#5a5a6e";

    public static bool IsChinese(string? culture) =>
        !string.IsNullOrWhiteSpace(culture)
        && culture.StartsWith(CultureCodes.TraditionalChinese, StringComparison.OrdinalIgnoreCase);

    /// <summary>HTML 外框。<paramref name="bodyHtml"/> 必須已經跳脫過。</summary>
    public static string Layout(string heading, string bodyHtml, string culture)
    {
        var footer = IsChinese(culture)
            ? "這封信由 VicRound 盈絲實業的網站自動寄出，請勿直接回覆。"
            : "This message was sent automatically by the VicRound website. Please do not reply.";

        return $"""
            <!doctype html>
            <html lang="{(IsChinese(culture) ? "zh-Hant" : "en")}">
            <body style="margin:0;padding:24px;background:#f4f4f7;font-family:'Helvetica Neue',Arial,'Noto Sans TC',sans-serif;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px;background:{Ink};">
                    <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.02em;">VicRound</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:{Ink};font-weight:600;">{Escape(heading)}</h1>
                    {bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px 28px;border-top:1px solid #e6e6ee;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:{Muted};">{Escape(footer)}</p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }

    public static string Paragraph(string text) =>
        $"""<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:{Ink};">{Escape(text)}</p>""";

    public static string Button(string label, string href) =>
        $"""
        <p style="margin:24px 0;">
          <a href="{Escape(href)}" style="display:inline-block;padding:14px 28px;background:{Purple};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">{Escape(label)}</a>
        </p>
        """;

    /// <summary>連結按鈕點不開時的備援：把完整網址原樣列出來。</summary>
    public static string FallbackLink(string href, string culture)
    {
        var lead = IsChinese(culture)
            ? "按鈕無法點擊時，請複製以下網址到瀏覽器開啟："
            : "If the button does not work, copy this address into your browser:";

        return $"""
            <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:{Muted};">{Escape(lead)}</p>
            <p style="margin:0 0 14px;font-size:13px;line-height:1.6;word-break:break-all;"><a href="{Escape(href)}" style="color:{Purple};">{Escape(href)}</a></p>
            """;
    }

    /// <summary>名稱—值的兩欄列表，詢問單通知信用它列出表單內容。</summary>
    public static string DefinitionList(IEnumerable<(string Label, string Value)> rows)
    {
        var cells = rows.Select(row => $"""
            <tr>
              <td style="padding:6px 12px 6px 0;font-size:13px;color:{Muted};vertical-align:top;white-space:nowrap;">{Escape(row.Label)}</td>
              <td style="padding:6px 0;font-size:14px;color:{Ink};vertical-align:top;">{Escape(row.Value)}</td>
            </tr>
            """);

        return $"""<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">{string.Concat(cells)}</table>""";
    }

    public static string Escape(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);
}
