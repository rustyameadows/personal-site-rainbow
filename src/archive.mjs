import { interpolations, nearlyImpossible } from './project-images.mjs';

export const archive = {
  about: {
    heading: 'Home in the desert',
    intro: 'I live near Joshua Tree, California, with my dog and Alex, who I’m going to marry. We moved to the desert in 2025, the same year Alex and I spent a summer driving through national parks. We camped eighty-nine nights, mostly on public land. For one night, we got a hotel room.',
    leadParagraphs: [
      'I grew up in Virginia, and my family is still there. I lived in New York and Los Angeles, sometimes going back to Virginia just to be near them. I know those places partly through the pictures I took there. When I look through them now, it’s the people I remember first.',
    ],
    leadMedia: {
      image: '/images/joshua-tree.jpg',
      alt: 'Black-and-white photograph of Joshua trees against a rocky hillside',
      caption: 'Joshua Tree, California',
    },
    blocks: [
      {
        heading: 'The pictures I keep',
        layout: 'split',
        paragraphs: [
          'I’ve been taking pictures for about twenty-five years. There are beaches and vacations in the archive, along with pictures of things I’ve made. The people I love are all through it.',
          'There’s more landscape in the frame these days. I still love photographing my family and the people close to me. It’s nice to have an ordinary day with someone, and then, years later, to get a little of it back.',
        ],
        media: { tone: 'cool' },
      },
    ],
  },
  context: {
    heading: 'A personal canon',
    intro: 'I’ve wanted to keep a personal canon for a while. Some of it is people whose work I go back to. Some of it is things I learned by doing them. And some of it is a single line I heard years ago that I still think about.',
    quotes: [
      {
        text: 'Complaining is stupid. Either act or forget.',
        author: 'Stefan Sagmeister',
      },
      {
        text: 'Don’t undertake a project unless it is manifestly important and nearly impossible.',
        author: 'Edwin Land',
      },
      {
        text: 'You need to let the little things that would ordinarily bore you suddenly thrill you.',
        author: 'Andy Warhol',
      },
      {
        text: 'An old trick well done is far better than a new trick with no effect.',
        author: 'Harry Houdini',
      },
      {
        text: 'The crux of this work is building temporary communities, by connecting different people and practices, and causing the conditions for triggering sparks between them.',
        author: 'Hans Ulrich Obrist',
      },
      {
        text: 'What I believe is that all clear-minded people should remain two things throughout their lifetimes: Curious and teachable.',
        author: 'Roger Ebert',
      },
      {
        text: 'Choose your corner, pick away at it carefully, intensely and to the best of your ability and that way you might change the world.',
        author: 'Charles and Ray Eames',
      },
    ],
    blocks: [
      {
        heading: 'Principles I come back to',
        layout: 'grid',
        entries: [
          { title: 'Make the tool, too', description: 'When I make a product, I usually make the tool that makes it. Building that part myself gives me room to explore how the work could happen.' },
          { title: 'Start with the problem', description: 'I get interested in a technology when I can see what it might help someone do. A problem I can point to gives me somewhere to start.' },
        ],
      },
      {
        heading: 'People I come back to',
        layout: 'split',
        intro: 'I’m drawn to people who can make a complicated idea clear and make you want to know more.',
        entries: [
          { title: 'Walt Disney and Imagineering', description: 'I like looking at the work of WED and Imagineering and asking how an unfamiliar technology became something people wanted to line up for.' },
          { title: 'Richard Feynman and Carl Sagan', description: 'I admire how clearly they explain difficult ideas. Understanding something well enough to make it clear to someone else is a skill I care about.' },
          { title: 'Steve Jobs', description: 'I come back to how he explained what a new technology would let people do.' },
        ],
        media: { tone: 'ink' },
      },
      {
        heading: 'Formative moments',
        layout: 'grid',
        entries: [
          { title: 'Art history and exhibitions', description: 'I studied art history at William & Mary and wrote my thesis on Andy Warhol. I went on to design and curate exhibitions. Museums have stayed part of my life and work ever since.' },
          { title: 'Two weeks at UCLA', description: 'In 2019, I woke up unable to move. I had the Miller Fisher variant of Guillain-Barré syndrome and spent two weeks at UCLA. I recovered quickly and haven’t had any issues since.' },
        ],
      },
    ],
  },
  favs: {
    heading: 'The collection',
    intro: 'I’m starting with pictures. I’ve been taking more landscape photographs lately, and I keep coming back to museums and art history. I’d like to keep a record here of what I find and what makes me look twice.',
    leadMedia: {
      image: '/images/joshua-tree.jpg',
      alt: 'Black-and-white photograph of Joshua trees against a rocky hillside',
      caption: 'Joshua Tree, California',
    },
    entries: [
      {
        title: 'Reading',
        description: 'Room for books, essays, and the occasional single passage worth keeping.',
      },
      {
        title: 'Listening',
        description: 'A spot for records, radio, and conversations I’d pass along.',
      },
      {
        title: 'Places and pictures',
        description: 'Photographs from close to home and farther away.',
      },
      {
        title: 'Objects and details',
        description: 'Objects, materials, and small design details I want to remember.',
      },
    ],
  },
  technology: {
    heading: 'Making new technology usable',
    intro: 'I like working at the bleeding edge. I’m usually the person bringing a new technology into a project or an organization. I figure out what it can do for the work, build workflows around it, and help people use it to make things of their own.',
    leadParagraphs: [
      'That takes a mix of skills. I can work through the technical side with engineers, get a prototype in front of designers, and help a team find a way to use it in the work they already do.',
      'I work across software, hardware, and physical products. That might mean finding a way to put electronics into a physical object or figuring out how to tell whether an AI tool is doing what you asked.',
    ],
    blocks: [
      {
        heading: 'Recently shipped in AI',
        intro: 'Some of this work happens behind the scenes, where I build and test how a model behaves. The rest is what someone actually opens, talks to, or makes pictures with.',
        layout: 'grid',
        entries: [
          { title: 'Agent harnesses', description: 'The scaffolding around a model that gives it tools, carries context between steps, and makes a run possible to inspect.' },
          { title: 'Eval suites', description: 'Repeatable test cases for seeing how a system behaves and comparing what changes across prompts, models, and versions.' },
          { title: 'Testing rigs', description: 'Working environments for trying out live interactions and reproducing the cases that are hard to spot in a demo.' },
          { title: 'Conversational voice agents', description: 'Spoken interactions that have to account for timing, interruptions, and the rhythm of a real conversation.' },
          { title: 'Chatbots', description: 'Conversational interfaces that help people through a task and keep track of what’s already happened along the way.' },
          { title: 'Image-generation canvases', description: 'Workspaces for making images, comparing directions, and refining the results as part of a creative process.' },
        ],
        media: { tone: 'green' },
      },
      {
        heading: 'What I bring to a project',
        layout: 'grid',
        entries: [
          { title: 'Prototyping', description: 'I get an idea working early enough for the team to try it. That’s how we find out where the idea has legs and which parts still need work.', topics: ['Working prototypes', 'Technical feasibility', 'Interaction design'] },
          { title: 'Systems and workflows', description: 'I connect the pieces that let a creative team go from a promising experiment to something they can make with again tomorrow.', topics: ['Creative production', 'Data and integrations', 'Reusable workflows'] },
          { title: 'Putting it in people’s hands', description: 'I help people understand what they’re using, where its limits are, and how to change it or build something of their own.', topics: ['Testing and evaluation', 'Team adoption', 'Tools people can extend'] },
        ],
      },
      {
        heading: 'Problems I’ve solved with technology',
        layout: 'grid',
        entries: [
          { title: 'Finding images inside project pages', label: 'Little Plains', description: 'I built the knowledge base behind the studio’s website, chat, and voice experiences. When chat had trouble finding specific images within project pages, I built a visual search canvas to test the results against the actual work.' },
          { title: 'Running a stationery business', label: 'Sugar Paper', description: 'I used Airtable to build a system for Sugar Paper’s day-to-day operations.' },
          { title: 'Taking wholesale orders', label: 'Tattly', description: 'We lost a wholesale order when our Shopify checkout couldn’t handle it. I built a Stripe checkout that night to fit the way wholesale customers needed to order.' },
        ],
      },
    ],
  },
  tools: {
    heading: 'The machine that makes the thing',
    intro: 'When I make a product, I make the tool that makes it. I like figuring out the whole process, from rigs and molds for physical things to apps and workflows for digital products.',
    blocks: [
      {
        heading: 'From the workshop',
        layout: 'rows',
        entries: [
          { title: 'LAB', label: 'Personal tool', description: 'An app I built for my own work. It’s a workspace for designing in 2D and 3D.', media: { tone: 'ink' } },
          { title: 'Explore Art', label: 'Visual search', description: 'A way to explore public art collections by image, color, or description. You can start with a detail in a picture and see where it leads.', media: { image: '/images/explore-art.png', alt: 'Explore Art interface with a selection drawn over a painting' } },
          { title: 'Rigs and molds', label: 'Physical fabrication', description: 'Making a physical thing usually means making something to hold it, form it, or do the same operation twice. I treat those fixtures as part of the design work.', media: { tone: 'green' } },
        ],
      },
      {
        heading: 'More tools I’ve made',
        layout: 'tiles',
        entries: [
          { title: 'Nodes, Nodes, Nodes', label: 'Image generation', description: 'A node-based app for building image-generation workflows.', media: { tone: 'warm' } },
          { title: 'Vector', label: 'Personal image archive', description: 'A search engine that uses embeddings to help me find images I’ve saved as references.', media: { tone: 'cool' } },
          { title: 'Reveal', label: 'Hardware project', description: 'We prototyped a small compute module to help makers bring electronics into physical products. It was my way into hardware.', media: { image: '/images/reveal.jpg', alt: 'Reveal Core module concept alongside example interfaces' } },
        ],
      },
      {
        heading: 'Tools I built for clients',
        layout: 'tiles',
        entries: [
          { title: 'Little Plains', label: 'Studio tools', description: 'I built the knowledge base behind the studio’s website, chat, and voice experiences. I also built a canvas to try out visual search against the studio’s actual work.', media: { tone: 'warm' } },
          { title: 'Pineapple Portal', label: 'Pineapple Productions · Wedding planning', description: 'I built a wedding planning app around the way Pineapple Productions runs an event. The team had been turning constantly changing spreadsheets into PDFs for clients and vendors.', media: { tone: 'ink' } },
        ],
      },
    ],
  },
  community: {
    heading: 'Getting people in the room',
    intro: 'I like getting people in a room when there’s something they’re all trying to figure out. At Nearly Impossible that was how to make and sell a physical product. At Interpolations it was what designers were actually doing with AI. I’ve also learned a lot from communities I got to join, especially the people I worked alongside at StudioMates.',
    events: [
      {
        project: interpolations,
        when: 'October 24, 2025 · New York City',
        description: 'I conceived, curated, and produced this one-day design and AI conference as the first public gathering for I’ve Seen the Future. I wanted to hear how other designers were using AI, so I invited ten people from art, design, education, and technology to share what they were trying. Among them were the Whitney’s creative director and the head of merchandising for the MoMA store.',
        href: 'https://iveseenthefuture.com/',
        linkText: 'Interpolations event site',
      },
      {
        project: nearlyImpossible,
        when: 'Started in 2013 · New York and San Francisco',
        description: 'Lauren O’Neill and I started Nearly Impossible as a community for people who make, brand, and sell physical products. Over three conferences, we brought together founders and designers as selling directly online was taking shape. One early panel asked whether brands should even be on social media.',
        href: nearlyImpossible.href,
        linkText: 'Nearly Impossible project',
      },
    ],
    entries: [
      {
        title: 'StudioMates',
        description: 'I worked out of StudioMates in the early-to-mid 2010s. It was a shared workspace full of designers and people getting new brands off the ground.',
      },
      {
        title: 'The Feast',
        description: 'I worked on community and events for several editions of this social innovation conference.',
      },
      {
        title: 'Skillshare’s Penny Conference',
        description: 'I helped put on Skillshare’s first conference, a 2012 gathering about how people learn.',
      },
      {
        title: 'The 99% Conference',
        description: 'I volunteered at the first two editions of the conference.',
      },
      {
        title: 'CreativeMornings',
        description: 'I wrote the first guide for starting a new chapter, back when there was just one.',
      },
    ],
  },
  'stuff-ive-made': {
    heading: 'Selected work',
    intro: 'Some of this work lived on a phone and some of it sat on a shelf. I’ve helped make temporary tattoos and their packaging, made a welcome kit for people learning to code, and put on conferences. I make smaller things at home, too, like ornaments I print, finish, and photograph myself.',
  },
};
