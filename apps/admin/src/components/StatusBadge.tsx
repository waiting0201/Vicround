import { Badge, type BadgeTone } from '@/ui';
import {
  CONTENT_STATUS_LABEL,
  INQUIRY_STATUS_LABEL,
  MEMBER_STATUS_LABEL,
  SAMPLE_REQUEST_STATUS_LABEL,
} from '@/lib/enums';

/**
 * 狀態值 → 顏色語意的對照表。
 *
 * <p>
 * `Badge` 刻意不認得任何 enum（見 ui/Badge.tsx），所以對照表要有一個家。放在這裡的
 * 好處是：四組狀態（內容／會員／樣品申請／詢問單）的顏色規則排在一起看得到彼此，
 * 不會出現「已核准在會員是綠色、在樣品申請卻是藍色」這種各畫面各自解讀的結果。
 * </p>
 *
 * <p>
 * 規則：**綠＝可以放著不管**（已發布、已核准、已送達、已結案）、
 * **黃＝在等人動作**（草稿、待審核、審核中、處理中）、
 * **紅＝出事或被擋下**（已拒絕、已停權、垃圾訊息）、
 * **灰＝已退場**（已封存、已取消）。
 * </p>
 */

const TONES: Record<string, BadgeTone> = {
  // 內容狀態
  draft: 'warning',
  published: 'success',
  archived: 'neutral',
  // 會員狀態
  pendingEmailVerification: 'neutral',
  pendingApproval: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'danger',
  // 樣品申請
  submitted: 'info',
  underReview: 'warning',
  shipped: 'brand',
  delivered: 'success',
  cancelled: 'neutral',
  // 詢問單
  new: 'info',
  inProgress: 'warning',
  responded: 'success',
  closed: 'neutral',
  spam: 'danger',
};

const LABELS: Record<string, string> = {
  ...CONTENT_STATUS_LABEL,
  ...MEMBER_STATUS_LABEL,
  ...SAMPLE_REQUEST_STATUS_LABEL,
  ...INQUIRY_STATUS_LABEL,
};

export function StatusBadge({ status }: { status: unknown }) {
  const value = String(status ?? '');
  if (!value) return <span className="text-[var(--fg-3)]">—</span>;

  return (
    <Badge tone={TONES[value] ?? 'neutral'} dot>
      {LABELS[value] ?? value}
    </Badge>
  );
}
