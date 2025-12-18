
export interface Assignment {
    id: string;
    title: string;
    themeImageKeyword: string;
    content: string; // Markdown or HTML string
}

export const assignments: Assignment[] = [
    {
        id: "1",
        title: "The Cognitive Scaffolding Engine",
        themeImageKeyword: "library,books",
        content: `
      <h1 class="font-serif text-4xl mb-6">The Cognitive Scaffolding Engine</h1>
      <p class="mb-4">
        This is a demonstration of the <strong>Dual-Canvas Layout</strong> designed for deep reading.
        The primary text resides here on the left, set in a high-legibility serif font ("Lora").
        The background color is a "Warmly Academic" cream (#FDFBF7) to reduce eye strain.
      </p>
      <p class="mb-4">
        On the right, you see the <strong>Thinking Sidebar</strong>. It remains permanently open,
        providing a dedicated space for cognitive work, annotations, and tools without obstructing the reading experience.
      </p>
      <h2 class="text-2xl font-serif mt-8 mb-4">Design Philosophy</h2>
      <p class="mb-4">
        We aim to replace the "Screen Inferiority Effect" with "Intentional Friction."
        By slowing the reader down and visualizing their thinking process, we encourage deep comprehension rather than shallow skimming.
      </p>
      <p class="mb-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
      <div id="speedbump-contact"></div>
      <h3 class="text-xl font-serif font-bold mt-8 mb-4">Deep Reading in Practice</h3>
      <p class="mb-4">
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium,
        totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
        Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos
        qui ratione voluptatem sequi nesciunt.
      </p>
      <p class="mb-4">
        At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti 
        quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia 
        deserunt mollitia animi, id est laborum et dolorum fuga.
      </p>
    `
    },
    {
        id: "2",
        title: "The Industrial Revolution",
        themeImageKeyword: "factory,steam engine",
        content: `
        <h1 class="font-serif text-4xl mb-6">The Industrial Revolution</h1>
        <p class="mb-4">
            The Industrial Revolution was a period of major mechanization and innovation that began in Great Britain during the mid-18th century and early 19th century and later spread throughout much of the world.
        </p>
        <h2 class="text-2xl font-serif mt-8 mb-4">Impact on Society</h2>
        <p class="mb-4">
            The Industrial Revolution marked a major turning point in history; almost every aspect of daily life was influenced in some way. In particular, average income and population began to exhibit unprecedented sustained growth.
        </p>
      `
    }
];
