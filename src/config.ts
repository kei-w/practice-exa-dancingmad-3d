// ゲーム設定。参照動画の俯瞰座標と発動タイミングから測定した近似値。
export const ARENA_R = 48; // フィールド半径（論理単位）
export const TARGET_CIRCLE_R = ARENA_R * 0.39; // 動画の外側線を基準にした中央ターゲットサークル半径
export const LANE_W = ARENA_R * 0.4; // 位置確認モードで表示する攻撃帯の幅
export const SHOT_R = ARENA_R * 0.28; // エクサフレア1発の半径
export const SHOT_STEPS = 7; // 1レーンを横断する発動回数
export const HIT_TIMING_LEAD = 2; // 実際の着弾判定は表示より2タイミング早く移動する
export const SHOT_PATH_START = -ARENA_R * 1.27; // 発生源側の開始位置（進行軸上）
export const SHOT_PATH_END = ARENA_R * 0.9; // 反対側の最終表示位置（進行軸上）
export const WARN_MS = 4200; // V字が約1.4秒周期で3回流れてから初弾が発動する
export const COUNTDOWN_MS = 3000; // 開始前カウントダウン
export const WAVE_GAP_MS = 2200; // ウェーブ間隔（動画測定値。前の発動中に次の予兆が重なる）
export const VOLLEY_COUNT = 6; // 1問あたりのウェーブ数
export const RUN_SPEED = 20; // プレイヤー移動速度（単位/秒）
