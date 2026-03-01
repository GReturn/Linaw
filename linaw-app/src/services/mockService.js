const MOCK_NOTEBOOKS = [
  { id: '1', title: 'Introduction to Psychology', file: '/psych.pdf' },
  { id: '2', title: 'Stock Market Basics', file: '/stocks.pdf' },
  { id: '3', title: 'Advanced Calculus', file: '/math.pdf' },
];

export const getNotebooks = () => Promise.resolve(MOCK_NOTEBOOKS);

export const getNotebookById = (id) => 
  Promise.resolve(MOCK_NOTEBOOKS.find(n => n.id === id));