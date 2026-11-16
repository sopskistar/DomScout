# DomScout design system

Owner constraints: white/orange, dense research workspace, honest data. Operate mode. A persistent evidence column is the signature: choosing a row immediately exposes provenance, unknown inputs and manual-review status. No fake counters or sales.

Primitives: white #FFFFFF, ground #F8F9FA, charcoal #18181B, secondary #52525B, border #E4E4E7, orange #F97316 (large mark only), deep orange #C2410C (white-button text contrast), soft orange #FFF2E8, red #B91C1C, green #166534. Semantic tokens map surface/text/accent/danger/positive. Component tokens map button background, row selection and filter surface.

Typography: self-hosted IBM Plex Sans (OFL) when available; system sans as offline fallback for this Operate surface. 14/16px body, 12/13px data metadata, 28/36px page titles, tabular numerals. No tracked capitals or decorative monospace labels. 4/8/12/16/24/32 spacing tokens. Border-based separation; no card grids or gradients. 8px control radius. 44px touch targets.

Desktop: slim sidebar for research/workspace/operations, search header, query toolbar, horizontally scrollable table and evidence panel. Tablet: evidence below list; mobile: compact nav and stacked row summaries with expandable evidence. Max shell 1520px centered. Filter state in URL. Native dialog for protected forms only, labeled focus and escape.

Motion: 120ms color/opacity feedback, 160ms disclosure transform; no entrance orchestration. Reduced motion sets durations to 0. Focus outline immediate. Loading/empty/error/success explicit.

Public mode empty until approved data imported; sample button explicit fixture isolation. Unknown shown as Unknown, never a zero or clean badge. Trademark not checked disclaimer on relevant records and alerts.
