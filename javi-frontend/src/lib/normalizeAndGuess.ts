// // src/lib/normalizeAndGuess.ts
// // Module xử lý chuẩn hoá input tiếng Nhật và đoán từ đúng (FE-side).
// // Mục tiêu: sửa những lỗi kana cuối phổ biến (ví dụ かんがえり -> かんがえる),
// // chuẩn hoá katakana/hiragana, và trả về danh sách candidate an toàn để gửi search.

// import * as wanakana from "wanakana";

// /**
//  * Chuẩn hoá Unicode NFC và trim
//  */
// export function normalizeUnicodeNFC(s: string): string {
//   if (!s) return s;
//   // dùng built-in Normalizer nếu có
//   try {
//     return s.normalize("NFC").trim();
//   } catch {
//     return s.trim();
//   }
// }

// /**
//  * Kiểm tra xem chuỗi có chứa Katakana
//  */
// export function containsKatakana(s: string): boolean {
//   return /[\u30A0-\u30FF]/.test(s);
// }

// /**
//  * Kiểm tra xem chuỗi có chứa Hiragana
//  */
// export function containsHiragana(s: string): boolean {
//   return /[\u3040-\u309F]/.test(s);
// }

// /**
//  * Chuyển mọi input sang hiragana (dùng để so sánh âm)
//  */
// export function toHiraganaSafe(s: string): string {
//   try {
//     // wanakana tự nhận romaji/katakana -> hiragana
//     return wanakana.toHiragana(s);
//   } catch {
//     return s;
//   }
// }

// /**
//  * Một số rule đơn giản để sửa lỗi kana cuối thường gặp.
//  * Trả về danh sách candidate (thứ tự: ưu tiên cao -> thấp).
//  *
//  * RULES áp dụng:
//  * - nếu kết thúc bằng "えり" -> thử "える"
//  * - nếu kết thúc bằng "り" -> thử "る"
//  * - nếu kết thúc bằng "かい" và trông like danh từ -> (không thay đổi)
//  * - nếu có katakana rồi thì trả lại nguyên dạng katakana + hiragana version
//  *
//  * CHÚ Ý: chỉ sửa những rule **an toàn** (không làm biến dạng radical).
//  */
// export function guessFixEndingKana(input: string): string[] {
//   const raw = normalizeUnicodeNFC(input);
//   if (!raw) return [raw];

//   const candidates = new Set<string>();

//   // luôn thêm bản normalize ban đầu
//   candidates.add(raw);

//   // nếu có katakana, thêm bản hiragana tương ứng (để search trên kana field)
//   if (containsKatakana(raw)) {
//     try {
//       const hir = wanakana.toHiragana(raw);
//       candidates.add(hir);
//     } catch {
//       // ignore
//     }
//     // cũng thêm toRomaji? không cần
//   }

//   // chuyển sang hiragana để xử lý ending
//   const hir = toHiraganaSafe(raw);

//   // 1) nếu kết thúc えり -> える
//   if (/えり$/.test(hir)) {
//     const replaced = raw.replace(/えり$/, "える"); // giữ kanji phía trước
//     candidates.add(replaced);
//   }

//   // 2) nếu kết thúc chỉ có り -> る (ví dụ かんがえり -> かんがえる)
//   if (/り$/.test(hir) && !/えり$/.test(hir)) {
//     const replaced = raw.replace(/り$/, "る");
//     candidates.add(replaced);
//   }

//   // --- 3) thêm: rule cho động từ godan 1-mora (行き -> 行く, 死に -> 死ぬ, 書き -> 書く, ...)
//   const godanMap: Record<string, string> = {
//     "き": "く",
//     "ぎ": "ぐ",
//     "し": "す",
//     "ち": "つ",
//     "に": "ぬ",
//     "ひ": "ふ",
//     "み": "む",
//     "り": "る"
//   };

//   for (const [fromKana, toKana] of Object.entries(godanMap)) {
//     if (hir.endsWith(fromKana)) {
//       try {
//         const replaced = raw.replace(new RegExp(fromKana + "$"), toKana);
//         candidates.add(replaced);
//         // thêm bản hiragana của replaced
//         candidates.add(toHiraganaSafe(replaced));
//       } catch {
//         // ignore nếu lỗi
//       }
//     }
//   }

//   // 4) thử convert hiragana -> katakana (nếu input là hiragana)
//   try {
//     const kata = wanakana.toKatakana(hir);
//     candidates.add(kata);
//   } catch {
//     // ignore
//   }

//   // 5) giữ cả romaji nếu input là romaji
//   if (wanakana.isRomaji(raw)) {
//     candidates.add(raw.toLowerCase());
//     try {
//       const h2 = wanakana.toHiragana(raw);
//       candidates.add(h2);
//     } catch {}
//   }

//   // trả về danh sách theo ưu tiên: đưa raw (normalize) lên đầu, sau đó những candidate khác
//   return Array.from(candidates);
// }


// /**
//  * Hàm chính: nhận input string, trả về "candidate ưu tiên nhất"
//  * (bạn có thể lấy mảng nếu muốn thử nhiều lần search).
//  *
//  * Mục tiêu an toàn: không sửa quá nhiều, chỉ sửa các lỗi ending phổ biến.
//  */
// export function normalizeAndGuess(input: string): string[] {
//   if (!input) return [input];

//   const normalized = normalizeUnicodeNFC(input);

//   // nếu input chứa Kanji -> cũng thêm bản kana (hiragana) để search kana fields
//   const candidates = guessFixEndingKana(normalized);

//   // đưa normalized (bản gốc after NFC) lên trước
//   const prioritized: string[] = [];
//   const seen = new Set<string>();

//   function pushIf(s?: string | null) {
//     if (!s) return;
//     const t = s.trim();
//     if (!t) return;
//     if (!seen.has(t)) {
//       seen.add(t);
//       prioritized.push(t);
//     }
//   }

//   pushIf(normalized); // luôn ưu tiên bản normalize
//   for (const c of candidates) pushIf(c);

//   return prioritized;
// }
