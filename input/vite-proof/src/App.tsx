import { Dashboard } from "./demo/Dashboard";
import { DemoProvider } from "./demo/DemoProvider";
import "./demo/demo.css";

function App() {
  return (
    <DemoProvider>
      <Dashboard activeProjects={18} teamMembers={42} monthlyRevenue="$128k" />
    </DemoProvider>
  );
}

export default App;
