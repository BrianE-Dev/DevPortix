const QUIZ_TRACKS = {
  html: {
    label: 'HTML',
    questions: [
      {
        id: 'html-1',
        prompt: 'What does HTML stand for?',
        options: [
          'Hyper Text Markup Language',
          'High Transfer Machine Language',
          'Hyperlink and Text Management Language',
          'Home Tool Markup Language',
        ],
        correctIndex: 0,
      },
      {
        id: 'html-2',
        prompt: 'Which HTML element is used for the largest heading?',
        options: ['<heading>', '<h6>', '<h1>', '<head>'],
        correctIndex: 2,
      },
      {
        id: 'html-3',
        prompt: 'Which element is used to create a hyperlink?',
        options: ['<a>', '<link>', '<href>', '<url>'],
        correctIndex: 0,
      },
      {
        id: 'html-4',
        prompt: 'Which attribute provides alternate text for an image?',
        options: ['title', 'src', 'alt', 'name'],
        correctIndex: 2,
      },
      {
        id: 'html-5',
        prompt: 'Which element is used to define a table row?',
        options: ['<td>', '<tr>', '<th>', '<table-row>'],
        correctIndex: 1,
      },
      {
        id: 'html-6',
        prompt: 'Which input type masks typed characters?',
        options: ['text', 'secure', 'password', 'hidden'],
        correctIndex: 2,
      },
      {
        id: 'html-7',
        prompt: 'Where should the `<title>` tag be placed?',
        options: ['Inside `<body>`', 'Inside `<head>`', 'Inside `<footer>`', 'Inside `<section>`'],
        correctIndex: 1,
      },
      {
        id: 'html-8',
        prompt: 'Which semantic element represents main page content?',
        options: ['<main>', '<content>', '<section>', '<article>'],
        correctIndex: 0,
      },
      {
        id: 'html-9',
        prompt: 'What is the correct HTML element for an unordered list?',
        options: ['<ol>', '<list>', '<ul>', '<li>'],
        correctIndex: 2,
      },
      {
        id: 'html-10',
        prompt: 'Which tag is used to embed JavaScript in HTML?',
        options: ['<js>', '<script>', '<javascript>', '<code>'],
        correctIndex: 1,
      },
    ],
  },
  css: {
    label: 'CSS',
    questions: [
      {
        id: 'css-1',
        prompt: 'What does CSS stand for?',
        options: [
          'Creative Style System',
          'Cascading Style Sheets',
          'Colorful Style Syntax',
          'Computer Style Sheets',
        ],
        correctIndex: 1,
      },
      {
        id: 'css-2',
        prompt: 'Which property controls text size?',
        options: ['font-style', 'text-size', 'font-size', 'size'],
        correctIndex: 2,
      },
      {
        id: 'css-3',
        prompt: 'How do you select an element with id `hero`?',
        options: ['.hero', '#hero', '*hero', 'hero'],
        correctIndex: 1,
      },
      {
        id: 'css-4',
        prompt: 'Which property adds space inside an element border?',
        options: ['margin', 'spacing', 'padding', 'gap'],
        correctIndex: 2,
      },
      {
        id: 'css-5',
        prompt: 'Which value makes a flex container stack items vertically?',
        options: ['row', 'column', 'wrap', 'vertical'],
        correctIndex: 1,
      },
      {
        id: 'css-6',
        prompt: 'Which property changes text color?',
        options: ['font-color', 'text-color', 'color', 'foreground'],
        correctIndex: 2,
      },
      {
        id: 'css-7',
        prompt: 'Which rule helps make layouts responsive?',
        options: ['@media', '@screen', '@responsive', '@layout'],
        correctIndex: 0,
      },
      {
        id: 'css-8',
        prompt: 'Which unit is relative to the root font size?',
        options: ['px', 'em', 'rem', '%'],
        correctIndex: 2,
      },
      {
        id: 'css-9',
        prompt: 'Which property rounds element corners?',
        options: ['corner-radius', 'border-round', 'border-radius', 'radius'],
        correctIndex: 2,
      },
      {
        id: 'css-10',
        prompt: 'Which value hides an element but keeps its space?',
        options: ['display: none', 'visibility: hidden', 'opacity: 0', 'position: hidden'],
        correctIndex: 1,
      },
    ],
  },
  javascript: {
    label: 'JavaScript',
    questions: [
      {
        id: 'javascript-1',
        prompt: 'Which keyword declares a block-scoped variable?',
        options: ['var', 'let', 'const and let', 'define'],
        correctIndex: 2,
      },
      {
        id: 'javascript-2',
        prompt: 'Which array method creates a new array with transformed items?',
        options: ['forEach', 'map', 'filter', 'reduce'],
        correctIndex: 1,
      },
      {
        id: 'javascript-3',
        prompt: 'What is the result type of `Promise.resolve(5)`?',
        options: ['number', 'object', 'promise', 'string'],
        correctIndex: 2,
      },
      {
        id: 'javascript-4',
        prompt: 'Which operator checks value and type equality?',
        options: ['==', '===', '!=', '='],
        correctIndex: 1,
      },
      {
        id: 'javascript-5',
        prompt: 'Which statement is used to handle errors?',
        options: ['handle/catch', 'try/catch', 'error/catch', 'throw/catch'],
        correctIndex: 1,
      },
      {
        id: 'javascript-6',
        prompt: 'What does `JSON.parse()` do?',
        options: [
          'Converts object to JSON string',
          'Converts JSON string to JavaScript value',
          'Validates a JSON file',
          'Formats JSON text',
        ],
        correctIndex: 1,
      },
      {
        id: 'javascript-7',
        prompt: 'Which function schedules code to run once after a delay?',
        options: ['setInterval', 'setTimeout', 'requestFrame', 'delayRun'],
        correctIndex: 1,
      },
      {
        id: 'javascript-8',
        prompt: 'Which method removes the last item of an array?',
        options: ['shift', 'remove', 'pop', 'slice'],
        correctIndex: 2,
      },
      {
        id: 'javascript-9',
        prompt: 'Which keyword exits a function and optionally returns a value?',
        options: ['break', 'yield', 'return', 'exit'],
        correctIndex: 2,
      },
      {
        id: 'javascript-10',
        prompt: 'What does `NaN` represent?',
        options: ['Negative and Null', 'Not a Number', 'New and Null', 'No assigned Name'],
        correctIndex: 1,
      },
    ],
  },
  react: {
    label: 'React',
    questions: [
      {
        id: 'react-1',
        prompt: 'What is JSX?',
        options: [
          'A CSS extension',
          'A syntax extension for JavaScript',
          'A database query language',
          'A React deployment tool',
        ],
        correctIndex: 1,
      },
      {
        id: 'react-2',
        prompt: 'Which hook stores local component state?',
        options: ['useMemo', 'useRef', 'useState', 'useEffect'],
        correctIndex: 2,
      },
      {
        id: 'react-3',
        prompt: 'Which hook is commonly used for side effects?',
        options: ['useEffect', 'useReducer', 'useContext', 'useLayout'],
        correctIndex: 0,
      },
      {
        id: 'react-4',
        prompt: 'What prop helps React efficiently update lists?',
        options: ['index', 'id', 'name', 'key'],
        correctIndex: 3,
      },
      {
        id: 'react-5',
        prompt: 'Props in React are:',
        options: ['Mutable inside child', 'Read-only inputs', 'Only for classes', 'Global variables'],
        correctIndex: 1,
      },
      {
        id: 'react-6',
        prompt: 'Which hook can share data deeply without prop drilling?',
        options: ['useContext', 'useRef', 'useMemo', 'useDebug'],
        correctIndex: 0,
      },
      {
        id: 'react-7',
        prompt: 'A React component must return:',
        options: ['Only strings', 'Multiple roots with no wrapper', 'Valid JSX (or null)', 'Only arrays'],
        correctIndex: 2,
      },
      {
        id: 'react-8',
        prompt: 'Which command creates a React element in plain JavaScript?',
        options: ['React.createElement', 'React.new', 'React.make', 'JSX.create'],
        correctIndex: 0,
      },
      {
        id: 'react-9',
        prompt: 'When does a component re-render?',
        options: [
          'Only on page refresh',
          'When props or state change',
          'Only when parent refreshes manually',
          'Never in functional components',
        ],
        correctIndex: 1,
      },
      {
        id: 'react-10',
        prompt: 'Which hook memoizes a computed value?',
        options: ['useEffect', 'useCallback', 'useMemo', 'useState'],
        correctIndex: 2,
      },
    ],
  },
};

const TRACK_KEYS = Object.keys(QUIZ_TRACKS);

const normalizeTrack = (track) => String(track || '').trim().toLowerCase();

const resolveTrackKey = (track) => {
  const normalized = normalizeTrack(track);
  if (normalized === 'js') return 'javascript';
  return TRACK_KEYS.includes(normalized) ? normalized : '';
};

const getTrackQuestions = (track) => {
  const key = resolveTrackKey(track);
  if (!key) return null;
  return QUIZ_TRACKS[key].questions;
};

module.exports = {
  QUIZ_TRACKS,
  TRACK_KEYS,
  resolveTrackKey,
  getTrackQuestions,
};
