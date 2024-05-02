import logo from './logo.svg';
import './App.scss';
import {TopBar} from './components/TopBar';
import {Container} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import {FaSearch} from 'react-icons/fa';
import {Checkbox, CheckboxGroup} from '@chakra-ui/react';
import {put} from './httpUtils/requestUtils';

function App() {
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedValue, setSelectedValue] = React.useState(1);

  const handleSearchUser = async () => {
    const param = {
      ops: selectedValue,
      keyWord: searchValue,
    };
    const resp = await put(param);
    console.log(resp);
  };

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
              }}
            >
              Search number of papers
            </Checkbox>
            <Checkbox
              isChecked={2 === selectedValue}
              className="checkbox"
              onChange={() => {
                setSelectedValue(2);
              }}
            >
              List titles of papers
            </Checkbox>
            <Checkbox
              isChecked={3 === selectedValue}
              className="checkbox"
              onChange={() => {
                setSelectedValue(3);
              }}
            >
              List attended conferences
            </Checkbox>
          </div>
        </Container>
      </Container>
    </div>
  );
}

export default App;
