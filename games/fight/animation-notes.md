# 歩行・しゃがみ攻撃の制作メモ

組み込み画像生成を使用。公開中のオリジナル3キャラのPNGを参照し、外部の有料APIや購入素材は使用していません。

最終素材（既存の素材配信リポジトリに保存・公開）:

- `/workspace/sites/rei-shared-ranking/public/fighters/rei-motion-v1.png`
- `/workspace/sites/rei-shared-ranking/public/fighters/nattsun-motion-v1.png`
- `/workspace/sites/rei-shared-ranking/public/fighters/chappy-motion-v1.png`

3枚とも1536×1024、RGBA、透過あり。4歩行コマとしゃがみP・Kの専用ポーズを収録。元のPNGは加工せず、ゲームのCanvas描画時に各ポーズの領域と足元位置を設定。

## 最終プロンプトの共通指定

Create a transparent PNG fighting-game sprite sheet, 1536x1024, THREE columns TWO rows, six isolated full-body sprites all facing RIGHT in 512x512 cells. Same original character, costume, face, body/head proportions and cel-shaded polished style as input reference. Real alpha transparency, no scenery, no text/cell labels/lines/shadows. Four WALK CYCLE frames in reading order top-left, top-middle, top-right, bottom-left. IMPORTANT: explicitly alternate which leg leads! Frame1: near leg forward with toe x350, far leg back toe x180. Frame2: passing pose with feet close to x255, rear knee raised, not a wide stance. Frame3: REVERSE frame1, near leg back toe x180, far leg forward toe x350. Frame4: opposite passing pose, the other knee raised and feet near x255. Counter-swing the arms to the stepping legs. Keep shoulders aligned and torso location stable, planted foot baseline y480, root center x256 in EACH cell, walking height about450px. Bottom-middle: deep CROUCHING PUNCH to the RIGHT, both knees bent, normal-sized body/head, torso/head lowered naturally about300px total height, one hand guarding, punching fist extended near cell x405,y345, feet on baseline480. Bottom-right: deep CROUCHING LOW KICK to the RIGHT, one bent supporting knee, other leg horizontal near the ground, extended toe near x465,y355, normal proportions about300px total height, feet on baseline480. These must be crouch attacks, not standing attacks or tiny squashed versions. Keep each whole sprite entirely inside its cell. EXACTLY six sprites, no extras. No licensed-game costumes or third-party marks.

## 各キャラの指定（共通指定の前に追加）

- `Use case: identity-preserve. 月城麗: long black hair, gray uniform blazer, white blouse, blue ribbon, dark pleated skirt, opaque black tights, loafers.` 参照: `rei-atlas-v1.png`。
- `Use case: identity-preserve. ナッツんjp: the peanut mascot with peanut-textured head, cheerful face, black cap and black hoodie, black pants and gold/black sneakers. Preserve the original cap inscription ナッツんjp, no other logos. Adjust low punch fist near x405,y345 and low kick toe x450,y355.` 参照: `nattsun-atlas-v1.png`。
- `Use case: identity-preserve. チャッピー: brown bob hair, cyan small hair ornament, black hoodie with cyan trim, black pants, fingerless black gloves, black/cyan sneakers. Low kick extended toe near x485,y355.` 参照: `chappy-atlas-v1.png`。

## 検証

`motion.test.cjs` は4コマ切替、停止・壁での歩行停止、しゃがみP/Kの専用画像選択、縦0.35倍の縮小を行わないことを検証。既存のcombat/gamepad/renderテストも実行。画像は生成時の配置ずれがあるため、描画用の領域・足元・倍率をポーズ別に補正しています。
