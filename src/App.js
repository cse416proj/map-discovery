import "./App.css";
import Dropdown from "./components/Dropdown";

function App() {
  return (
    <div className="App">
      <header className="App-header" style={{ margin: '0.5%' }}>Select a file format:</header>
      <Dropdown />
    </div>
  );
}

export default App;
