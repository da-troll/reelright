type LocalFontOptions = {
  variable?: string;
};

const localFont = (options: LocalFontOptions = {}) => ({
  className: "next-font-local",
  style: { fontFamily: "Arial, sans-serif" },
  variable: options.variable ?? "",
});

export default localFont;
