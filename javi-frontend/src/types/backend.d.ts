export interface IBackendRes<T> {
  error?: string | string[];
  message: string;
  statusCode: number | string;
  data?: T;
  result?: T;
}

export interface IPermission {
  id: number;
  name: string;
  description: string;
  systemPermission: boolean;
}


export interface IRole {
  id: number;
  name: string;
  description: string;
  permissions: IPermission[];
  systemRole: boolean;
}

/** Payload tạo hoặc cập nhật Role */
export interface IRoleRequest {
  name: string;
  description?: string;
  isSystemRole?: boolean;
  permissions: { id: number }[];
}


export interface IUserResponse {
  id: number;
  fullName: string;
  username: string;
  email: string;
  dateOfBirth: string | null;
  level: string | null;
  selfIntroduction: string;
  avatarUrl: string;
  accountType: "FREE" | "PREMIUM";
  premiumExpiredAt: string | null;
  status: "ACTIVE" | "BLOCKED";
  verified: boolean;
  role: IRole;
}

/** PublicUserResponse — dữ liệu công khai của người khác */
export interface IPublicUserResponse {
  id: number;
  username: string;
  fullName: string;
  level: string | null;
  selfIntroduction: string;
  status: "ACTIVE" | "BLOCKED";
  avatarUrl: string;
  premiumType: PremiumType;
  dateOfBirth: string | null;
  createdAt: string;
}

/** Payload tạo user (Admin) */
export interface ICreateUserRequest {
  fullName?: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  dateOfBirth?: string | null;
  level?: string | null;
  selfIntroduction?: string;
  avatarUrl?: string;
  roleId?: number;
  status?: "ACTIVE" | "BLOCKED";
  accountType?: "FREE" | "PREMIUM";
  premiumExpiredAt?: string | null;
}

/** Payload cập nhật user */
export interface IUpdateUserRequest {
  username: string;
  dateOfBirth?: string | null;
  fullName?: string | null;
  jlptLevel?: string | null;
  selfIntroduction?: string;
  roleId?: number;
}

/** Payload đổi mật khẩu */
export interface IChangePassRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Payload cập nhật avatar */
export interface IAvatarUpload {
  id: number;
  file: File;
}

/** Enum gói Premium */
export type PremiumType = "MONTHLY_1" | "MONTHLY_3" | "MONTHLY_6" | "LIFETIME";

export interface ILoginResponse {
  token: string;
  tokenType: "Bearer";
  refresh_token: string;
  user: IUserResponse;
}

export interface IResetPassRequest {
    token: string | null;
    newPassword: string;
    confirmPassword: string;
}

// =====================================================
// TỪ VỰNG VÀ NGHĨA
// =====================================================

/** Từ vựng */
/** Ví dụ trong nghĩa */
export interface IMeaningExample {
  id?: number;
  jaSentence: string; // Câu ví dụ tiếng Nhật
  viSentence: string; // Câu ví dụ tiếng Việt
}

/** Nghĩa tiếng Việt của từ */
export interface IMeaning {
  id?: number;
  meaningVn: string;         // Nghĩa tiếng Việt
  description?: string;      // Mô tả thêm (nếu có)
  examples: IMeaningExample[];
}

/** Kanji liên quan đến từ vựng */
export interface IVocabKanji {
  id: number;
  characterName: string;     // Ký tự Kanji
  sinoViName: string;        // Nghĩa Hán Việt
  meaning: string;           // Nghĩa chính
  level: string;             // N5 - N1
  gifUrl: string;            // Link ảnh GIF nét viết
}

/** Từ vựng (response chính từ BE) */
export interface IVocabResponse {
  example: ReactNode;
  example: any;
  id: number;
  word: string;              // Từ tiếng Nhật
  romaji: string | null;
  hiragana: string | null;
  katakana: string | null;
  wordType: string;          // Danh từ / Động từ / Tính từ...
  level: string;             // N5 - N1
  meanings: IMeaning[];      // Danh sách nghĩa tiếng Việt
  kanjis: IVocabKanji[];     // Các Kanji liên quan
}

/** Payload tạo từ vựng (Admin) */
export interface IVocabCreateRequest {
  word: string;
  wordType: string;
  level: string;
  meanings: IMeaning[];
}

/** Payload cập nhật từ vựng (Admin) */
export interface IVocabUpdateRequest {
  id?: number;
  word: string;
  wordType: string;
  level: string;
  meanings: IMeaning[];
}


/** Kết quả phân trang khi tìm kiếm từ vựng */
export interface IVocabularyPage {
  content: IVocabResponse[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

// =====================================================
// KANJI
// =====================================================
/** Kanji cơ bản (dùng cho danh sách & search) */
export interface IKanjiResponse {
  id: number;
  characterName: string; // ký tự Kanji
  sinoViName: string;    // nghĩa Hán Việt
  meaning: string;       // nghĩa tiếng Việt
  level: string;         // N5-N1
  gifUrl: string;        // link ảnh gif nét viết
}

/** Kanji chi tiết (dùng cho /search/get-mean) */
export interface IKanjiDetailResponse {
  id: number;
  characterName: string;
  sinoViName: string;
  kunyomi: string[];     // cách đọc kun
  onyomi: string[];      // cách đọc on
  stroke: number;        // số nét
  videoUrl: string;      // link video
  gifUrl: string;        // link ảnh gif
  meaning: string;       // nghĩa
  level: string;         // N5-N1
}

/** Node cấu trúc phân tích, phân tách Kanji */
export interface IKanjiComponentNode {
    kanji: string;
    sinoViName: string;
    explanation: string;
    components: IKanjiComponentNode[];
}

/** Kết quả phân tích, phân tách Kanji */
export interface IKanjiDecompositionResult {
    kanji: string;
    sinoViName: string;
    explanation: string;
    components: IKanjiComponentNode[];
}

/** Payload tạo hoặc cập nhật Kanji */
export interface IKanjiRequest {
  characterName: string;
  sinoViName: string;
  meaning: string;
  level: string;
}

// =====================================================
// COMMENT & REACT
// =====================================================

// Loại entity mà comment thuộc về
export type EntityType = "WORD" | "KANJI" | "GRAMMAR";

// Loại phản ứng
export type ReactionType = "LIKE" | "DISLIKE" | null;

// Comment trả về từ BE
export interface ICommentResponse {
  id: number;
  userId: number;
  userName: string;
  avatarUrl?: string | null;
  entityType: EntityType;
  entityId: number;
  entityName: string;
  content: string;
  likeCount: number;
  dislikeCount: number;
  isMyComment?: boolean;
  createdAt: string; // ISO date
  myReaction?: ReactionType;
}

// Tạo comment
export interface ICreateCommentRequest {
  entityType: EntityType;
  entityId: number;
  content: string;
}

// Cập nhật comment
export interface IUpdateCommentRequest {
  content: string;
}

// Kết quả phân trang
export interface IPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ==========================
// GRAMMAR TYPES
// ==========================

export interface IGrammarExample {
    id?: number;
    jaSentence: string;       // câu ví dụ tiếng Nhật
    transcription: string;    // câu đọc thuần (hiragana)
    viSentence: string;       // câu tiếng Việt
}

export interface IGrammarResponse {
    id: number;
    pattern: string;          // mẫu câu
    meaning: string;          // nghĩa
    structure: string;        // cách chia ngữ pháp
    usageNote: string;        // phạm vi sử dụng
    level: "N5" | "N4" | "N3" | "N2" | "N1";
    examples: IGrammarExample[];
}

export interface IPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ICreateGrammarRequest {
    pattern: string;
    meaning: string;
    structure: string;
    usageNote: string;
    level: "N5" | "N4" | "N3" | "N2" | "N1";
    examples?: IGrammarExample[];
}

export interface IUpdateGrammarRequest extends ICreateGrammarRequest {
    id: number;
}

export interface IGrammarSearchRequest {
    keyword?: string;
    level?: "N5" | "N4" | "N3" | "N2" | "N1";
    page?: number;
    size?: number;
    sort?: string;
}

// Grammar check (AI) types
export interface IGrammarSuggest {
    original: string;
    corrected: string;
    explanation: string;
}

export interface IGrammarCheckResult {
    sourceText: string;
    sourceLang: string;
    score: number;
    isValidGrammar: boolean;
    suggest: IGrammarSuggest[];
    result: string;
    mean: string;
}

export interface IGrammarCheckSourceText {
    sourceText: string;
    sourceLang?: string;
    targetLang: string;
}

/**
 * Item lịch sử tìm kiếm (dùng cho history modal / API)
 */
export interface IHistorySearchItem {
    id: number;
    entityType: string;
    entityId: number | null;
    entityName: string | null;
    keyword: string;
    searchedAt: number[];
}

export type IHistoryPage = IPageResponse<IHistorySearchItem>;