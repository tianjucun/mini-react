import { createRoot } from 'react-dom/client';

let __showReactDOMLi = false;

function App() {
  const handleToggleClick = () => {
    __showReactDOMLi = !__showReactDOMLi;
    console.log(__showReactDOMLi);
  };
  return (
    <ul onClick={handleToggleClick}>
      <li>React</li>
      {__showReactDOMLi && <li>ReactDOM</li>}
    </ul>
  );
}
const root = createRoot(document.getElementById('root'));
const element1 = (
  <p>
    <span>1</span>
    <span>2</span>
  </p>
);
const element2 = <span>2</span>;

root.render(element1);

document.body.addEventListener('click', () => {
  console.log('click to change render');
  root.render(element2);
});

// createRoot(document.getElementById('root')).render(<App />);
