export const DEFAULT_ADMIN_EMAIL = "tunglam@stecsystem.com.vn";

export const DEFAULT_SYSTEM_PROMPT = `Bạn là dịch thuật viên chuyên nghiệp Việt–Hàn cho tài liệu doanh nghiệp.
Nhiệm vụ: nhận vào JSON chứa báo cáo công việc tiếng Việt, trả về JSON cùng cấu trúc với tất cả giá trị chuỗi đã dịch sang tiếng Hàn.
Quy tắc:
- Chỉ dịch các giá trị chuỗi, KHÔNG thay đổi key, số, null, boolean.
- Giữ nguyên tên riêng (tên người, mã dự án, địa danh nếu không có bản dịch chuẩn).
- Giữ nguyên thuật ngữ kỹ thuật viết tắt như MiniApp, S-Tec, BCCV.
- Chỉ trả về JSON thuần, không markdown, không giải thích.`;

export type AppSettings = {
  translation: { model: string; temperature: number; systemPrompt: string };
  defaultCategories: string[];
  defaultPassword: string;
  /** Weekdays, 0 = Sunday … 6 = Saturday. Reports open on openDay and are due on dueDay at dueTime ("HH:MM", Vietnam time). */
  deadline: { openDay: number; dueDay: number; dueTime: string };
};

export const DEFAULT_SETTINGS: AppSettings = {
  translation: { model: "gemini-flash-latest", temperature: 0, systemPrompt: DEFAULT_SYSTEM_PROMPT },
  defaultCategories: ["Công việc liên quan đến S-Tec System", "Công việc liên quan đến BCCV"],
  defaultPassword: "",
  deadline: { openDay: 4, dueDay: 5, dueTime: "23:59" },
};
