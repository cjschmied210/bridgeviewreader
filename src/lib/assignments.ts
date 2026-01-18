// Local interface removed, using global one
import { Assignment } from '@/types';

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
    `,
    contentEs: `
      <h1 class="font-serif text-4xl mb-6">El Motor de Andamiaje Cognitivo</h1>
      <p class="mb-4">
        Esta es una demostración del <strong>Diseño de Doble Lienzo</strong> diseñado para la lectura profunda.
        El texto principal reside aquí a la izquierda, configurado en una fuente serif de alta legibilidad ("Lora").
        El color de fondo es un crema "Cálidamente Académico" (#FDFBF7) para reducir la fatiga visual.
      </p>
      <p class="mb-4">
        A la derecha, ves la <strong>Barra Lateral de Pensamiento</strong>. Permanece permanentemente abierta,
        proporcionando un espacio dedicado para el trabajo cognitivo, anotaciones y herramientas sin obstruir la experiencia de lectura.
      </p>
      <h2 class="text-2xl font-serif mt-8 mb-4">Filosofía de Diseño</h2>
      <p class="mb-4">
        Nuestro objetivo es reemplazar el "Efecto de Inferioridad de Pantalla" con "Fricción Intencional".
        Al ralentizar al lector y visualizar su proceso de pensamiento, fomentamos la comprensión profunda en lugar de la lectura superficial.
      </p>
      <p class="mb-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
       <div id="speedbump-contact"></div>
      <h3 class="text-xl font-serif font-bold mt-8 mb-4">Lectura Profunda en la Práctica</h3>
      <p class="mb-4">
         Los lectores electrónicos tradicionales priorizan la velocidad. BridgeView Reader prioriza el pensamiento.
      </p>
      <p class="mb-4">
        At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti 
        quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia 
        deserunt mollitia animi, id est laborum et dolorum fuga.
      </p>
    `,
    contentSimple: `
      <h1 class="font-serif text-4xl mb-6">The Cognitive Scaffolding Engine (Simplified)</h1>
      <p class="mb-4">
        This is an example of the <strong>Two-Part Screen</strong>. It is designed to help you read deeply.
        The main text is here on the left. It uses an easy-to-read font.
        The background color is cream to help your eyes relax.
      </p>
      <p class="mb-4">
        On the right, you see the <strong>Thinking Sidebar</strong>. It stays open all the time.
        This gives you a space to think, take notes, and use tools while you read.
      </p>
      <h2 class="text-2xl font-serif mt-8 mb-4">Design Goal</h2>
      <p class="mb-4">
        We want to execute "Purposeful Slowing Down."
        By slowing you down and showing your thinking, we help you understand better instead of just skimming.
      </p>
      <p class="mb-4">
        [Placeholder Text: Standard Latin text would appear here in a real assignment, simplified for easier reading structure.]
      </p>
      <div id="speedbump-contact"></div>
      <h3 class="text-xl font-serif font-bold mt-8 mb-4">Deep Reading Practice</h3>
      <p class="mb-4">
         Regular e-readers want you to read fast. This reader wants you to think.
      </p>
      <p class="mb-4">
         [Placeholder Text: More simplified Latin text would appear here.]
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
    `,
    contentEs: `
      <h1 class="font-serif text-4xl mb-6">La Revolución Industrial</h1>
      <p class="mb-4">
          La Revolución Industrial fue un período de gran mecanización e innovación que comenzó en Gran Bretaña a mediados del siglo XVIII y principios del XIX y más tarde se extendió por gran parte del mundo.
      </p>
      <h2 class="text-2xl font-serif mt-8 mb-4">Impacto en la Sociedad</h2>
      <p class="mb-4">
          La Revolución Industrial marcó un importante punto de inflexión en la historia; casi todos los aspectos de la vida cotidiana se vieron influidos de alguna manera. En particular, el ingreso promedio y la población comenzaron a mostrar un crecimiento sostenido sin precedentes.
      </p>
    `,
    contentSimple: `
      <h1 class="font-serif text-4xl mb-6">The Industrial Revolution (Simplified)</h1>
      <p class="mb-4">
          The Industrial Revolution was a time when machines started doing work. It began in England around 1750.
      </p>
      <h2 class="text-2xl font-serif mt-8 mb-4">How Life Changed</h2>
      <p class="mb-4">
          This changed how people lived. Most people's lives were different. People had more money and there were more people in the world.
      </p>
    `,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Powerloom_weaving_in_1835.jpg/1280px-Powerloom_weaving_in_1835.jpg"
  }
];
