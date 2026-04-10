import coverImage from '../assets/community/devportix-blog-cover.jpg';
import inlineImage from '../assets/community/devportix-blog-inline.jpg';
import githubCoverImage from '../assets/community/blog-github-cover.jpg';
import proofCoverImage from '../assets/community/blog-proof-cover.jpg';
import brandCoverImage from '../assets/community/blog-brand-cover.jpg';
import modernCoverImage from '../assets/community/blog-modern-cover.jpg';
import educationCoverImage from '../assets/community/blog-education-cover.jpg';
import juniorCoverImage from '../assets/community/blog-junior-cover.jpg';
import interviewsCoverImage from '../assets/community/blog-interviews-cover.jpg';
import githubInlineImage from '../assets/community/blog-github-inline.jpg';
import brandInlineImage from '../assets/community/blog-brand-inline.jpg';
import educationInlineImage from '../assets/community/blog-education-inline.jpg';
import modernInlineImage from '../assets/community/blog-modern-inline.jpg';

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
    likeCount: 0,
    upvoteCount: 0,
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
      heroImage: interviewsCoverImage,
      inlineImage,
      imageCredits: [
        'Cover photo: pexels-photo-20432893 via Pexels',
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
  {
    id: 'devportix-editorial-portfolio-mistakes-juniors',
    type: 'blog',
    title: '5 Portfolio Mistakes Junior Developers Make and How to Fix Them',
    content:
      'Junior developers often think a portfolio fails because they need more projects. In reality, many portfolios underperform because they present the right work in the wrong way. A hiring manager may only spend a short time scanning your page, so clarity, proof, and structure matter more than volume.',
    excerpt:
      'A practical DevPortix guide to the most common junior portfolio mistakes and the simple fixes that make work easier to trust, scan, and remember.',
    author: {
      fullName: 'DevPortix Editorial Team',
      role: 'Product Marketing',
    },
    createdAt: '2026-04-10T13:55:00.000Z',
    updatedAt: '2026-04-10T13:55:00.000Z',
    likeCount: 0,
    upvoteCount: 0,
    commentCount: 4,
    isLiked: false,
    isUpvoted: false,
    isOwner: false,
    media: {
      url: juniorCoverImage,
      mimeType: 'image/jpeg',
      originalName: 'blog-junior-cover.jpg',
      size: 0,
    },
    editorialMeta: {
      readingTime: '5 min read',
      category: 'Career Growth',
      tags: ['Portfolio Strategy', 'Junior Developers', 'Hiring', 'Career Growth'],
      heroImage: juniorCoverImage,
      inlineImage: coverImage,
      imageCredits: [
        'Cover photo: pexels-photo-6281028 via Pexels',
        'Inline photo: Jakub Zerdzicki via Pexels',
      ],
      keyStats: [
        { label: 'Mistakes covered', value: '5' },
        { label: 'Fixes per mistake', value: '1' },
        { label: 'Ideal portfolio reads', value: '< 60s' },
      ],
      sections: [
        {
          heading: '1. Listing projects without context',
          body: [
            'A common mistake is showing a project title, a screenshot, and a GitHub link, then expecting the work to explain itself. To you, the project makes sense because you built it. To someone reviewing dozens of portfolios, it may just look like another unfinished app.',
            'Fix it by adding a short summary that explains the problem, your role, the tools you used, and the result. Even two or three clear sentences can completely change how the project feels to a reviewer.',
          ],
        },
        {
          heading: '2. Showing only tutorial or clone projects with no personal thinking',
          body: [
            'Tutorials are useful for learning, but if every project looks like a standard clone with no original decisions, employers struggle to see your real ability. They want evidence that you can think through problems, not just follow steps.',
            'Keep tutorial-based projects if they helped you learn, but explain what you changed, improved, or built beyond the lesson. Added features, design choices, bug fixes, and tradeoffs are the details that make practice feel real.',
          ],
        },
        {
          heading: '3. Making big claims without evidence',
          body: [
            'Many junior portfolios use phrases like "passionate developer," "problem solver," or "I build scalable apps." These are not bad statements, but on their own they do not create trust. Anyone can write them.',
            'Replace claims with proof: screenshots, live demos, GitHub repositories, commit history, metrics, or a short explanation of the hard part you solved. Let evidence carry the weight of the story.',
          ],
        },
        {
          heading: '4. Making the portfolio hard to scan',
          body: [
            'Some portfolios are overloaded with text, unclear sections, too many colors, or confusing layouts. Even strong work loses impact when the presentation feels crowded or disorganized.',
            'Use a clear headline, short sections, strong spacing, and a predictable project structure. A hiring manager should be able to scan your page in under a minute and still understand your strengths.',
          ],
        },
        {
          heading: '5. Forgetting to show growth',
          body: [
            'A portfolio should not feel frozen in time. One of the strongest signals junior developers can show is progress. Employers know you are still learning. What they want to see is momentum.',
            'Document what changed after feedback, what you refactored, what you would do differently now, or how a newer project improved on an older one. Growth makes your portfolio feel alive.',
          ],
        },
      ],
      quote:
        'A junior portfolio does not need to look massive. It needs to feel honest, readable, and backed by proof.',
      closing:
        'A strong junior portfolio does not need to be huge. It needs to be believable, readable, and rooted in proof. DevPortix helps turn projects, growth, and real development work into a portfolio story employers can understand quickly and trust more easily.',
    },
  },
  {
    id: 'devportix-editorial-github-to-hire-ready',
    type: 'blog',
    title: 'From GitHub Repo to Hire-Ready Story: What Recruiters Actually Want to See',
    content:
      'A repository can prove that work exists, but it rarely explains why the work matters. DevPortix helps bridge the gap between raw code and a hire-ready narrative recruiters can scan quickly and understand with confidence.',
    excerpt:
      'A DevPortix guide to turning GitHub activity into a clearer portfolio story that recruiters and hiring managers can actually evaluate.',
    author: {
      fullName: 'DevPortix Editorial Team',
      role: 'Product Marketing',
    },
    createdAt: '2026-04-10T14:10:00.000Z',
    updatedAt: '2026-04-10T14:10:00.000Z',
    likeCount: 0,
    upvoteCount: 0,
    commentCount: 3,
    isLiked: false,
    isUpvoted: false,
    isOwner: false,
    media: {
      url: githubCoverImage,
      mimeType: 'image/jpeg',
      originalName: 'blog-github-cover.jpg',
      size: 0,
    },
    editorialMeta: {
      readingTime: '5 min read',
      category: 'GitHub Strategy',
      tags: ['GitHub', 'Recruiting', 'Portfolio Strategy', 'Hiring'],
      heroImage: githubCoverImage,
      inlineImage: githubInlineImage,
      imageCredits: [
        'Cover photo: pexels-photo-5483075 via Pexels',
        'Inline photo: pexels-photo-574071 via Pexels',
      ],
      keyStats: [
        { label: 'Core links to show', value: '3' },
        { label: 'Repo story sections', value: '4' },
        { label: 'Recruiter scan time', value: '< 1 min' },
      ],
      sections: [
        {
          heading: 'A repo is evidence, not the whole story',
          body: [
            'Recruiters rarely judge a candidate from raw repository structure alone. They are trying to understand what was built, what role you played, and whether the work signals readiness for real teams.',
            'That is why a portfolio should translate code into a story. The repo proves the work exists. The portfolio explains why the work deserves attention.',
          ],
        },
        {
          heading: 'Highlight the parts that matter most',
          body: [
            'A strong GitHub-backed portfolio points to a live demo, the source repository, and a short explanation of the outcome. That combination gives both technical and non-technical reviewers a path into the work.',
            'Show specific signals like a meaningful commit series, a pull request you are proud of, or a problem you solved under pressure.',
          ],
        },
        {
          heading: 'Explain decisions, not just tools',
          body: [
            'Many portfolios list stacks without explaining why those choices were made. Hiring managers want to see judgment. They want to understand your thinking.',
            'Use a short case-study format that explains the problem, your approach, a tradeoff, and what changed after shipping.',
          ],
        },
        {
          heading: 'Make the bridge easy to follow',
          body: [
            'The more friction there is between your repo and your story, the more likely someone is to stop reading. Keep links obvious, summaries short, and proof close to the project description.',
            'DevPortix makes GitHub evidence easier to frame inside a portfolio that feels understandable at first glance.',
          ],
        },
      ],
      quote:
        'GitHub proves that code was written. A portfolio explains why that code matters.',
      closing:
        'When GitHub activity is paired with context, outcomes, and clear project framing, it becomes much easier for recruiters to see your readiness. DevPortix helps turn repositories into narratives people can trust.',
    },
  },
  {
    id: 'devportix-editorial-proof-beats-claims',
    type: 'blog',
    title: 'Why Proof Beats Claims in a Developer Portfolio',
    content:
      'Hiring teams are surrounded by strong adjectives and vague self-descriptions. Proof stands out because it is concrete. DevPortix is built around the idea that portfolios should demonstrate value, not just describe it.',
    excerpt:
      'A DevPortix editorial on why screenshots, commits, outcomes, and context create more trust than broad claims ever can.',
    author: {
      fullName: 'DevPortix Editorial Team',
      role: 'Product Marketing',
    },
    createdAt: '2026-04-10T14:20:00.000Z',
    updatedAt: '2026-04-10T14:20:00.000Z',
    likeCount: 0,
    upvoteCount: 0,
    commentCount: 2,
    isLiked: false,
    isUpvoted: false,
    isOwner: false,
    media: {
      url: proofCoverImage,
      mimeType: 'image/jpeg',
      originalName: 'blog-proof-cover.jpg',
      size: 0,
    },
    editorialMeta: {
      readingTime: '4 min read',
      category: 'Portfolio Strategy',
      tags: ['Proof of Work', 'Hiring', 'Portfolio Strategy', 'Career Growth'],
      heroImage: proofCoverImage,
      inlineImage: githubInlineImage,
      imageCredits: [
        'Cover photo: pexels-photo-3862142 via Pexels',
        'Inline photo: pexels-photo-574071 via Pexels',
      ],
      keyStats: [
        { label: 'Claims replaced', value: '3+' },
        { label: 'Proof formats', value: '5' },
        { label: 'Trust signal', value: 'High' },
      ],
      sections: [
        {
          heading: 'Claims are easy to write',
          body: [
            'Anyone can say they are detail-oriented, collaborative, or passionate about development. Those phrases are common, but they do not help a reviewer measure your work.',
            'Proof works better because it reduces uncertainty. It lets someone see the difference between a description and a result.',
          ],
        },
        {
          heading: 'Proof creates trust faster',
          body: [
            'Screenshots, shipped features, code history, demos, metrics, and short explanations all help a reviewer move from doubt to confidence more quickly.',
            'The goal is not to overwhelm someone with material. The goal is to put the right evidence in the right place.',
          ],
        },
        {
          heading: 'Context makes proof stronger',
          body: [
            'A screenshot without context can still feel shallow. A screenshot paired with the problem, your role, and the outcome becomes persuasive.',
            'That is why the best portfolios combine artifacts with explanation. Proof becomes more powerful when people understand what they are looking at.',
          ],
        },
        {
          heading: 'Build your portfolio around evidence',
          body: [
            'Instead of asking what sounds impressive, ask what helps another person believe the work. That mindset changes the entire portfolio structure.',
            'DevPortix helps organize projects, progress, and outcomes into a portfolio that leads with evidence first.',
          ],
        },
      ],
      quote:
        'A portfolio becomes stronger the moment it stops asking people to believe and starts helping them verify.',
      closing:
        'Proof beats claims because trust is earned through visible work. DevPortix is designed to help developers present that proof clearly, consistently, and with less friction.',
    },
  },
  {
    id: 'devportix-editorial-brand-while-learning',
    type: 'blog',
    title: "Building a Developer Brand While You're Still Learning",
    content:
      'You do not have to wait until you feel "finished" to build a professional presence. A developer brand is really the consistent story people associate with your work, your curiosity, and your growth over time.',
    excerpt:
      'A DevPortix guide for students and junior developers who want to build a credible professional identity while they are still learning in public.',
    author: {
      fullName: 'DevPortix Editorial Team',
      role: 'Product Marketing',
    },
    createdAt: '2026-04-10T14:30:00.000Z',
    updatedAt: '2026-04-10T14:30:00.000Z',
    likeCount: 0,
    upvoteCount: 0,
    commentCount: 2,
    isLiked: false,
    isUpvoted: false,
    isOwner: false,
    media: {
      url: brandCoverImage,
      mimeType: 'image/jpeg',
      originalName: 'blog-brand-cover.jpg',
      size: 0,
    },
    editorialMeta: {
      readingTime: '5 min read',
      category: 'Personal Brand',
      tags: ['Personal Brand', 'Students', 'Career Growth', 'Portfolio Strategy'],
      heroImage: brandCoverImage,
      inlineImage: brandInlineImage,
      imageCredits: [
        'Cover photo: pexels-photo-8199167 via Pexels',
        'Inline photo: pexels-photo-4385543 via Pexels',
      ],
      keyStats: [
        { label: 'Brand signals', value: '4' },
        { label: 'Best starting point', value: 'Consistency' },
        { label: 'Need experience first?', value: 'No' },
      ],
      sections: [
        {
          heading: 'A brand is not a logo',
          body: [
            'For developers, a brand is the pattern people notice in your work. It is the combination of how you build, what you care about, and how clearly you communicate.',
            'That means your developer brand can start long before you feel senior. It begins when your work becomes consistent enough for people to recognize.',
          ],
        },
        {
          heading: 'Document what you are learning',
          body: [
            'You do not need to pretend to know everything. In fact, thoughtful learning logs, project writeups, and reflections can make you more credible because they show progress honestly.',
            'The key is to share learning with structure. Explain what you tried, what worked, what failed, and what changed afterward.',
          ],
        },
        {
          heading: 'Choose a few clear signals',
          body: [
            'Strong early-stage brands often emerge from repeat patterns: maybe you care about clean UI, accessibility, developer tooling, automation, or teaching others.',
            'You do not need to force a niche immediately. You just need to notice what themes keep appearing in your work and make them easier to see.',
          ],
        },
        {
          heading: 'Make your work easy to remember',
          body: [
            'A portfolio should make someone think, "I know what this person is about." That comes from clear headlines, thoughtful project framing, and visible growth.',
            'DevPortix helps bring those signals together in one place so your professional identity becomes easier to understand over time.',
          ],
        },
      ],
      quote:
        'You do not build a developer brand by acting finished. You build it by showing consistent progress clearly.',
      closing:
        'A strong developer brand can begin while you are still learning. DevPortix helps you turn that learning, project work, and momentum into a portfolio identity people can recognize and trust.',
    },
  },
  {
    id: 'devportix-editorial-modern-portfolio-2026',
    type: 'blog',
    title: 'What Makes a Modern Developer Portfolio Feel Professional in 2026',
    content:
      'Professional portfolios feel clear, intentional, and credible. In 2026, the difference is less about flashy effects and more about how well the work is organized, explained, and supported by proof.',
    excerpt:
      'A DevPortix editorial on the design, content, and proof signals that make a developer portfolio feel polished and current in 2026.',
    author: {
      fullName: 'DevPortix Editorial Team',
      role: 'Product Marketing',
    },
    createdAt: '2026-04-10T14:40:00.000Z',
    updatedAt: '2026-04-10T14:40:00.000Z',
    likeCount: 0,
    upvoteCount: 0,
    commentCount: 3,
    isLiked: false,
    isUpvoted: false,
    isOwner: false,
    media: {
      url: modernCoverImage,
      mimeType: 'image/jpeg',
      originalName: 'blog-modern-cover.jpg',
      size: 0,
    },
    editorialMeta: {
      readingTime: '5 min read',
      category: 'Design & Portfolio',
      tags: ['Portfolio Design', 'Professionalism', 'Hiring', 'UX'],
      heroImage: modernCoverImage,
      inlineImage: modernInlineImage,
      imageCredits: [
        'Cover photo: pexels-photo-7776955 via Pexels',
        'Inline photo: pexels-photo-20432872 via Pexels',
      ],
      keyStats: [
        { label: 'Core sections', value: '4' },
        { label: 'Best first impression', value: 'Clarity' },
        { label: 'Design priority', value: 'Readability' },
      ],
      sections: [
        {
          heading: 'Professional does not mean over-designed',
          body: [
            'The most effective portfolios feel composed, not crowded. Typography, spacing, and structure do more for professionalism than visual noise ever will.',
            'A modern portfolio should guide attention, not compete for it. Readers should know where to look next without effort.',
          ],
        },
        {
          heading: 'Good portfolios explain the work',
          body: [
            'A polished layout is helpful, but professionalism comes from the combination of good design and good storytelling. Each project should make the problem, your role, and the outcome easy to understand.',
            'Clarity is a form of maturity. It tells employers you can communicate your work well, not just produce it.',
          ],
        },
        {
          heading: 'Proof is part of the design',
          body: [
            'The strongest modern portfolios integrate proof directly into the experience through screenshots, metrics, repositories, demos, and progress updates.',
            'This is where a portfolio starts to feel trustworthy. The design supports the evidence instead of distracting from it.',
          ],
        },
        {
          heading: 'Consistency makes the whole thing feel premium',
          body: [
            'When headings, spacing, project layouts, and voice all feel consistent, the portfolio becomes easier to scan and more memorable.',
            'DevPortix helps structure that consistency so professionalism is not just visual. It becomes part of how the work is presented.',
          ],
        },
      ],
      quote:
        'A modern portfolio feels professional when it is easy to trust, easy to scan, and easy to remember.',
      closing:
        'Professional portfolios in 2026 feel intentional because they combine clean design with clear proof. DevPortix helps developers build that balance without losing the story behind the work.',
    },
  },
  {
    id: 'devportix-editorial-bootcamps-track-growth',
    type: 'blog',
    title: 'How Instructors and Bootcamps Can Track Real Student Growth With Portfolios',
    content:
      'Portfolios should not only be used at the end of learning. They can also be used throughout the learning process to document progress, feedback, revision, and real skill development in a way grades alone cannot capture.',
    excerpt:
      'A DevPortix guide to using portfolios as a real growth-tracking system for instructors, bootcamps, and training programs.',
    author: {
      fullName: 'DevPortix Editorial Team',
      role: 'Product Marketing',
    },
    createdAt: '2026-04-10T14:50:00.000Z',
    updatedAt: '2026-04-10T14:50:00.000Z',
    likeCount: 0,
    upvoteCount: 0,
    commentCount: 2,
    isLiked: false,
    isUpvoted: false,
    isOwner: false,
    media: {
      url: educationCoverImage,
      mimeType: 'image/jpeg',
      originalName: 'blog-education-cover.jpg',
      size: 0,
    },
    editorialMeta: {
      readingTime: '6 min read',
      category: 'Education',
      tags: ['Instructors', 'Bootcamps', 'Student Growth', 'Portfolios'],
      heroImage: educationCoverImage,
      inlineImage: educationInlineImage,
      imageCredits: [
        'Cover photo: pexels-photo-20432916 via Pexels',
        'Inline photo: pexels-photo-8199133 via Pexels',
      ],
      keyStats: [
        { label: 'Growth checkpoints', value: '4+' },
        { label: 'Feedback loops', value: 'Ongoing' },
        { label: 'Best for', value: 'Cohorts' },
      ],
      sections: [
        {
          heading: 'Grades alone hide the shape of learning',
          body: [
            'A single score can show whether a student passed, but it rarely shows how their skills are evolving. That makes it hard for instructors to measure progress with nuance.',
            'Portfolios help because they capture outputs, iterations, reflections, and evidence of change over time.',
          ],
        },
        {
          heading: 'Portfolios create visible learning history',
          body: [
            'When students collect projects, revisions, and feedback in one place, growth becomes easier to track. Instructors can see patterns instead of isolated submissions.',
            'That history becomes useful for both teaching and mentorship because it reveals where progress is accelerating and where support is still needed.',
          ],
        },
        {
          heading: 'Feedback becomes more actionable',
          body: [
            'A portfolio-based system makes feedback easier to connect to actual work. Instead of abstract advice, students can see how comments shaped revisions across multiple projects.',
            'This creates a more meaningful learning loop because improvement is visible, not assumed.',
          ],
        },
        {
          heading: 'The same system supports student outcomes',
          body: [
            'Portfolios are also valuable after the classroom. The work students build during learning can become the foundation of a public-facing professional story.',
            'DevPortix helps instructors and programs track growth while also helping students leave with something meaningful to show employers.',
          ],
        },
      ],
      quote:
        'The clearest picture of student growth is often not in the gradebook. It is in the pattern of work over time.',
      closing:
        'For instructors and bootcamps, portfolios can be more than a showcase. They can become a real system for tracking development, feedback, and readiness. DevPortix is built to support that full journey.',
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
