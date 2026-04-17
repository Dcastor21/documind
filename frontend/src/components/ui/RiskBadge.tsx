import { RISK_STYLES } from "@/config/documents";

interface Props {
  risk: "low" | "medium" | "high";
}

export function RiskBadge({ risk }: Props) {
  const { badge } = RISK_STYLES[risk];
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${badge}`}
    >
      {risk} risk
    </span>
  );
}