import { useState } from "react";
import Card from "components/card";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- react-calendar ships its own types but is not a devDependency here
import Calendar from "react-calendar";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import "assets/css/MiniCalendar.css";
import "react-calendar/dist/Calendar.css";

// Deterministic shim for input/horizon-tailwind-react/src/components/calendar/MiniCalendar.jsx.
// The native component seeds its calendar with `new Date()`, which would
// make the rendered month (and "today" highlight) depend on the wall-clock
// day the render happens to run. This mirrors the native markup exactly and
// swaps only that one seed value for a fixed reference date, per the "mock
// the environment around a native component, not the component itself" rule.
const DETERMINISTIC_REFERENCE_DATE = new Date(2026, 0, 15);

const MiniCalendar = () => {
  const [value, setValue] = useState<Date>(DETERMINISTIC_REFERENCE_DATE);
  const onChange = (nextValue: unknown) => {
    if (nextValue instanceof Date) {
      setValue(nextValue);
    }
  };

  return (
    <div>
      <Card extra="flex w-full h-full flex-col px-3 py-3">
        <Calendar
          onChange={onChange}
          value={value}
          prevLabel={<MdChevronLeft className="ml-1 h-6 w-6 " />}
          nextLabel={<MdChevronRight className="ml-1 h-6 w-6 " />}
          view={"month"}
        />
      </Card>
    </div>
  );
};

export default MiniCalendar;
