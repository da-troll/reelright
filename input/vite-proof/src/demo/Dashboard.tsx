import { useState } from "react";
import { useDemoWorkspace } from "./DemoProvider";

export type DashboardProps = {
  activeProjects: number;
  teamMembers: number;
  monthlyRevenue: string;
};

const activity = [
  ["Landing page", "Published", "2 min ago"],
  ["Billing portal", "In review", "18 min ago"],
  ["Mobile onboarding", "Updated", "1 hr ago"],
];

export const Dashboard = ({
  activeProjects,
  teamMembers,
  monthlyRevenue,
}: DashboardProps) => {
  const { company, reportingPeriod } = useDemoWorkspace();
  const [selectedView, setSelectedView] = useState<"overview" | "activity">(
    "overview",
  );

  return (
    <main className="proof-app">
      <aside className="proof-sidebar">
        <div className="proof-mark">N</div>
        <nav aria-label="Primary navigation">
          <button className="proof-nav proof-nav-active" type="button">
            Overview
          </button>
          <button className="proof-nav" type="button">
            Projects
          </button>
          <button className="proof-nav" type="button">
            Team
          </button>
        </nav>
        <div className="proof-user">DT</div>
      </aside>

      <section className="proof-content">
        <header className="proof-header">
          <div>
            <p className="proof-eyebrow">{reportingPeriod}</p>
            <h1>{company}</h1>
          </div>
          <div className="proof-live">
            <span /> Live workspace
          </div>
        </header>

        <div className="proof-tabs" role="tablist" aria-label="Dashboard view">
          <button
            className={selectedView === "overview" ? "proof-tab-active" : ""}
            onClick={() => setSelectedView("overview")}
            role="tab"
            type="button"
          >
            Overview
          </button>
          <button
            className={selectedView === "activity" ? "proof-tab-active" : ""}
            onClick={() => setSelectedView("activity")}
            role="tab"
            type="button"
          >
            Activity
          </button>
        </div>

        <div className="proof-metrics">
          <article>
            <p>Active projects</p>
            <strong>{activeProjects}</strong>
            <small>+4 this month</small>
          </article>
          <article>
            <p>Team members</p>
            <strong>{teamMembers}</strong>
            <small>Across 6 squads</small>
          </article>
          <article>
            <p>Monthly revenue</p>
            <strong>{monthlyRevenue}</strong>
            <small>+18.2% year over year</small>
          </article>
        </div>

        <section className="proof-panel">
          <div className="proof-panel-heading">
            <div>
              <p className="proof-eyebrow">Workspace pulse</p>
              <h2>Recent activity</h2>
            </div>
            <button type="button">View all</button>
          </div>
          <div className="proof-activity">
            {activity.map(([name, status, time], index) => (
              <div className="proof-activity-row" key={name}>
                <span className={`proof-icon proof-icon-${index + 1}`} />
                <strong>{name}</strong>
                <span>{status}</span>
                <time>{time}</time>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};
