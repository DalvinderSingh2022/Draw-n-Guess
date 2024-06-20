import React from 'react';
// import { Link } from "react-router-dom";

const NavBar = () => {
    return (
        <nav className='text-center relative text-white text-3xl font-bold m-auto px-9 py-6 bg-yellow-400'>
            {/* <Link to='/'>Link</Link> */}
            <a href="/">Draw 'n Guess</a>
        </nav>
    )
}

export default NavBar;