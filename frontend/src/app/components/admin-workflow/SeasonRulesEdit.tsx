import { $t } from "../../../lib/i18n";
export default function SeasonRulesEdit() {
  return (
    <div>
      {/* TODO: chuyen noi dung tu component mau (HR.zip) hoac JSP tuong ung vao day */}
      <h1>{$t("SeasonRulesEdit", (localStorage.getItem('app-lang') || 'vi'))}</h1>
    </div>
  );
}
