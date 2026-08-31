import { forwardRef, type AnchorHTMLAttributes } from "react";

type LinkHref =
  | string
  | {
      hash?: string;
      pathname?: string;
      query?: Record<string, boolean | number | string>;
    };
type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: LinkHref;
  replace?: boolean;
  scroll?: boolean;
};

const hrefToString = (href: LinkHref) => {
  if (typeof href === "string") {
    return href;
  }

  const query = href.query
    ? new URLSearchParams(
        Object.entries(href.query).map(([key, value]) => [key, String(value)]),
      ).toString()
    : "";

  return `${href.pathname ?? ""}${query ? `?${query}` : ""}${href.hash ?? ""}`;
};

const NextLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, replace, scroll, ...props }, ref) => {
    void replace;
    void scroll;

    return <a ref={ref} href={hrefToString(href)} {...props} />;
  },
);

NextLink.displayName = "NextLinkShim";

export const useLinkStatus = () => ({ pending: false });

export default NextLink;
