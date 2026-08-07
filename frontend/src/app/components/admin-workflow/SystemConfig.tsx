import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";
import { showToast } from "../../../lib/confirm";

const CONFIG_DESC_MAP: Record<string, string> = {
  MAX_TOP_WEIGHT: "Maximum top weight (kg)",
  MIN_BOTTOM_WEIGHT: "Minimum bottom weight (kg)",
  WEIGHT_PER_POINT: "Weight adjustment (kg) per 1 rating point difference",
  MAX_OVERWEIGHT_ALLOWED: "Maximum overweight allowed for jockeys (kg)",
  SEX_ALLOWANCE: "Sex weight allowance for female horses (Fillies/Mares) (kg)",
  DEFAULT_JOCKEY_HIRE_FEE: "Default hire fee paid by horse owner to jockey per accepted mount in VND (e.g. 500000)",
  MIN_TICKET_PRICE: "Minimum allowed ticket price for a Race Meeting in VND (e.g. 10000)",
  MAX_TICKET_PRICE: "Maximum allowed ticket price for a Race Meeting in VND (e.g. 5000000)",
  PRIZE_SHARE_1ST: "Percentage of purse allocated to 1st place (Must be > 2nd place and total sum = 100%)",
  PRIZE_SHARE_2ND: "Percentage of purse allocated to 2nd place",
  PRIZE_SHARE_3RD: "Percentage of purse allocated to 3rd place",
  MIN_WITHDRAWAL_AMOUNT: "Minimum withdrawal amount for users (Horse Owner / Jockey / Spectator) in VND (e.g. 50000)",
  PAYMENT_GATEWAY_MODE: "Payment Gateway Mode: 'MOCK' (Virtual Money Demo) or 'LIVE' (Real Money Gateway)",
  AUTO_DISBURSEMENT_ENABLED: "Auto Disbursement Payout: 'TRUE' (Instant API auto payout) or 'FALSE' (Manual Admin approval)",
  PAYOS_CLIENT_ID: "PayOS Payment Gateway Client ID (for LIVE real money mode)",
  PAYOS_API_KEY: "PayOS Payment Gateway API Key (for LIVE real money mode)",
  PAYOS_CHECKSUM_KEY: "PayOS Payment Gateway Checksum Key (for LIVE real money mode)",
  PAYOS_PAYOUT_API_KEY: "PayOS / Bank Payout API Key (for LIVE real money auto-disbursement)",
  PAYOS_BANK_NAME: "PayOS Beneficiary Bank Name (e.g. MBBank, Vietcombank, Techcombank, VPBank)",
  PAYOS_ACCOUNT_NUMBER: "PayOS Beneficiary Bank Account Number registered on PayOS",
  PAYOS_ACCOUNT_NAME: "PayOS Beneficiary Bank Account Holder Name registered on PayOS",
};

/**
 */
export default function SystemConfig() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchConfigs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any[]>("/admin/configs");
      setConfigs(data);
      
      const values: Record<string, string> = {};
      data.forEach((c) => {
        values[c.configKey] = c.configValue;
      });
      setFormValues(values);
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load system configurations."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const p1 = parseFloat(formValues["PRIZE_SHARE_1ST"] || "50");
    const p2 = parseFloat(formValues["PRIZE_SHARE_2ND"] || "30");
    const p3 = parseFloat(formValues["PRIZE_SHARE_3RD"] || "20");

    if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
      if (p1 <= p2) {
        setError("1st Place Share (" + p1 + "%) must be strictly greater than 2nd Place Share (" + p2 + "%).");
        setLoading(false);
        return;
      }
      if (p2 <= p3) {
        setError("2nd Place Share (" + p2 + "%) must be strictly greater than 3rd Place Share (" + p3 + "%).");
        setLoading(false);
        return;
      }
      if (p1 < 40 || p1 > 80) {
        setError("1st Place Share must be between 40% and 80%.");
        setLoading(false);
        return;
      }
      const sum = p1 + p2 + p3;
      if (Math.abs(sum - 100) > 0.01) {
        setError("Total sum of 1st, 2nd, and 3rd place shares must equal exactly 100% (Current sum: " + sum + "%).");
        setLoading(false);
        return;
      }
    }

    const minT = parseFloat(formValues["MIN_TICKET_PRICE"] || "10000");
    const maxT = parseFloat(formValues["MAX_TICKET_PRICE"] || "5000000");
    if (!isNaN(minT) && !isNaN(maxT) && maxT <= minT) {
      setError("Maximum ticket price must be strictly greater than Minimum ticket price.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/admin/configs", formValues);
      setSuccess("System configurations updated successfully.");
      fetchConfigs();
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to update configurations."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(21,19,16,0.6)" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("System Configurations", (localStorage.getItem('app-lang') || 'en'))}</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("Update weights and thresholds for ranking and prediction formulas.", (localStorage.getItem('app-lang') || 'en'))}</p>
        </div>

        <div style={{ padding: "1.5rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {configs
                .filter((c) => {
                  const isLiveMode = (formValues["PAYMENT_GATEWAY_MODE"] || "MOCK").toUpperCase() === "LIVE";
                  const isAutoDisbursement = (formValues["AUTO_DISBURSEMENT_ENABLED"] || "TRUE").toUpperCase() === "TRUE";

                  if (c.configKey === "PAYOS_PAYOUT_API_KEY" && (!isLiveMode || !isAutoDisbursement)) {
                    return false;
                  }

                  const isPayOSKey = ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY", "AUTO_DISBURSEMENT_ENABLED", "PAYOS_BANK_NAME", "PAYOS_ACCOUNT_NUMBER", "PAYOS_ACCOUNT_NAME"].includes(c.configKey);
                  if (isPayOSKey && !isLiveMode) {
                    return false;
                  }
                  return true;
                })
                .sort((a, b) => {
                  const order = [
                    "PAYMENT_GATEWAY_MODE",
                    "AUTO_DISBURSEMENT_ENABLED",
                    "PAYOS_CLIENT_ID",
                    "PAYOS_API_KEY",
                    "PAYOS_CHECKSUM_KEY",
                    "PAYOS_PAYOUT_API_KEY",
                    "PAYOS_BANK_NAME",
                    "PAYOS_ACCOUNT_NUMBER",
                    "PAYOS_ACCOUNT_NAME",
                    "MIN_WITHDRAWAL_AMOUNT",
                    "DEFAULT_JOCKEY_HIRE_FEE",
                    "MIN_TICKET_PRICE",
                    "MAX_TICKET_PRICE",
                    "PRIZE_SHARE_1ST",
                    "PRIZE_SHARE_2ND",
                    "PRIZE_SHARE_3RD"
                  ];
                  const idxA = order.indexOf(a.configKey);
                  const idxB = order.indexOf(b.configKey);
                  return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
                })
                .map((c) => (
                <div key={c.configKey} className="grid grid-cols-1 md:grid-cols-12 md:items-center" style={{ gap: "0.5rem", padding: "0.75rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "0.5rem" }}>
                  <div className="md:col-span-5" style={{ display: "flex", alignItems: "start", gap: "0.5rem" }}>
                    <div style={{ marginTop: "0.125rem", padding: "0.25rem", borderRadius: "0.25rem", background: "rgba(201,162,39,0.1)", color: "#c9a227" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/></svg>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "bold", color: "#c9a227" }}>
                        {c.configKey}
                      </label>
                      <p style={{ fontSize: "9px", marginTop: "0.125rem", color: "rgba(255,255,255,0.4)" }}>
                        {CONFIG_DESC_MAP[c.configKey] || c.description || "System parameter"}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-7">
                    {c.configKey === "PAYMENT_GATEWAY_MODE" ? (
                      <select
                        value={formValues[c.configKey] || "MOCK"}
                        onChange={(e) => handleChange(c.configKey, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(201,162,39,0.3)",
                          borderRadius: "0.5rem",
                          color: formValues[c.configKey] === "LIVE" ? "#34d399" : "#c9a227",
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          fontWeight: "bold",
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="MOCK" style={{ background: "#151310", color: "#f4f2ec" }}>
                          MOCK — Virtual Money Demo Mode (No Real Money API Required)
                        </option>
                        <option value="LIVE" style={{ background: "#151310", color: "#34d399" }}>
                          LIVE — Real Money Payment Gateway (PayOS VietQR Live Bank Account)
                        </option>
                      </select>
                    ) : c.configKey === "AUTO_DISBURSEMENT_ENABLED" ? (
                      <select
                        value={(formValues[c.configKey] || "TRUE").toUpperCase()}
                        onChange={(e) => handleChange(c.configKey, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(201,162,39,0.3)",
                          borderRadius: "0.5rem",
                          color: (formValues[c.configKey] || "TRUE").toUpperCase() === "TRUE" ? "#34d399" : "#fbbf24",
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          fontWeight: "bold",
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="TRUE" style={{ background: "#151310", color: "#34d399" }}>
                          TRUE — Instant Auto Payout API (Automated Instant Disbursement)
                        </option>
                        <option value="FALSE" style={{ background: "#151310", color: "#fbbf24" }}>
                          FALSE — Manual Admin Approval (Requires Admin Bank Transfer & Approval)
                        </option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formValues[c.configKey] || ""}
                        onChange={(e) => handleChange(c.configKey, e.target.value)}
                        style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "#f4f2ec", fontSize: "0.75rem", fontFamily: "monospace", outline: "none" }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(201,162,39,0.10)", paddingTop: "1rem" }}>
              <button
                type="submit"
                disabled={loading}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", borderRadius: "0.5rem", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, border: "none", background: "#c9a227", color: "#0b0d11", cursor: "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? $t("Saving Parameters...", (localStorage.getItem('app-lang') || 'en')) : $t("Save System Configs", (localStorage.getItem('app-lang') || 'en'))}
              </button>
            </div>
          </form>
        </div>

        <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.012)" }}>
          <p style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>
            ℹ Formula changes take effect immediately on new calculations.
          </p>
        </div>
      </div>
    </div>
  );
}
