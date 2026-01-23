# GameBoard.tsx および周辺の品質向上計画

Lint 警告の解消と、TypeScript の型安全性の向上、および未実装だったアニメーション機能の有効化を行います。

## Proposed Changes

### 1. グローバル CSS への補助クラス追加

動的なスタイル指定をクラスに移行します。

#### [MODIFY] [globals.css](file:///C:/Users/worke/Antigravity/nivel_arena_online/app/globals.css)

- `.stack-offset-0` 〜 `.stack-offset-20`: `transform: translate(idx*2px, idx*2px)` と `z-index: idx` をセットにしたクラス。

### 2. shared/types.ts の強化

`any` を排除し、通信データの構造を明確にします。

#### [MODIFY] [shared/types.ts](file:///C:/Users/worke/Antigravity/nivel_arena_online/shared/types.ts)

- `AnimationEvent` インターフェースの改善。
- `AttackAnimationData`, `DamageAnimationData`, `DestroyAnimationData` 型の追加。

### 3. GameBoard.tsx の修正とクリーンアップ

#### [MODIFY] [GameBoard.tsx](file:///C:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **インラインスタイルの排除**:
  - `skillZone` で `stack-offset-` クラスを使用。
  - `DraggableZone` の `style` 属性を整理。
- **型エラーの解消**:
  - `any` を排除し、`shared/types.ts` で定義した型を使用。
- **アニメーションの有効化**:
  - 未使用だった `AttackAnimation`, `DamagePopup`, `DestroyAnimation` を JSX 内でレンダリング。
  - 各アニメーションコンポーネント内の未使用変数（`targetId` 等）の警告を、型安全な実装で解消。

## Verification Plan

### Automated Tests

- `npm run build` または IDE の問題一覧で、`any` や未使用変数、インラインスタイルに関する警告・エラーが消えていることを確認。

### Manual Verification

- ゲームプレイ中にアタック、ダメージ、破壊が発生した際、画面上にエフェクト（"ATTACK!", "-1", "💥" 等）が表示されることを確認。
- `Skill Zone` のカードが正しく重なっていることを確認。
