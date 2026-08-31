export type Product = {
  category: string;
  id: string;
  image: string;
  name: string;
  price: number;
};

export type Demo = {
  description: string;
  name: string;
  nav_title?: string;
  slug: string;
};

export type DemoCategory = {
  items: Demo[];
  name: string;
};

const unavailableDatabase = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "The Next.js server-only database is unavailable inside Remotion; use adapter fixtures",
      );
    },
  },
);

export default unavailableDatabase;
