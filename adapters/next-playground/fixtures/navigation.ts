export const navigationFixture = [
  {
    name: "Layouts",
    items: [
      {
        slug: "layouts",
        name: "Nested Layouts",
        description: "Create UI shared across routes",
      },
      {
        slug: "route-groups",
        name: "Route Groups",
        description: "Organize routes without changing URLs",
      },
      {
        slug: "parallel-routes",
        name: "Parallel Routes",
        description: "Render pages in the same layout",
      },
    ],
  },
  {
    name: "Rendering",
    items: [
      {
        slug: "cached-components",
        name: "Cached Components",
        description: "Cache React Server Components",
      },
      {
        slug: "loading",
        name: "Loading UI",
        description: "Build route-level loading states",
      },
      {
        slug: "view-transitions",
        name: "View Transitions",
        description: "Explain navigation relationships",
      },
    ],
  },
];

export const productFixture = [
  { id: "1", name: "Top", image: "top.png", category: "1", price: 29.99 },
  {
    id: "7",
    name: "Basketball",
    image: "balls.png",
    category: "7",
    price: 24.99,
  },
  {
    id: "8",
    name: "Weights",
    image: "weights.png",
    category: "8",
    price: 149.99,
  },
];
