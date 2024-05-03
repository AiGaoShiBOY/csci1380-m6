import './App.scss';
import {TopBar} from './components/TopBar';
import {Container} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import {FaSearch} from 'react-icons/fa';
import {Checkbox} from '@chakra-ui/react';
import {put} from './httpUtils/requestUtils';

function App() {
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedValue, setSelectedValue] = React.useState(1);
  const [results, setResults] = React.useState([]);

  const handleSearchUser = async () => {
    const param = {
      ops: selectedValue,
      keyword: searchValue,
    };
    const resp = await put(param);
    console.log(resp);
    setResults(resp);
  };

  function renderResultItem(item) {
    switch (selectedValue) {
      case 1:
        return `Author: ${item.author}, Number of Papers: ${item.numberOfPapers}`;
      case 2:
        return `Author: ${item.author}, Titles: ${item.titles}`;
      case 3:
        return `Author: ${item.author}, Conferences: ${item.conferences}`;
      default:
        return 'Impossible. selectedValue is neither 1, 2 nor 3';
    }
  }

  return (
    <div>
      <TopBar></TopBar>
      <Container fluid className="d-flex flex-column align-items-center ">
        <Container
          fluid
          className="d-flex flex-column justify-content-center align-items-center main-tab"
          style={{width: '80vw'}}
        >
          <img
            src={`${process.env.PUBLIC_URL}/USENIX_logo.jpeg`}
            alt="icon"
            style={{marginTop: '5vh'}}
          ></img>
          <div className="title">
            DUSE: A DISTRIBUTED SEARCH ENGINE FOR USENIX PAPER
          </div>
          <div className="user-modal-input-container">
            <input
              className="user-modal-input-modal"
              onChange={(e) => setSearchValue(e.target.value)}
            ></input>
            <button className="search-btn" onClick={handleSearchUser}>
              <FaSearch />
            </button>
          </div>
          <div className="checkbox-container">
            <Checkbox
              isChecked={1 === selectedValue}
              className="checkbox"
              onChange={() => {
                setSelectedValue(1);
                setResults([]); // clear results when option changes
              }}
            >
              Search number of papers
            </Checkbox>
            <Checkbox
              isChecked={2 === selectedValue}
              className="checkbox"
              onChange={() => {
                setSelectedValue(2);
                setResults([]); // clear results when option changes
              }}
            >
              List titles of papers
            </Checkbox>
            <Checkbox
              isChecked={3 === selectedValue}
              className="checkbox"
              onChange={() => {
                setSelectedValue(3);
                setResults([]); // clear results when option changes
              }}
            >
              List attended conferences
            </Checkbox>
          </div>
          <div className="result-container">
            {results.map((item, index) => (
              <div key={index} className="result-row">
                {renderResultItem(item)}
              </div>
            ))}
          </div>
        </Container>
      </Container>
    </div>
  );
}

export default App;
