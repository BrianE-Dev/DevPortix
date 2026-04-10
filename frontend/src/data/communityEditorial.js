import coverImage from '../assets/community/devportix-blog-cover.jpg';
import inlineImage from '../assets/community/devportix-blog-inline.jpg';

export const DEVPORTIX_BLOG_TOPICS = [
  'How Developers Can Turn Projects Into a Portfolio That Gets Interviews',
  'From GitHub Repo to Hire-Ready Story: What Recruiters Actually Want to See',
  '5 Portfolio Mistakes Junior Developers Make and How to Fix Them',
  'Why Proof Beats Claims in a Developer Portfolio',
  "Building a Developer Brand While You're Still Learning",
  'What Makes a Modern Developer Portfolio Feel Professional in 2026',
  'How Instructors and Bootcamps Can Track Real Student Growth With Portfolios',
];

export const DEVPORTIX_EDITORIAL_BLOGS = [
  {
    id: 'devportix-editorial-portfolio-gets-interviews',
    type: 'blog',
    title: 'How Developers Can Turn Projects Into a Portfolio That Gets Interviews',
    content:
      'A great developer portfolio is not a gallery of random repos. It is a hiring story built from proof. This DevPortix guide shows how to turn real projects, commits, demos, and reflections into a portfolio that helps employers understand what you can do and why they should talk to you.',
    excerpt:
      'A practical DevPortix guide to turning side projects, coursework, freelance work, and shipped features into a clear portfolio story that earns trust and interview interest.',
    author: {
      fullName: 'DevPortix Editorial Team',
      role: 'Product Marketing',
    },
    createdAt: '2026-04-10T09:00:00.000Z',
    updatedAt: '2026-04-10T09:00:00.000Z',
    likeCount: 42,
    upvoteCount: 42,
    commentCount: 6,
    isLiked: false,
    isUpvoted: false,
    isOwner: false,
    media: {
      url: coverImage,
      mimeType: 'image/jpeg',
      originalName: 'devportix-blog-cover.jpg',
      size: 0,
    },
    editorialMeta: {
      readingTime: '6 min read',
      category: 'Career Growth',
      tags: ['Portfolio Strategy', 'Career Growth', 'GitHub', 'Hiring'],
      heroImage: coverImage,
      inlineImage,
      imageCredits: [
        'Cover photo: Jakub Zerdzicki via Pexels',
        'Inline photo: Mizuno K via Pexels',
      ],
      keyStats: [
        { label: 'Projects to feature', value: '3-5' },
        { label: 'Proof points per project', value: '4' },
        { label: 'Recruiter skim time', value: '< 60s' },
      ],
      sections: [
        {
          heading: 'Start with proof, not polish',
          body: [
            'Many developers wait too long because they think a portfolio has to look perfect before it can be useful. In practice, hiring teams are looking for evidence: what you built, what decisions you made, how you solved problems, and what happened after you shipped.',
            'That means screenshots, live links, GitHub commits, short writeups, code excerpts, before-and-after improvements, and outcomes all matter more than decorative filler. A cleaner story beats a louder design every time.',
          ],
        },
        {
          heading: 'Choose projects that show range',
          body: [
            'The strongest portfolios usually include three to five projects with distinct signals. One can show product thinking, one can show technical depth, one can show collaboration, and one can show consistency over time.',
            'If you are still early in your career, coursework, hackathons, internships, volunteer builds, and thoughtful practice projects all count. The goal is not prestige. The goal is showing the kind of work you can repeat in a real environment.',
          ],
        },
        {
          heading: 'Write each project like a mini case study',
          body: [
            'A project entry becomes much stronger when it answers a few simple questions: What problem were you solving? What was your role? What constraints shaped the work? What did you build? What tradeoffs did you make? What changed because the project shipped?',
            'This is where many portfolios lose momentum. They list features instead of decisions. Employers want to understand your judgment. A short paragraph about a difficult tradeoff often does more for credibility than a long list of tools.',
          ],
        },
        {
          heading: 'Use GitHub as supporting evidence, not the whole story',
          body: [
            'GitHub is powerful, but by itself it rarely tells a complete story. Repositories can look sparse, chaotic, or too technical for non-engineering reviewers. Your portfolio should act like a bridge between raw project history and a clear professional narrative.',
            'That means linking to the repo, highlighting a few important commits or pull requests, and explaining what changed in human language. DevPortix works best when GitHub activity becomes supporting proof inside a structured project story.',
          ],
        },
        {
          heading: 'Show growth across time',
          body: [
            'Interview-worthy portfolios do not just prove that you shipped once. They show that you are improving. Include updates, follow-up versions, lessons learned, refactors, performance gains, mentorship feedback, or new releases that happened after the first launch.',
            'Growth is compelling because it signals coachability and momentum. Even small improvements become impressive when they are documented well.',
          ],
        },
        {
          heading: 'End with a clear reason to reach out',
          body: [
            'Once a hiring manager believes your work is real, you want the next step to feel easy. Keep your headline specific, your role interests visible, and your contact path obvious. A strong portfolio lowers friction. It should answer questions before someone asks them.',
            'The best result is simple: someone opens your portfolio, understands your value quickly, and can imagine you contributing to their team.',
          ],
        },
      ],
      quote:
        'A portfolio should not just say "I can code." It should make someone feel the quality of your thinking before the interview starts.',
      closing:
        'DevPortix is built for exactly this kind of storytelling. When your projects, progress, proof, and context live in one place, your portfolio becomes easier to trust and much easier to remember.',
    },
  },
];

export const DEVPORTIX_BLOG_TEMPLATES = [
  {
    id: 'template-portfolio-mistakes-juniors',
    title: '5 Portfolio Mistakes Junior Developers Make and How to Fix Them',
    category: 'Career Growth',
    recommendedCoverNote: 'Use a realistic workspace, portfolio review, or coding desk image.',
    excerpt:
      'A practical DevPortix draft that helps junior developers spot the most common portfolio mistakes and replace them with stronger proof, clearer storytelling, and better hiring signals.',
    tags: ['Portfolio Strategy', 'Junior Developers', 'Hiring', 'Career Growth'],
    checklist: [
      'Open with one clear hiring problem the post solves.',
      'Use short subheadings and practical examples.',
      'End each mistake with a fix readers can apply immediately.',
      'Add one realistic cover image before publishing.',
      'Finish with a DevPortix-specific closing paragraph.',
    ],
    content: `Intro
Junior developers often think a portfolio fails because they need more projects. In reality, many portfolios underperform because they present the right work in the wrong way. A hiring manager may only spend a short time scanning your page, so clarity, proof, and structure matter more than volume.

Mistake 1: Listing projects without context
What goes wrong:
Many junior developers show a title, a screenshot, and a GitHub link, then expect the project to explain itself.

How to fix it:
Add a short project summary that explains the problem, your role, the tools you used, and the result. Keep it simple and human. Make it easy for someone to understand why the project mattered.

Mistake 2: Showing only school or tutorial clones with no reflection
What goes wrong:
Tutorial-based work can be useful, but if every project looks identical and has no personal thinking behind it, employers struggle to see your real decision-making.

How to fix it:
Show what you changed, improved, or explored beyond the tutorial. Mention the design choices, tradeoffs, bugs solved, or features you added independently.

Mistake 3: Hiding proof behind vague claims
What goes wrong:
Saying "I am passionate about coding" or "I build scalable apps" does not create trust on its own.

How to fix it:
Replace claims with proof. Use screenshots, live demos, GitHub links, commit history, metrics, and short explanations of what you actually built. Let evidence do the talking.

Mistake 4: Making the portfolio hard to scan
What goes wrong:
Dense paragraphs, unclear headings, and cluttered layouts make good work feel weaker than it really is.

How to fix it:
Use a clear headline, short sections, strong spacing, and a predictable project structure. A hiring manager should be able to scan your portfolio quickly and still understand your strengths.

Mistake 5: Forgetting to show growth
What goes wrong:
Some junior portfolios feel static. They show one version of the work but nothing about improvement, iteration, or learning.

How to fix it:
Document progress. Mention what changed after feedback, what you refactored, what you would do differently now, or how a newer project improved on an older one.

Closing
A strong junior portfolio does not need to be huge. It needs to be believable, readable, and rooted in proof. DevPortix helps turn projects, growth, and real development work into a portfolio story employers can understand quickly and trust more easily.`
  },
];
