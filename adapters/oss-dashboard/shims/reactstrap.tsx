import type { ComponentProps } from "react";
import { Alert as NativeAlert } from "../../../input/oss-dashboard/node_modules/reactstrap";

export * from "../../../input/oss-dashboard/node_modules/reactstrap";

export const Alert: React.FC<ComponentProps<typeof NativeAlert>> = (props) => (
  <NativeAlert {...props} fade={false} />
);
