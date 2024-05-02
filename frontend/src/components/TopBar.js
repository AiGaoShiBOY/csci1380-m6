import React from 'react';
import {Navbar, Nav, Container} from 'react-bootstrap';
import './styles/TopBar.scss';
import {FaGithub} from 'react-icons/fa';

export const TopBar = React.memo(function TopBar() {
  const handleIconClick = () => {
    window.open('https://github.com/AiGaoShiBOY/csci1380-m6', '_blank');
  };

  return (
    <>
      <Navbar className="shadow navbar-custom">
        <Container
          fluid
          className="justify-content-start justify-content-md-between brand-container"
        >
          <Navbar.Brand href="/">
            <div className="brand">DUSE</div>
          </Navbar.Brand>
          <Nav className="ms-auto align-items-center">
            <FaGithub className="icon" onClick={handleIconClick}></FaGithub>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
});
