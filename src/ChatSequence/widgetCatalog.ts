import { BurnoutFastFixesCard } from "./BurnoutFastFixesCard";
import { CapacityHotspotsTableCard } from "./CapacityHotspotsTableCard";
import { CapacityStressSignalCard } from "./CapacityStressSignalCard";
import { EnpsBucketsVsTurnoverChart } from "./EnpsBucketsVsTurnoverChart";
import { EnpsDistributionChart } from "./EnpsDistributionChart";
import { EnpsTrendsAndTurnoverCard } from "./EnpsTrendsAndTurnoverCard";
import { JoinersLeaversChart } from "./JoinersLeaversChart";
import { ManagerLoadInterventionsCard } from "./ManagerLoadInterventionsCard";
import { ManagerLoadSignalCard } from "./ManagerLoadSignalCard";
import { ManagerOutliersTableCard } from "./ManagerOutliersTableCard";
import { PolicyImpactOverviewCard } from "./PolicyImpactOverviewCard";
import { PolicyImpactSegmentsCard } from "./PolicyImpactSegmentsCard";
import { RemoteImmunitySignalCard } from "./RemoteImmunitySignalCard";
import { ReviewDriverDeltasCard } from "./ReviewDriverDeltasCard";
import { ReviewGapByDeptCard } from "./ReviewGapByDeptCard";
import { ReviewsToRetentionSignalCard } from "./ReviewsToRetentionSignalCard";
import { SicknessDayPatternCard } from "./SicknessDayPatternCard";
import { SicknessOvertimeHotspotsCard } from "./SicknessOvertimeHotspotsCard";
import { SkillsCoverageGapNext30Card } from "./SkillsCoverageGapNext30Card";
import { SkillsCoverageRiskCard } from "./SkillsCoverageRiskCard";
import { SkillsMitigationPlanCard } from "./SkillsMitigationPlanCard";
import type { WidgetCatalog } from "../widgets/catalog";

export const builtInChatWidgetCatalog = {
  "burnout-fast-fixes": BurnoutFastFixesCard,
  "capacity-hotspots-table": CapacityHotspotsTableCard,
  "capacity-stress-signal": CapacityStressSignalCard,
  "enps-distribution": EnpsDistributionChart,
  "enps-trends-turnover": EnpsTrendsAndTurnoverCard,
  "enps-vs-turnover": EnpsBucketsVsTurnoverChart,
  "joiners-leavers": JoinersLeaversChart,
  "manager-load-interventions": ManagerLoadInterventionsCard,
  "manager-load-signal": ManagerLoadSignalCard,
  "manager-outliers-table": ManagerOutliersTableCard,
  "policy-impact-overview": PolicyImpactOverviewCard,
  "policy-impact-segments": PolicyImpactSegmentsCard,
  "remote-immunity-signal": RemoteImmunitySignalCard,
  "review-driver-deltas": ReviewDriverDeltasCard,
  "review-gap-by-dept": ReviewGapByDeptCard,
  "reviews-to-retention-signal": ReviewsToRetentionSignalCard,
  "sickness-day-pattern": SicknessDayPatternCard,
  "sickness-overtime-hotspots": SicknessOvertimeHotspotsCard,
  "skills-coverage-gap-next-30": SkillsCoverageGapNext30Card,
  "skills-coverage-risk": SkillsCoverageRiskCard,
  "skills-mitigation-plan": SkillsMitigationPlanCard,
} satisfies WidgetCatalog;
