// Deterministic shim for input/horizon-tailwind-react/src/components/footer/Footer.jsx.
// The native component computes its copyright year from `new Date()`, which
// would make the rendered text depend on the wall-clock year the render
// happens to run. This mirrors the native markup exactly and hardcodes the
// same fixed reference year used by the MiniCalendar shim.
const REFERENCE_YEAR = 2026;

const Footer = () => {
  return (
    <div className="flex w-full flex-col items-center justify-between px-1 pb-8 pt-3 lg:px-8 xl:flex-row">
      <h5 className="mb-4 text-center text-sm font-medium text-gray-600 sm:!mb-0 md:text-lg">
        <p className="mb-4 text-center text-sm text-gray-600 sm:!mb-0 md:text-base">
          ©{REFERENCE_YEAR} Horizon UI. All Rights Reserved.
        </p>
      </h5>
      <div>
        <ul className="flex flex-wrap items-center gap-3 sm:flex-nowrap md:gap-10">
          <li>
            <a
              className="text-base font-medium text-gray-600 hover:text-gray-600"
              href="mailto:hello@simmmple.com"
              target="blank"
            >
              Support
            </a>
          </li>
          <li>
            <a
              className="text-base font-medium text-gray-600 hover:text-gray-600"
              href="https://simmmple.com/licenses"
              target="blank"
            >
              License
            </a>
          </li>
          <li>
            <a
              className="text-base font-medium text-gray-600 hover:text-gray-600"
              href="https://simmmple.com/terms-of-service"
              target="blank"
            >
              Terms of Use
            </a>
          </li>
          <li>
            <a
              className="text-base font-medium text-gray-600 hover:text-gray-600"
              href="https://blog.horizon-ui.com/"
              target="blank"
            >
              Blog
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Footer;
