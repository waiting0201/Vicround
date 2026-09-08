using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Seeding.ContentImport;

public sealed partial class ContentImportSeeder
{
    // ── 02 產品目錄 ─────────────────────────────────────────────────────────

    private async Task ImportCategoriesAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var lines = source.TryExport("product-lines", "PRODUCT_LINES");
        if (lines is null)
        {
            return;
        }

        var solutionIds = await db.Solutions.ToDictionaryAsync(s => s.Slug, s => s.Id, cancellationToken);

        foreach (var (slug, node) in lines)
        {
            var category = await db.Categories
                .AsTracking()
                .Include(c => c.Translations)
                .SingleOrDefaultAsync(c => c.Slug == slug, cancellationToken);

            if (category is null || node is null)
            {
                logger.LogWarning("資料庫沒有產品線 {Slug}，略過。", slug);
                continue;
            }

            var banner = node.Prop("banner");
            var overview = node.Prop("overview");

            foreach (var translation in category.Translations)
            {
                var culture = translation.Culture;
                Fill(() => translation.Summary, v => translation.Summary = v, banner.LocAny("description"), culture);
                Fill(() => translation.Intro, v => translation.Intro = v, overview.Arr("paragraphs").ToHtml(culture), culture);
                Fill(() => translation.Description, v => translation.Description = v, node.Prop("families").LocAny("lead"), culture);
            }

            await AddOwnedBlocksAsync(node, cancellationToken,
                block => block.OwnerCategoryId = category.Id,
                existing: await db.ContentBlocks
                    .Where(b => b.OwnerCategoryId == category.Id)
                    .Select(b => b.Anchor)
                    .ToListAsync(cancellationToken),
                specs:
                [
                    new("banner", BlockType.Hero, "banner"),
                    new("overview", BlockType.StatBand, "overview"),
                    new("families", BlockType.ProductGrid, "families"),
                    new("cta", BlockType.Cta, "cta"),
                ]);

            await ImportSpecificationRowsAsync(node.Prop("specs"), cancellationToken, row => row.OwnerCategoryId = category.Id);
            await ImportFamiliesAsync(node.Prop("families"), category.Id, cancellationToken);

            // 產品線頁的「Where it is used」。
            var linked = await db.SolutionCategories
                .Where(sc => sc.CategoryId == category.Id)
                .Select(sc => sc.SolutionId)
                .ToListAsync(cancellationToken);

            var order = 0;
            foreach (var solutionSlug in node.Arr("solutions") ?? [])
            {
                var key = solutionSlug?.GetValue<string>();
                if (key is null || !solutionIds.TryGetValue(key, out var solutionId) || linked.Contains(solutionId))
                {
                    continue;
                }

                db.SolutionCategories.Add(new SolutionCategory
                {
                    SolutionId = solutionId,
                    CategoryId = category.Id,
                    SortOrder = order++,
                });
                Count("產品線 × 產業關聯");
            }

            await db.SaveChangesAsync(cancellationToken);
            db.ChangeTracker.Clear();
        }
    }

    /// <summary>產品線頁的系列卡（AG、VR-AC 110…）＝ <c>Products</c> 的 family 層。</summary>
    private async Task ImportFamiliesAsync(JsonNode? families, int categoryId, CancellationToken cancellationToken)
    {
        var existing = await db.Products.Select(p => p.Slug).ToListAsync(cancellationToken);

        // 同上：冪等鍵取「這個產品線底下的系列名稱」，不是 slug。
        var imported = await db.Products
            .Where(p => p.CategoryId == categoryId)
            .Join(db.ProductTranslations.Where(t => t.Culture == CultureCodes.English),
                p => p.Id, t => t.ProductId, (_, t) => t.Name)
            .ToListAsync(cancellationToken);

        var order = 0;
        var added = 0;

        foreach (var item in families.Arr("items") ?? [])
        {
            var name = item.LocAny("name");
            var code = item.Str("code");
            order++;

            if (name is null || imported.Contains(name.Value.En))
            {
                continue;
            }

            var slug = UniqueSlug(code ?? name.Value.En, existing);
            if (slug is null)
            {
                continue;
            }

            var product = new Product
            {
                Slug = slug,
                CategoryId = categoryId,
                Code = code,
                Status = ContentStatus.Published,
                SortOrder = order,
                PublishedAt = DateTime.UtcNow,
            };

            // 卡片上的 chip（AG / AF / Privacy）沒有「值」，塞不進 SpecificationRows
            // （Label + Value 都是必填），因此併進 ApplicationNote 保留原文。
            var tags = item.Arr("tags");

            AddBilingual(product.Translations, culture => new ProductTranslation
            {
                Culture = culture,
                Name = name.Value.For(culture),
                Summary = item.LocAny("body")?.For(culture),
                ApplicationNote = tags is null
                    ? null
                    : string.Join(" · ", tags.Select(t => t.Loc()?.For(culture)).Where(t => t is not null)),
            });

            db.Products.Add(product);
            existing.Add(slug);
            imported.Add(name.Value.En);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        Count("產品系列", added);
    }

    private async Task ImportSpecificationRowsAsync(
        JsonNode? specs,
        CancellationToken cancellationToken,
        Action<SpecificationRow> setOwner)
    {
        var rows = specs.Arr("rows");
        if (rows is null)
        {
            return;
        }

        var probe = new SpecificationRow();
        setOwner(probe);

        var alreadyImported = await db.SpecificationRows.AnyAsync(
            r => r.OwnerCategoryId == probe.OwnerCategoryId
              && r.OwnerSolutionId == probe.OwnerSolutionId
              && r.OwnerProductId == probe.OwnerProductId,
            cancellationToken);

        if (alreadyImported)
        {
            return;
        }

        var order = 0;
        foreach (var item in rows)
        {
            var row = new SpecificationRow
            {
                Status = ContentStatus.Published,
                SortOrder = order++,
                PublishedAt = DateTime.UtcNow,
            };
            setOwner(row);

            AddBilingual(row.Translations, culture => new SpecificationRowTranslation
            {
                Culture = culture,
                Label = item.LocAny("property", "label")?.For(culture) ?? string.Empty,
                Value = item.LocAny("value")?.For(culture) ?? string.Empty,
                Note = item.LocAny("note")?.For(culture),
            });

            db.SpecificationRows.Add(row);
            Count("規格列");
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
    }

    // ── 03 產業解決方案 ─────────────────────────────────────────────────────

    private async Task ImportSolutionsAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var pages = source.TryExport("solution-pages", "SOLUTION_PAGES");
        if (pages is null)
        {
            return;
        }

        foreach (var (slug, node) in pages)
        {
            var solution = await db.Solutions
                .AsTracking()
                .Include(s => s.Translations)
                .SingleOrDefaultAsync(s => s.Slug == slug, cancellationToken);

            if (solution is null || node is null)
            {
                logger.LogWarning("資料庫沒有產業 {Slug}，略過。", slug);
                continue;
            }

            if (string.IsNullOrEmpty(solution.IconName))
            {
                solution.IconName = node.Str("icon");
            }

            var banner = node.Prop("banner");
            var challenge = node.Prop("challenge");

            foreach (var translation in solution.Translations)
            {
                var culture = translation.Culture;
                Fill(() => translation.Summary, v => translation.Summary = v, banner.LocAny("description"), culture);
                Fill(() => translation.ChallengeTitle, v => translation.ChallengeTitle = v, challenge.LocAny("title"), culture);
                Fill(() => translation.ChallengeBody, v => translation.ChallengeBody = v, challenge.Arr("paragraphs").ToHtml(culture), culture);
                Fill(() => translation.Description, v => translation.Description = v, node.Prop("materials").LocAny("lead"), culture);
            }

            await AddOwnedBlocksAsync(node, cancellationToken,
                block => block.OwnerSolutionId = solution.Id,
                existing: await db.ContentBlocks
                    .Where(b => b.OwnerSolutionId == solution.Id)
                    .Select(b => b.Anchor)
                    .ToListAsync(cancellationToken),
                specs:
                [
                    new("banner", BlockType.Hero, "banner"),
                    new("materials", BlockType.FeatureGrid, "materials"),
                    new("why", BlockType.StatBand, "why"),
                    new("cta", BlockType.Cta, "cta"),
                ]);

            await ImportSpecificationRowsAsync(node.Prop("specs"), cancellationToken, row => row.OwnerSolutionId = solution.Id);

            await db.SaveChangesAsync(cancellationToken);
            db.ChangeTracker.Clear();
        }
    }

    private async Task AddOwnedBlocksAsync(
        JsonNode node,
        CancellationToken cancellationToken,
        Action<ContentBlock> setOwner,
        List<string?> existing,
        BlockSpec[] specs)
    {
        var order = existing.Count;

        foreach (var spec in specs)
        {
            if (existing.Contains(spec.Anchor) || node[spec.Section] is not { } section)
            {
                continue;
            }

            var block = BuildBlock(section, spec.Type, spec.Anchor, spec.Tone, order++);
            setOwner(block);
            db.ContentBlocks.Add(block);
            Count("版塊");
            Count("版塊子項", block.Items.Count);
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
    }

    // ── 04 技術與製程 ───────────────────────────────────────────────────────

    private async Task ImportProcessFlowsAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var technologies = source.TryExport("technologies", "technologies");
        var partnership = source.TryExport("partnership", "partnership");
        var contact = source.TryExport("contact", "contact");
        var lines = source.TryExport("product-lines", "PRODUCT_LINES");

        var flows = new List<(string Slug, ProcessFlowKind Kind, JsonNode? Section, string? OwnerCategorySlug)>
        {
            ("core-processes", ProcessFlowKind.CoreProcess, ((JsonNode?)technologies).Prop("core"), null),
            ("co-development", ProcessFlowKind.CoDevelopment, ((JsonNode?)technologies).Prop("innovation"), null),
            ("oem-odm", ProcessFlowKind.OemOdm, ((JsonNode?)partnership).Prop("oem"), null),
            ("inquiry-flow", ProcessFlowKind.InquiryFlow, ((JsonNode?)contact).Prop("process"), null),
        };

        foreach (var (slug, node) in lines ?? [])
        {
            flows.Add(($"manufacturing-{slug}", ProcessFlowKind.Manufacturing, node?["process"], slug));
        }

        var categories = await db.Categories.ToDictionaryAsync(c => c.Slug, c => c.Id, cancellationToken);
        var existing = await db.ProcessFlows.Select(f => f.Slug).ToListAsync(cancellationToken);

        foreach (var (slug, kind, section, ownerSlug) in flows)
        {
            // 共同開發流程的步驟在 flow 欄位，其餘在 steps。
            var steps = section.ArrAny("steps", "flow");
            if (section is null || steps is null || existing.Contains(slug))
            {
                continue;
            }

            var flow = new ProcessFlow
            {
                Slug = slug,
                Kind = kind,
                OwnerCategoryId = ownerSlug is not null && categories.TryGetValue(ownerSlug, out var id) ? id : null,
                Status = ContentStatus.Published,
                SortOrder = (int)kind,
                PublishedAt = DateTime.UtcNow,
            };

            AddBilingual(flow.Translations, culture => new ProcessFlowTranslation
            {
                Culture = culture,
                Title = section.LocAny("title", "flowTitle")?.For(culture) ?? slug,
                Subtitle = section.LocAny("lead")?.For(culture),
                Intro = section.LocAny("body")?.For(culture),
            });

            byte number = 1;
            foreach (var item in steps)
            {
                var step = new ProcessStep
                {
                    StepNumber = number,
                    IconName = item.Str("icon"),
                    AccentColorHex = Hex(item.Str("bar")),
                    Status = ContentStatus.Published,
                    SortOrder = number - 1,
                    PublishedAt = DateTime.UtcNow,
                };

                AddBilingual(step.Translations, culture => new ProcessStepTranslation
                {
                    Culture = culture,
                    Title = item.LocAny("title", "name")?.For(culture) ?? string.Empty,
                    Body = item.LocAny("body", "note")?.For(culture),
                });

                flow.Steps.Add(step);
                number++;
            }

            db.ProcessFlows.Add(flow);
            existing.Add(slug);
            Count("製程流程");
            Count("製程步驟", flow.Steps.Count);
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
    }

    // ── 08 公司資訊 ─────────────────────────────────────────────────────────

    private async Task ImportCompanyAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var testimonials = source.TryExport("partnership", "partnership").Prop("testimonials").Arr("items");

        if (testimonials is not null && !await db.Testimonials.AnyAsync(cancellationToken))
        {
            var order = 0;
            foreach (var item in testimonials)
            {
                var testimonial = new Testimonial
                {
                    Status = ContentStatus.Published,
                    SortOrder = order++,
                    PublishedAt = DateTime.UtcNow,
                };

                AddBilingual(testimonial.Translations, culture => new TestimonialTranslation
                {
                    Culture = culture,
                    Quote = item.LocAny("quote")?.For(culture) ?? string.Empty,
                    // 具名需客戶書面授權，來源目前只有職稱／公司類型（database.md §08）。
                    AuthorTitle = item.LocAny("author")?.For(culture),
                });

                db.Testimonials.Add(testimonial);
                Count("客戶推薦");
            }

            await db.SaveChangesAsync(cancellationToken);
            db.ChangeTracker.Clear();
        }

        // Milestones 與 Downloads 刻意不建，理由見 ImportAsync 的收尾說明。
        var history = source.TryExport("about", "about").Prop("history").Arr("items");
        if (history is not null && !await db.Milestones.AnyAsync(cancellationToken))
        {
            logger.LogWarning(
                "about.history 的 {Count} 則歷程仍是「[Add …]」佔位文字且沒有年份，" +
                "Milestones.Year 是必填，因此不建 Milestones 列（內容先留在 about 頁的版塊裡）。",
                history.Count);
        }

        var downloads = source.TryExport("resources", "resources").Prop("downloads").Arr("items");
        if (downloads is not null && !await db.Downloads.AnyAsync(cancellationToken))
        {
            logger.LogWarning(
                "resources.downloads 的 {Count} 份規格書沒有實際檔案，而 Downloads.MediaAssetId 是必填，" +
                "因此不建 Downloads 列（清單先留在 resources 頁的版塊裡）。",
                downloads.Count);
        }
    }
}
