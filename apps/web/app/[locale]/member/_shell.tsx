import type { ReactNode } from 'react';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';

/**
 * 信件流程三頁（驗證／忘記密碼／重設密碼）的共用外框。
 *
 * <p>
 * 刻意<b>不放 banner 也不放側欄</b>：使用者是從信件點進來完成一件事的，
 * 畫面上多一個導航點就多一個離開流程的機會。
 * </p>
 */
export function MemberFlowShell({ children }: { children: ReactNode }) {
  return (
    <PageShell tone="dark">
      <Container
        style={{
          padding: 'clamp(56px, 8vw, 104px) clamp(24px, 5vw, 80px)',
          maxWidth: 560,
        }}
      >
        {children}
      </Container>
    </PageShell>
  );
}
